import { z } from "zod";

import {
  ChatMessage,
  ChatParticipant,
  Chatroom,
  SendMessageInput,
  chatMessageSchema,
  sendMessageInputSchema,
  userSchema,
  User,
} from "@/lib/types";

import { API_BASE_URL } from "../env";
import { ApiQueryOptions, apiClient } from "./shared";

const chatroomIdResponseSchema = z
  .union([
    z.string(),
    z.object({ id: z.string() }),
  ])
  .transform((data) => (typeof data === "string" ? data : data.id));

const participantResponseSchema = z
  .object({
    room_id: z.string(),
    user_id: z.string(),
    last_read_message_id: z
      .union([z.number(), z.string(), z.null()])
      .optional(),
    user: z
      .object({
        id: z.string(),
        email: z.string().nullable().optional(),
        first_name: z.string().nullable().optional(),
        last_name: z.string().nullable().optional(),
      })
      .passthrough()
      .optional(),
  })
  .passthrough();

const participantsResponseSchema = z.array(participantResponseSchema);
type ParticipantResponse = z.infer<typeof participantsResponseSchema>[number];

const messageResponseSchema = z
  .object({
    id: z.union([z.number(), z.string()]),
    room_id: z.string(),
    sent_by: z.string(),
    body: z.string(),
    edited: z.boolean(),
    sent_at: z.string(),
  })
  .passthrough();

const messagesResponseSchema = z.array(messageResponseSchema);

const roomsResponseSchema = z.array(
  z
    .object({
      room_id: z.string(),
      roomId: z.string().optional(),
      title: z.string().optional(),
      last_message: messageResponseSchema.nullable().optional(),
      last_read_message_id: z.union([z.number(), z.string(), z.null()]).optional(),
      read_all: z.boolean().optional(),
      readAll: z.boolean().optional(),
    })
    .passthrough(),
);
type RoomsResponse = z.infer<typeof roomsResponseSchema>;

export const CHATROOMS_QUERY_KEY = ["chat", "chatrooms"] as const;

const isTempId = (value: string) => value.startsWith("temp-");
const isSameMessage = (a: ChatMessage, b: ChatMessage) => {
  const roomA = a.roomId ?? a.chatroomId;
  const roomB = b.roomId ?? b.chatroomId;
  return (
    roomA === roomB &&
    a.senderId === b.senderId &&
    a.body === b.body &&
    Math.abs(a.sentAt.getTime() - b.sentAt.getTime()) < 2000
  );
};

export const mergeMessages = (
  incoming: ChatMessage[],
  existing: ChatMessage[] = [],
): ChatMessage[] => {
  const merged: ChatMessage[] = [];

  const upsert = (message: ChatMessage) => {
    const index = merged.findIndex(
      (item) => item.id === message.id || isSameMessage(item, message),
    );
    if (index === -1) {
      merged.push(message);
      return;
    }

    const current = merged[index];
    if (isTempId(current.id) && !isTempId(message.id)) {
      merged[index] = message;
    }
  };

  [...existing, ...incoming].forEach(upsert);
  return merged.sort((a, b) => a.sentAt.getTime() - b.sentAt.getTime());
};

type ChatroomExtras = {
  updatedAt?: string | Date;
  unreadCount?: number;
  title?: string;
  participants?: ChatParticipant[];
  messages?: ChatMessage[];
  isGroup?: boolean;
};

const userParticipantCache = new Map<string, ChatParticipant>();

const toParticipantFromUser = (user: User): ChatParticipant => {
  const nameParts = [
    user.firstName?.trim() ?? "",
    user.lastName?.trim() ?? "",
  ].filter(Boolean);
  const displayName =
    nameParts.length > 0 ? nameParts.join(" ") : user.email ?? user.id;

  return {
    id: user.id,
    displayName,
    username: user.email ?? user.id,
    avatarUrl: "",
    isOnline: false,
  };
};

const hydrateUsersAsParticipants = async (
  userIds: string[],
): Promise<ChatParticipant[]> => {
  const uniqueIds = Array.from(new Set(userIds)).filter((id) => !!id);

  const cached: ChatParticipant[] = [];
  const toFetch: string[] = [];
  uniqueIds.forEach((id) => {
    const cachedParticipant = userParticipantCache.get(id);
    if (cachedParticipant) {
      cached.push(cachedParticipant);
    } else {
      toFetch.push(id);
    }
  });

  const results = await Promise.all(
    toFetch.map(async (userId) => {
      try {
        const res = await apiClient.get(`user/${userId}`);
        const user = userSchema.parse(res.data);
        const participant = toParticipantFromUser(user);
        userParticipantCache.set(userId, participant);
        return participant;
      } catch {
        return null;
      }
    }),
  );

  return [...cached, ...(results.filter(Boolean) as ChatParticipant[])];
};

