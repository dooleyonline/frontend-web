import { z } from "zod";

import {
  ChatMessage,
  ChatParticipant,
  Chatroom,
  chatMessageSchema,
  chatParticipantSchema,
  userSchema,
  User,
} from "@/lib/types";

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
      .union([
        z.union([z.number(), z.string()]).nullable(),
        z.object({
          int64: z.union([z.number(), z.string()]).optional(),
          valid: z.boolean(),
        }),
      ])
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

const chatRoomSummarySchema = z
  .object({
    id: z.string().optional(),
    room_id: z.string().optional(),
    roomId: z.string().optional(),
    updatedAt: z.string().optional(),
    updated_at: z.string().optional(),
    unreadCount: z.number().int().nonnegative().optional(),
    unread_count: z.number().int().nonnegative().optional(),
    last_message: z.unknown().optional(),
    read_all: z.boolean().optional(),
    participants: z.unknown().optional(),
    messages: z.unknown().optional(),
  })
  .passthrough();

type RestChatroomSummary = {
  id: string;
  updatedAt?: string;
  unreadCount?: number;
  readAll?: boolean;
  lastMessage?: ChatMessage;
  participants?: ChatParticipant[];
  messages?: ChatMessage[];
};

type ChatroomExtras = {
  updatedAt?: string | Date;
  unreadCount?: number;
  readAll?: boolean;
  lastMessage?: ChatMessage;
  participants?: ChatParticipant[];
  messages?: ChatMessage[];
};

export type CreateChatroomInput = {
  participantIds?: string[];
};

export type ChatroomParticipantInput = {
  chatroomId: string;
  userId: string;
};

const buildParticipantStub = (id: string): ChatParticipant => ({
  id,
  displayName: id,
  username: id,
  avatarUrl: "",
  isOnline: false,
});

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
  };
};

const parseSummaryParticipants = (
  payload: unknown,
): ChatParticipant[] | undefined => {
  if (!payload) return undefined;

  if (Array.isArray(payload) && payload.every((entry) => typeof entry === "string")) {
    return (payload as string[]).map(buildParticipantStub);
  }

  try {
    return z.array(chatParticipantSchema).parse(payload);
  } catch {
    try {
      const parsed = participantsResponseSchema.parse(payload);
      return parsed.map(toChatParticipant);
    } catch {
      return undefined;
    }
  }
};

const parseSummaryMessages = (payload: unknown): ChatMessage[] | undefined => {
  if (!payload) return undefined;

  if (!Array.isArray(payload) && payload && typeof payload === "object") {
    try {
      const single = chatMessageSchema.parse(payload);
      return [single];
    } catch {
      // fallthrough
    }
  }

  if (Array.isArray(payload)) {
    try {
      const parsed = messagesResponseSchema.parse(payload);
      return parsed.map((message) => chatMessageSchema.parse(message));
    } catch {
      try {
        return payload.map((candidate) => {
          if (!candidate || typeof candidate !== "object") {
            throw new Error("Invalid message candidate");
          }

          const record = candidate as Record<string, unknown>;
          const rawMessage = {
            id: record.id ?? record.messageId ?? record.message_id,
            room_id:
              record.room_id ??
              record.roomId ??
              record.roomID ??
              record.chatroomId ??
              record.chatRoomId,
            sent_by: record.sent_by ?? record.senderId ?? record.sentBy,
            body: record.body,
            edited:
              typeof record.edited === "boolean"
                ? record.edited
                : Boolean(record.edited),
            sent_at:
              record.sent_at ??
              record.sentAt ??
              record.created_at ??
              record.createdAt,
          };

          if (
            rawMessage.sent_at instanceof Date &&
            typeof rawMessage.sent_at.toISOString === "function"
          ) {
            rawMessage.sent_at = rawMessage.sent_at.toISOString();
          }

          return chatMessageSchema.parse(rawMessage);
        });
      } catch {
        return undefined;
      }
    }
  }

  try {
    const parsed = messagesResponseSchema.parse(payload);
    return parsed.map((message) => chatMessageSchema.parse(message));
  } catch {
    return undefined;
  }
};

const normalizeChatroomSummary = (item: unknown): RestChatroomSummary => {
  if (typeof item === "string") {
    return { id: item };
  }

  const parsed = chatRoomSummarySchema.parse(item);
  const id = parsed.id ?? parsed.room_id ?? parsed.roomId;
  if (!id) {
    throw new Error("Chatroom summary is missing an id field.");
  }

  const messages = parseSummaryMessages(parsed.messages);
  const lastMessage =
    parseSummaryMessages(parsed.last_message)?.[0] ??
    messages?.[messages.length - 1];

  return {
    id,
    updatedAt: parsed.updatedAt ?? parsed.updated_at,
    unreadCount: parsed.unreadCount ?? parsed.unread_count,
    participants: parseSummaryParticipants(parsed.participants),
    messages,
    lastMessage,
    readAll: parsed.read_all,
  };
};

const coerceDate = (value?: string | Date): Date | undefined => {
  if (!value) return undefined;
  if (value instanceof Date) return value;
  const timestamp = Date.parse(value);
  if (Number.isNaN(timestamp)) return undefined;
  return new Date(timestamp);
};

export const CHAT_MESSAGES_PAGE_SIZE = 10;

