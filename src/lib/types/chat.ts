import { z } from "zod";

const urlSchema = z.url().or(z.literal("")).nullable().optional();

const isoDateSchema = z
  .string()
  .refine((value) => !Number.isNaN(Date.parse(value)), {
    message: "Invalid ISO date string",
  });

export const chatParticipantSchema = z.object({
  id: z.string(),
  displayName: z.string(),
  username: z.string().optional(),
  avatarUrl: urlSchema,
  isOnline: z.boolean().optional(),
  lastReadMessageId: z.union([z.string(), z.number()]).nullable().optional(),
});

export type ChatParticipant = z.infer<typeof chatParticipantSchema>;

const chatMessageJsonSchema = z.object({
  id: z.union([z.string(), z.number()]),
  room_id: z.string(),
  sent_by: z.string(),
  body: z.string(),
  edited: z.boolean(),
  sent_at: z.union([z.string(), z.null()]).optional(),
});

export const chatMessageSchema = chatMessageJsonSchema.transform((data) => {
  const rawId = data.id;
  const numericId =
    typeof rawId === "number"
      ? rawId
      : typeof rawId === "string" && rawId.trim().length > 0
        ? Number(rawId)
        : NaN;
  const hasUsableId =
    (typeof rawId === "string" && rawId.trim().length > 0 && rawId !== "0") ||
    (Number.isFinite(numericId) && numericId !== 0);
  const fallbackId = `temp-${data.sent_by ?? "user"}-${Date.now().toString(36)}-${Math.random().toString(16).slice(2)}`;
  const id =
    typeof rawId === "number"
      ? hasUsableId
        ? rawId.toString()
        : fallbackId
      : hasUsableId
        ? rawId
        : fallbackId;
  const chatroomId = data.room_id;
  const senderId = data.sent_by;
  const rawSentAt = data.sent_at;
  let sentAt =
    typeof rawSentAt === "string" && rawSentAt.trim().length > 0
      ? new Date(rawSentAt)
      : new Date();

  if (!(sentAt instanceof Date) || Number.isNaN(sentAt.getTime()) || sentAt.getTime() <= 0) {
    sentAt = new Date();
  }

  return {
    id,
    chatroomId,
    roomId: chatroomId,
    roomID: chatroomId,
    senderId,
    sentBy: senderId,
    body: data.body,
    sentAt,
    edited: data.edited,
  };
});

export type ChatMessage = z.infer<typeof chatMessageSchema>;

const chatRoomJsonSchema = z.object({
  id: z.string(),
  updatedAt: isoDateSchema,
  unreadCount: z.number().int().nonnegative(),
  title: z.string().nullable().optional(),
  participants: z.array(z.union([z.string(), chatParticipantSchema])),
  messages: z.array(chatMessageJsonSchema),
});

export const chatRoomSchema = chatRoomJsonSchema.transform((data) => {
  const participants = data.participants.map((participant) => {
    if (typeof participant === "string") {
      return chatParticipantSchema.parse({
        id: participant,
        displayName: participant,
        username: participant,
        avatarUrl: "",
        isOnline: false,
      });
    }

    return chatParticipantSchema.parse({
      ...participant,
      displayName:
        participant.displayName || participant.username || participant.id,
    });
  });

  const messages = data.messages.map((message) =>
    chatMessageSchema.parse(message)
  );

  return {
    id: data.id,
    title: data.title ?? undefined,
    isGroup: participants.length > 2,
    updatedAt: new Date(data.updatedAt),
    unreadCount: data.unreadCount,
    participants,
    messages,
  };
});

export type Chatroom = z.infer<typeof chatRoomSchema>;

export const sendMessageInputSchema = z.object({
  chatroomId: z.string(),
  body: z.string().min(1),
  senderId: z.string().optional(),
});

export type SendMessageInput = z.infer<typeof sendMessageInputSchema>;