export const buildChatroomsFromRooms = async (
  rooms: RoomsResponse,
  existingChatrooms?: Chatroom[],
  options?: { currentUserId?: string },
): Promise<Chatroom[]> => {
  const byId = new Map<string, Chatroom>();
  existingChatrooms?.forEach((room) => byId.set(room.id, room));

  const chatrooms = await Promise.all(
    rooms.map(async (room) => {
      const roomId = room.room_id ?? room.roomId;
      if (!roomId) {
        throw new Error("Room id missing in chat rooms payload");
      }

      const existing = byId.get(roomId);
      const lastMessage = room.last_message ? chatMessageSchema.parse(room.last_message) : null;

      const messagesPromise =
        existing?.messages?.length && existing.messages.length > 0
          ? Promise.resolve(existing.messages)
          : fetchMessages(roomId);

      const [baseMessages] = await Promise.all([
        messagesPromise,
      ]);

      const participantsById = new Map<string, ChatParticipant>();
      (existing?.participants ?? []).forEach((p) => participantsById.set(p.id, p));

      const senderId = lastMessage?.senderId ?? lastMessage?.sentBy;
      if (
        senderId &&
        senderId !== options?.currentUserId &&
        !participantsById.has(senderId) &&
        userParticipantCache.has(senderId)
      ) {
        participantsById.set(senderId, userParticipantCache.get(senderId)!);
      } else if (
        senderId &&
        senderId !== options?.currentUserId &&
        !participantsById.has(senderId)
      ) {
        const hydrated = await hydrateUsersAsParticipants([senderId]);
        hydrated.forEach((p) => participantsById.set(p.id, p));
      }

      const participants = Array.from(participantsById.values());

      const mergedMessagesWithExisting = mergeMessages(baseMessages, existing?.messages ?? []);
      const mergedMessages = lastMessage
        ? mergeMessages([lastMessage], mergedMessagesWithExisting)
        : mergedMessagesWithExisting;
      const currentUserLastRead =
        room.last_read_message_id ??
        participants.find((participant) => participant.id === options?.currentUserId)
          ?.lastReadMessageId ??
        null;

      const extras: ChatroomExtras = {
        unreadCount: computeUnreadCount(
          mergedMessages,
          currentUserLastRead,
          room.read_all ?? room.readAll,
          options?.currentUserId,
        ),
        title: room.title ?? existing?.title,
        isGroup: existing?.isGroup,
        updatedAt: mergedMessages.at(-1)?.sentAt ?? existing?.updatedAt,
      };

      return buildChatroom(roomId, participants, mergedMessages, extras);
    }),
  );

  return chatrooms.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
};

export type CreateChatroomInput = {
  participantIds?: string[];
};

export type ChatroomParticipantInput = {
  chatroomId: string;
  userId: string;
};

export type UpdateMessageInput = {
  chatroomId: string;
  messageId: number | string;
  body: string;
};

const toChatParticipant = (
  participant: ParticipantResponse,
): ChatParticipant => {
  const user = participant.user;
  const nameParts = [
    user?.first_name?.trim() ?? "",
    user?.last_name?.trim() ?? "",
  ].filter(Boolean);

  const displayName =
    nameParts.length > 0
      ? nameParts.join(" ")
      : user?.email?.trim() ?? participant.user_id;

  return {
    id: participant.user_id,
    displayName,
    username: user?.email ?? participant.user_id,
    avatarUrl: "",
    isOnline: false,
    lastReadMessageId:
      typeof participant.last_read_message_id === "number" ||
      typeof participant.last_read_message_id === "string"
        ? participant.last_read_message_id
        : null,
  };
};

const coerceDate = (value?: string | Date): Date | undefined => {
  if (!value) return undefined;
  if (value instanceof Date) return value;
  const timestamp = Date.parse(value);
  if (Number.isNaN(timestamp)) return undefined;
  return new Date(timestamp);
};