const hydrateUsersByID = async (ids: string[]): Promise<Map<string, User>> => {
  const lookup = new Map<string, User>();
  if (ids.length === 0) return lookup;

  const results = await Promise.all(
    ids.map(async (userId) => {
      try {
        const res = await apiClient.get(`user/${userId}`);
        const user = userSchema.parse(res.data);
        return { userId, user };
      } catch {
        return null;
      }
    }),
  );

  results.forEach((result) => {
    if (result?.user) {
      lookup.set(result.userId, result.user);
    }
  });

  return lookup;
};

const toChatParticipantFromUser = (userId: string, user?: User): ChatParticipant => {
  if (!user) return buildParticipantStub(userId);

  const nameParts = [user.firstName?.trim() ?? "", user.lastName?.trim() ?? ""].filter(
    Boolean,
  );
  const displayName =
    nameParts.length > 0
      ? nameParts.join(" ")
      : user.email?.trim().length
      ? user.email
      : userId;

  return {
    id: userId,
    displayName,
    username: user.email ?? userId,
    avatarUrl: "",
    isOnline: false,
  };
};

export const fetchParticipants = async (
  chatroomId: string,
  participantIds?: string[],
): Promise<ChatParticipant[]> => {
  const ids = Array.from(new Set((participantIds ?? []).filter(Boolean)));

  try {
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

    const hydratedUsers = await hydrateUsersByID(idsNeedingHydration);

    return payload.map((participant) => {
      const fetchedUser = hydratedUsers.get(participant.user_id);
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
  } catch {
    if (ids.length === 0) return [];

    const hydratedUsers = await hydrateUsersByID(ids);
    return ids.map((userId) => toChatParticipantFromUser(userId, hydratedUsers.get(userId)));
  }
};

export const fetchMessagesPage = async (
  chatroomId: string,
  page = 1,
): Promise<ChatMessage[]> => {
  const response = await apiClient.get(`chat/${chatroomId}/messages`, {
    params: { page },
  });
  const payload = messagesResponseSchema.parse(response.data);
  const parsed = payload.map((message) => chatMessageSchema.parse(message));
  return parsed.sort((a, b) => a.sentAt.getTime() - b.sentAt.getTime());
};

const buildChatroom = (
  chatroomId: string,
  participants: ChatParticipant[],
  messages: ChatMessage[],
  extras: ChatroomExtras = {},
): Chatroom => {
  const candidateMessages =
    messages.length > 0
      ? messages
      : extras.lastMessage
      ? [extras.lastMessage]
      : [];

  const sortedMessages = [...candidateMessages].sort(
    (a, b) => a.sentAt.getTime() - b.sentAt.getTime(),
  );
  const latestMessageAt = sortedMessages.at(-1)?.sentAt;

  const updatedAt =
    coerceDate(extras.updatedAt) ??
    latestMessageAt ??
    new Date();

  return {
    id: chatroomId,
    readAll: extras.readAll,
    isGroup: false,
    updatedAt,
    unreadCount:
      extras.readAll === true
        ? 0
        : extras.unreadCount ?? 0,
    participants,
    messages: sortedMessages,
  };
};

const fetchChatroom = async (
  chatroomId: string,
  extras: ChatroomExtras = {},
): Promise<Chatroom> => {
  const participantIds = extras.participants ? extras.participants.map((p) => p.id) : [];
  const participants =
    extras.participants ?? (await fetchParticipants(chatroomId, participantIds));
  const messages =
    extras.messages ?? (await fetchMessagesPage(chatroomId, 1));

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

export const getChatrooms = (): ApiQueryOptions<Chatroom[]> => ({
  queryKey: ["chat", "chatrooms"],
  // Data for this query is pushed via SSE from the chat page; we don't fetch here.
  queryFn: async () => [],
  staleTime: 30_000,
  gcTime: 5 * 60 * 1000,
  refetchOnWindowFocus: false,
});

export const getChatroom = (chatroomId: string): ApiQueryOptions<Chatroom> => ({
  queryKey: ["chat", "chatrooms", chatroomId],
  queryFn: async () => fetchChatroom(chatroomId),
  staleTime: 15_000,
  gcTime: 5 * 60 * 1000,
  refetchOnWindowFocus: false,
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

export const deleteMessage = async (
  _chatroomId: string,
  messageId: string | number,
): Promise<void> => {
  const messageResourceId = getMessageResourceId(messageId);
  await apiClient.delete(`chat/messages/${messageResourceId}`);
};

const extractRoomsArray = (payload: unknown): unknown[] => {
  if (Array.isArray(payload)) return payload;
  if (payload && typeof payload === "object") {
    const record = payload as Record<string, unknown>;
    if (Array.isArray(record.rooms)) return record.rooms;
    if (Array.isArray(record.data)) return record.data;
  }
  return [];
};
export const hydrateChatroomsFromPayload = async (
  payload: unknown,
): Promise<Chatroom[]> => {
  const rawRooms = extractRoomsArray(payload);

  if (!rawRooms || rawRooms.length === 0) {
    return [];
  }

  const summaries = rawRooms.map(normalizeChatroomSummary);

  const chatrooms = summaries.map((summary) =>
    buildChatroom(
      summary.id,
      summary.participants ?? [],
      summary.messages ?? [],
      summary,
    ),
  );

  return chatrooms.sort(
    (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime(),
  );
};
