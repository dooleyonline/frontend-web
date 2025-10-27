import { z } from "zod";

const urlSchema = z
  .string()
  .url()
  .or(z.literal(""))
  .nullable()
  .optional();

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
});

export type ChatParticipant = z.infer<typeof chatParticipantSchema>;

const chatMessageApiSchema = z.object({
  id: z.union([z.string(), z.number()]).transform((value) => value.toString()),
  roomId: z.string().optional(),
  room_id: z.string().optional(),
  senderId: z.string().optional(),
  sender_id: z.string().optional(),
  body: z.string(),
  sentAt: isoDateSchema,
  edited: z.boolean().optional().default(false),
});

export const chatMessageSchema = chatMessageApiSchema.transform((data) => {
  const chatroomId = data.roomId ?? data.room_id;
  const senderId = data.senderId ?? data.sender_id;

  if (!chatroomId) {
    throw new Error("Chat message missing room identifier");
  }
  if (!senderId) {
    throw new Error("Chat message missing sender identifier");
  }

  return {
    id: data.id,
    chatroomId,
    senderId,
    body: data.body,
    sentAt: new Date(data.sentAt),
    edited: data.edited ?? false,
  };
});

export type ChatMessage = z.infer<typeof chatMessageSchema>;

const chatroomApiSchema = z.object({
  id: z.string(),
  updatedAt: isoDateSchema,
  unreadCount: z.number().int().nonnegative(),
  participants: z.array(z.union([z.string(), chatParticipantSchema])),
  messages: z.array(chatMessageApiSchema),
});

export const chatroomSchema = chatroomApiSchema.transform((data) => {
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
      displayName: participant.displayName || participant.username || participant.id,
    });
  });

  const messages = data.messages.map((message) => chatMessageSchema.parse(message));

  return {
    id: data.id,
    isGroup: participants.length > 2,
    updatedAt: new Date(data.updatedAt),
    unreadCount: data.unreadCount,
    participants,
    messages,
  };
});

export type Chatroom = z.infer<typeof chatroomSchema>;

export const sendMessageInputSchema = z.object({
  chatroomId: z.string(),
  senderId: z.string(),
  body: z.string().min(1),
});

export type SendMessageInput = z.infer<typeof sendMessageInputSchema>;