const fetchParticipants = async (chatroomId: string): Promise<ChatParticipant[]> => {
  const response = await apiClient.get(`chat/${chatroomId}/participants`);
  const payload = participantsResponseSchema.parse(response.data);
  const idsNeedingHydration = Array.from(
    new Set(
      payload
        .filter((participant) => {
          const user = participant.user;
          const hasName =
            !!user &&
            ((typeof user.first_name === "string" && user.first_name.trim().length > 0) ||
              (typeof user.last_name === "string" && user.last_name.trim().length > 0));
          return !hasName;
        })
        .map((participant) => participant.user_id),
    ),
  );

  const hydratedUsers = await Promise.all(
    idsNeedingHydration.map(async (userId) => {
      try {
        const res = await apiClient.get(`user/${userId}`);
        const user = userSchema.parse(res.data);
        return user;
      } catch {
        return null;
      }
    }),
  );

  const userLookup = new Map<string, User>();
  hydratedUsers.forEach((user, index) => {
    if (user) {
      userLookup.set(idsNeedingHydration[index]!, user);
    }
  });

  return payload.map((participant) => {
    const fetchedUser = userLookup.get(participant.user_id);
    const enrichedUser = fetchedUser
      ? {
          id: fetchedUser.id,
          email: fetchedUser.email,
          first_name: fetchedUser.firstName,
          last_name: fetchedUser.lastName,
        }
      : participant.user;

    return toChatParticipant({
      ...participant,
      user: enrichedUser,
    });
  });
};

export const getParticipants = fetchParticipants;

export const getMessagesPage = async (
  chatroomId: string,
  page = 1,
): Promise<ChatMessage[]> => {
  const response = await apiClient.get(`chat/${chatroomId}/messages`, {
    params: { page },
  });
  const payload = messagesResponseSchema.parse(response.data);
  const messages = payload.map((message) => chatMessageSchema.parse(message));
  return messages.sort(
    (a, b) => a.sentAt.getTime() - b.sentAt.getTime(),
  );
};

const fetchMessages = async (chatroomId: string): Promise<ChatMessage[]> => {
  return getMessagesPage(chatroomId, 1);
};

const computeUnreadCount = (
  messages: ChatMessage[],
  lastReadMessageId?: string | number | null,
  readAll?: boolean,
  currentUserId?: string,
): number => {
  if (readAll) return 0;
  if (lastReadMessageId === null || typeof lastReadMessageId === "undefined") {
    return messages.filter((message) => message.senderId !== currentUserId).length;
  }

  const lastRead = Number(lastReadMessageId);
  if (!Number.isFinite(lastRead)) {
    return messages.filter((message) => message.senderId !== currentUserId).length;
  }

  return messages.filter((message) => {
    const id = Number(message.id);
    if (message.senderId === currentUserId) return false;
    return Number.isFinite(id) && id > lastRead;
  }).length;
};

const buildChatroom = (
  chatroomId: string,
  participants: ChatParticipant[],
  messages: ChatMessage[],
  extras: ChatroomExtras = {},
): Chatroom => {
  const sortedMessages = [...messages].sort(
    (a, b) => a.sentAt.getTime() - b.sentAt.getTime(),
  );
  const latestMessageAt = sortedMessages.at(-1)?.sentAt;

  const updatedAt =
    coerceDate(extras.updatedAt) ??
    latestMessageAt ??
    new Date();

  return {
    id: chatroomId,
    title: extras.title,
    isGroup: extras.isGroup ?? participants.length > 2,
    updatedAt,
    unreadCount: extras.unreadCount ?? 0,
    participants,
    messages: sortedMessages,
  };
};

const fetchChatroom = async (
  chatroomId: string,
  extras: ChatroomExtras = {},
): Promise<Chatroom> => {
  const participants =
    extras.participants ?? (await fetchParticipants(chatroomId));
  const messages = extras.messages ?? (await fetchMessages(chatroomId));

  return buildChatroom(chatroomId, participants, messages, extras);
};

const getMessageResourceId = (value: string | number): string => {
  if (typeof value === "number") {
    return value.toString();
  }
  const numeric = Number(value);
  if (!Number.isNaN(numeric)) {
    return numeric.toString();
  }
  return value;
};

export const getChatrooms = (
  currentUserId?: string,
): ApiQueryOptions<Chatroom[]> => ({
  queryKey: CHATROOMS_QUERY_KEY,
  queryFn: async () => {
    const rooms = await fetchRoomsOnce();
    return buildChatroomsFromRooms(rooms, undefined, { currentUserId });
  },
});

export const getChatroom = (chatroomId: string): ApiQueryOptions<Chatroom> => ({
  queryKey: ["chat", "chatrooms", chatroomId],
  queryFn: async () => fetchChatroom(chatroomId),
});

export const createChatroom = async (
  input: CreateChatroomInput = {},
): Promise<string> => {
  const participantIds = input.participantIds ?? [];

  const response = await apiClient.post("chat/rooms", participantIds);
  return chatroomIdResponseSchema.parse(response.data);
};

