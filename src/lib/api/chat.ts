import { z } from "zod";

import {
  ChatMessage,
  Chatroom,
  chatMessageSchema,
  chatRoomSchema,
  SendMessageInput,
  sendMessageInputSchema,
} from "@/lib/types";
import { MOCK_CURRENT_USER_ID } from "@/lib/constants/chat";

import { ApiQueryOptions, apiClient } from "./shared";
import { mockChatApi } from "@/lib/mocks/chatrooms";

const useMockChatApi = process.env.NEXT_PUBLIC_USE_CHAT_MOCKS !== "false";

const chatroomIdListSchema = z.array(z.string());

const chatroomIdResponseSchema = z
  .union([
    z.string(),
    z.object({ id: z.string() }),
  ])
  .transform((data) => (typeof data === "string" ? data : data.id));

export type CreateChatroomInput = {
  participantIds?: string[];
};

export type ChatroomParticipantInput = {
  chatroomId: string;
  userId: string;
};

export type UpdateMessageInput = {
  chatroomId: string;
  messageId: number;
  body: string;
};

const parseChatroomPayload = async (
  payload: unknown,
  chatroomId: string,
): Promise<Chatroom> => {
  if (
    payload == null ||
    (typeof payload === "string" && payload.trim().length === 0)
  ) {
    const fallback = await apiClient.get(`chat/${chatroomId}`);
    return chatRoomSchema.parse(fallback.data);
  }
  return chatRoomSchema.parse(payload);
};

export const getChatrooms = (): ApiQueryOptions<Chatroom[]> => ({
  queryKey: ["chat", "chatrooms"],
  queryFn: async () => {
    if (useMockChatApi) {
      return mockChatApi.listChatrooms();
    }

    const response = await apiClient.get("chat");
    const ids = chatroomIdListSchema.parse(response.data);

    const chatroomPayloads = await Promise.all(
      ids.map(async (id) => {
        const chatroomResponse = await apiClient.get(`chat/${id}`);
        return chatRoomSchema.parse(chatroomResponse.data);
      }),
    );

    return chatroomPayloads.sort(
      (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime(),
    );
  },
});

export const getChatroom = (chatroomId: string): ApiQueryOptions<Chatroom> => ({
  queryKey: ["chat", "chatrooms", chatroomId],
  queryFn: async () => {
    if (useMockChatApi) {
      return mockChatApi.getChatroom(chatroomId);
    }

    const response = await apiClient.get(`chat/${chatroomId}`);
    return chatRoomSchema.parse(response.data);
  },
});

export const createChatroom = async (
  input: CreateChatroomInput = {},
): Promise<string> => {
  const participants = input.participantIds ?? [];

  if (useMockChatApi) {
    return mockChatApi.createChatroom(participants);
  }

  const response = await apiClient.post("chat", { participants });
  return chatroomIdResponseSchema.parse(response.data);
};

export const deleteChatroom = async (chatroomId: string): Promise<void> => {
  if (useMockChatApi) {
    await mockChatApi.deleteChatroom(chatroomId);
    return;
  }
  await apiClient.delete(`chat/${chatroomId}`);
};

export const addParticipant = async ({
  chatroomId,
  userId,
}: ChatroomParticipantInput): Promise<Chatroom> => {
  if (useMockChatApi) {
    return mockChatApi.addParticipant(chatroomId, userId);
  }

  const response = await apiClient.post(`chat/${chatroomId}/participant`, {
    userId,
  });
  return parseChatroomPayload(response.data, chatroomId);
};

export const removeParticipant = async ({
  chatroomId,
  userId,
}: ChatroomParticipantInput): Promise<Chatroom> => {
  if (useMockChatApi) {
    return mockChatApi.removeParticipant(chatroomId, userId);
  }

  const response = await apiClient.delete(
    `chat/${chatroomId}/participant/${userId}`,
  );
  return parseChatroomPayload(response.data, chatroomId);
};

export const sendMessage = async (input: SendMessageInput): Promise<ChatMessage> => {
  const payload = sendMessageInputSchema.parse(input);

  if (useMockChatApi) {
    return mockChatApi.sendMessage(payload);
  }

  const response = await apiClient.post(`chat/${payload.chatroomId}/message`, {
    senderId: payload.senderId,
    body: payload.body,
  });
  return chatMessageSchema.parse(response.data);
};

export const updateMessage = async ({
  chatroomId,
  messageId,
  body,
}: UpdateMessageInput): Promise<ChatMessage> => {
  if (useMockChatApi) {
    return mockChatApi.updateMessage(chatroomId, messageId, body);
  }

  const response = await apiClient.put(
    `chat/${chatroomId}/message/${messageId}`,
    { body },
  );
  return chatMessageSchema.parse(response.data);
};

export const deleteMessage = async (
  chatroomId: string,
  messageId: string,
): Promise<void> => {
  if (useMockChatApi) {
    await mockChatApi.deleteMessage(chatroomId, messageId);
    return;
  }

  await apiClient.delete(`chat/${chatroomId}/message/${messageId}`);
};

export { MOCK_CURRENT_USER_ID };
