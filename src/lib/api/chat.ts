import { z } from "zod";

import {
  ChatMessage,
  ChatParticipant,
  Chatroom,
  SendMessageInput,
  chatMessageSchema,
  chatParticipantSchema,
  chatRoomSchema,
  sendMessageInputSchema,
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
      .object({
        int64: z.union([z.number(), z.string()]).optional(),
        valid: z.boolean(),
      })
      .or(z.null())
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
    participants: z.unknown().optional(),
    messages: z.unknown().optional(),
  })
  .passthrough();

type RestChatroomSummary = {
  id: string;
  updatedAt?: string;
  unreadCount?: number;
  participants?: ChatParticipant[];
  messages?: ChatMessage[];
};

type ChatroomExtras = {
  updatedAt?: string | Date;
  unreadCount?: number;
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
  };
};

const parseSummaryParticipants = (
  payload: unknown,
): ChatParticipant[] | undefined => {
  if (!payload) return undefined;

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

  return {
    id,
    updatedAt: parsed.updatedAt ?? parsed.updated_at,
    unreadCount: parsed.unreadCount ?? parsed.unread_count,
    participants: parseSummaryParticipants(parsed.participants),
    messages: parseSummaryMessages(parsed.messages),
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

const fetchMessages = async (chatroomId: string): Promise<ChatMessage[]> => {
  const response = await apiClient.get(`chat/${chatroomId}/messages`);
  const payload = messagesResponseSchema.parse(response.data);
  const messages = payload.map((message) => chatMessageSchema.parse(message));
  return messages.sort(
    (a, b) => a.sentAt.getTime() - b.sentAt.getTime(),
  );
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
    isGroup: participants.length > 2,
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
  const messages =
    extras.messages ?? (await fetchMessages(chatroomId));

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
  queryFn: async () => {
    const response = await apiClient.get("chat/rooms");
    const data = response.data ?? null;
    const dataRecord =
      typeof data === "object" && data !== null
        ? (data as Record<string, unknown>)
        : undefined;
    const rawRooms = Array.isArray(data)
      ? data
      : dataRecord && Array.isArray(dataRecord.rooms)
      ? (dataRecord.rooms as unknown[])
      : dataRecord && Array.isArray(dataRecord.data)
      ? (dataRecord.data as unknown[])
      : undefined;

    if (!rawRooms) {
      throw new Error("Expected chat rooms response to contain an array of rooms.");
    }

    const summaries = rawRooms.map(normalizeChatroomSummary);

    const chatrooms = await Promise.all(
      summaries.map(async (summary) => {
        if (summary.participants && summary.messages) {
          return buildChatroom(
            summary.id,
            summary.participants,
            summary.messages,
            summary,
          );
        }

        return fetchChatroom(summary.id, summary);
      }),
    );

    return chatrooms.sort(
      (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime(),
    );
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
}: ChatroomParticipantInput): Promise<Chatroom> => {
  await apiClient.delete(`chat/${chatroomId}/participants/${userId}`);

  return fetchChatroom(chatroomId);
};

export const sendMessage = async (
  input: SendMessageInput,
): Promise<ChatMessage> => {
  const payload = sendMessageInputSchema.parse(input);

  const response = await apiClient.post(`chat/${payload.chatroomId}/messages`, {
    body: payload.body,
  });
  return chatMessageSchema.parse(response.data);
};

export const updateMessage = async ({
  chatroomId,
  messageId,
  body,
}: UpdateMessageInput): Promise<ChatMessage> => {
  const messageResourceId = getMessageResourceId(messageId);
  const response = await apiClient.patch(`chat/messages/${messageResourceId}`, {
    body,
  });
  return chatMessageSchema.parse(response.data);
};

export const deleteMessage = async (
  _chatroomId: string,
  messageId: string | number,
): Promise<void> => {
  const messageResourceId = getMessageResourceId(messageId);
  await apiClient.delete(`chat/messages/${messageResourceId}`);
};
