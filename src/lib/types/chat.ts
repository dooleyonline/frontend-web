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
});

export type ChatParticipant = z.infer<typeof chatParticipantSchema>;

const chatMessageJsonSchema = z.object({
  id: z.number(),
  room_id: z.string(),
  sent_by: z.string(),
  body: z.string(),
  edited: z.boolean(),
  sent_at: z.string(),
});

export const chatMessageSchema = chatMessageJsonSchema.transform((data) => ({
  id: data.id,
  roomID: data.room_id,
  sentBy: data.sent_by,
  body: data.body,
  sentAt: new Date(data.sent_at),
  edited: data.edited,
}));

export type ChatMessage = z.infer<typeof chatMessageSchema>;

const chatRoomJsonSchema = z.object({
  id: z.string(),
  updatedAt: isoDateSchema,
  unreadCount: z.number().int().nonnegative(),
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
  senderId: z.string(),
  body: z.string().min(1),
});

export type SendMessageInput = z.infer<typeof sendMessageInputSchema>;
