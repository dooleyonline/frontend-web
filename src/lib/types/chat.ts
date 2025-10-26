import { z } from "zod";

export const chatMessageJsonSchema = z.object({
  id: z.number(),
  room_id: z.string().uuid(),
  sent_by: z.string().uuid(),
  body: z.string(),
  sent_at: z.string(),
});

export const chatMessageSchema = chatMessageJsonSchema.transform((data) => ({
  id: data.id,
  roomId: data.room_id,
  sentBy: data.sent_by,
  body: data.body,
  sentAt: data.sent_at,
}));

export type ChatMessage = z.infer<typeof chatMessageSchema>;

export const chatParticipantJsonSchema = z.object({
  room_id: z.string().uuid(),
  user_id: z.string().uuid(),
  last_read_message_id: z.number(),
});

export const chatParticipantSchema = chatParticipantJsonSchema.transform(
  (data) => ({
    roomId: data.room_id,
    userId: data.user_id,
    lastReadMessageId: data.last_read_message_id,
  })
);

export type ChatParticipant = z.infer<typeof chatParticipantSchema>;

export const chatRoomJsonSchema = z.object({
  id: z.string().uuid(),
  unread_count: z.number(),
  participants: z.array(z.string().uuid()),
  messages: z.array(z.number()),
});
