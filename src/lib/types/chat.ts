import { z } from "zod";

export const chatMessageStatusSchema = z.enum(["sent", "delivered", "read"]);

export type ChatMessageStatus = z.infer<typeof chatMessageStatusSchema>;

export const chatParticipantSchema = z.object({
  id: z.string(),
  displayName: z.string(),
  username: z.string().optional(),
  avatarUrl: z
    .string()
    .url()
    .or(z.literal(""))
    .nullish(),  //we need api for fetching user's avartar
  isOnline: z.boolean().optional(),
});

export type ChatParticipant = z.infer<typeof chatParticipantSchema>;

export const chatMessageSchema = z.object({
  id: z.string(),
  threadId: z.string(),
  senderId: z.string(),
  body: z.string(),
  sentAt: z.coerce.date(),
  status: chatMessageStatusSchema,
});

export type ChatMessage = z.infer<typeof chatMessageSchema>;

export const chatThreadSchema = z.object({
  id: z.string(),
  isGroup: z.boolean(),
  updatedAt: z.coerce.date(),
  unreadCount: z.number().int().nonnegative(),
  participants: z.array(chatParticipantSchema),
  messages: z.array(chatMessageSchema),
});

export type ChatThread = z.infer<typeof chatThreadSchema>;

export const sendMessageInputSchema = z.object({
  threadId: z.string(),
  senderId: z.string(),
  body: z.string().min(1),
});

export type SendMessageInput = z.infer<typeof sendMessageInputSchema>;