export const deleteChatroom = async (chatroomId: string): Promise<void> => {
  await apiClient.delete(`chat/${chatroomId}`);
};

export const addParticipant = async ({
  chatroomId,
  userId,
}: ChatroomParticipantInput): Promise<Chatroom> => {
  await apiClient.post(`chat/${chatroomId}/participants/${userId}`);

  return fetchChatroom(chatroomId);
};

export const removeParticipant = async ({
  chatroomId,
  userId,
}: ChatroomParticipantInput): Promise<void> => {
  await apiClient.delete(`chat/${chatroomId}/participants/${userId}`);
};

export const sendMessage = async (
  input: SendMessageInput,
): Promise<ChatMessage> => {
  const payload = sendMessageInputSchema.parse(input);
  const url = toWebsocketUrl(`/chat/${payload.chatroomId}/ws`);

  return new Promise<ChatMessage>((resolve, reject) => {
    const socket = new WebSocket(url);
    let settled = false;
    const timeout = setTimeout(() => {
      if (!settled) {
        settled = true;
        socket.close();
        reject(new Error("Timed out waiting for message acknowledgement."));
      }
    }, 5000);

    const cleanup = () => {
      clearTimeout(timeout);
      if (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING) {
        socket.close();
      }
    };

    socket.addEventListener("open", () => {
      socket.send(payload.body);
    });

    socket.addEventListener("message", (event) => {
      if (settled) return;
      try {
        const parsed = chatMessageSchema.parse(JSON.parse(event.data));
        if (parsed.roomId === payload.chatroomId) {
          settled = true;
          cleanup();
          resolve(parsed);
        }
      } catch {
        // ignore non-message payloads
      }
    });

    socket.addEventListener("error", () => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(new Error("Failed to send message over WebSocket."));
    });

    socket.addEventListener("close", () => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(new Error("WebSocket closed before message was acknowledged."));
    });
  });
};

export const updateMessage = async ({
  messageId,
  body,
}: UpdateMessageInput): Promise<void> => {
  const messageResourceId = getMessageResourceId(messageId);
  await apiClient.patch(`chat/messages/${messageResourceId}`, {
    body,
  });
};

export const deleteMessage = async (
  _chatroomId: string,
  messageId: string | number,
): Promise<void> => {
  const messageResourceId = getMessageResourceId(messageId);
  await apiClient.delete(`chat/messages/${messageResourceId}`);
};

const toWebsocketUrl = (path: string): string => {
  const base = API_BASE_URL.replace(/\/$/, "");
  return `${base.replace(/^http/i, "ws")}/${path.replace(/^\//, "")}`;
};

const fetchRoomsOnce = async (): Promise<RoomsResponse> => {
  const response = await fetch(`${API_BASE_URL.replace(/\/$/, "")}/chat/rooms`, {
    method: "GET",
    headers: {
      Accept: "text/event-stream",
    },
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch chat rooms: ${response.status}`);
  }

  if (!response.body) {
    throw new Error("No response body when fetching chat rooms.");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    const delimiterIndex = buffer.indexOf("\n\n");
    if (delimiterIndex === -1) {
      continue;
    }

    const chunk = buffer.slice(0, delimiterIndex);
    buffer = buffer.slice(delimiterIndex + 2);

    const dataLine = chunk
      .split("\n")
      .find((line) => line.trim().startsWith("data:"));

    if (!dataLine) {
      continue;
    }

    const payloadRaw = dataLine.replace(/^data:\s*/, "");
    try {
      const parsed = JSON.parse(payloadRaw);
      const rooms = roomsResponseSchema.parse(parsed);
      reader.cancel();
      return rooms;
    } catch (err) {
      console.error("Failed to parse chat rooms SSE payload", err);
      continue;
    }
  }

  throw new Error("No chat rooms data received from stream.");
};

export const subscribeToChatRoomsStream = (
  onRooms: (rooms: RoomsResponse, rawPayload: string) => void | Promise<void>,
  onError?: () => void,
): (() => void) => {
  const source = new EventSource(`${API_BASE_URL.replace(/\/$/, "")}/chat/rooms`, {
    withCredentials: true,
  });

  const handler = async (event: MessageEvent) => {
    const raw = event.data;
    try {
      const rooms = roomsResponseSchema.parse(JSON.parse(raw));
      await onRooms(rooms, raw);
    } catch (err) {
      console.error("Failed to process chat rooms event", err);
    }
  };

  source.addEventListener("rooms", handler);
  source.onmessage = handler;

  source.onerror = () => {
    source.close();
    if (onError) onError();
  };

  return () => {
    source.removeEventListener("rooms", handler);
    source.close();
  };
};
