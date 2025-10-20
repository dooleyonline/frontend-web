import { z } from "zod";

import {
  ChatMessage,
  ChatThread,
  chatMessageSchema,
  chatThreadSchema,
  SendMessageInput,
  sendMessageInputSchema,
} from "@/lib/types";
import { MOCK_CURRENT_USER_ID } from "@/lib/constants/chat";

import { ApiQueryOptions } from "./shared";

const fetchJson = async <T>(
  path: string,
  schema: z.ZodType<T>,
  signal?: AbortSignal,
): Promise<T> => {
  const response = await fetch(path, { signal });
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Failed to fetch ${path}`);
  }

  const data = await response.json();
  return schema.parse(data);
};

export const getThreads = (): ApiQueryOptions<ChatThread[]> => ({
  queryKey: ["chat", "threads"],
  queryFn: async ({ signal }) =>
    fetchJson("/api/chat/threads", z.array(chatThreadSchema), signal),
});

export const getThread = (threadId: string): ApiQueryOptions<ChatThread> => ({
  queryKey: ["chat", "threads", threadId],
  queryFn: async ({ signal }) =>
    fetchJson(`/api/chat/threads/${threadId}`, chatThreadSchema, signal),
});

export const sendMessage = async (input: SendMessageInput): Promise<ChatMessage> => {
  const payload = sendMessageInputSchema.parse(input);

  const response = await fetch("/api/chat/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Failed to send message");
  }

  const data = await response.json();
  return chatMessageSchema.parse(data);
};

export { MOCK_CURRENT_USER_ID };

/*
// Real backend version using apiClient (swap in once the service is available)
import { apiClient } from "./shared";

export const getThreads = (): ApiQueryOptions<ChatThread[]> => ({
  queryKey: ["chat", "threads"],
  queryFn: async () => {
    const response = await apiClient.get("/chat/threads");
    return z.array(chatThreadSchema).parse(response.data);
  },
});

export const getThread = (threadId: string): ApiQueryOptions<ChatThread> => ({
  queryKey: ["chat", "threads", threadId],
  queryFn: async () => {
    const response = await apiClient.get(`/chat/threads/${threadId}`);
    return chatThreadSchema.parse(response.data);
  },
});

export const sendMessage = async (input: SendMessageInput): Promise<ChatMessage> => {
  const payload = sendMessageInputSchema.parse(input);
  const response = await apiClient.post("/chat/messages", payload);
  return chatMessageSchema.parse(response.data);
};
*/

// After swapping to real backend, delete:
// src/app/api/chat/messages
// src/app/api/chat/threads
// src/lib/mocks
// src/lib/constants/chat.ts