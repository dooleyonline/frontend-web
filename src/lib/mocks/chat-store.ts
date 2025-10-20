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

type ChatThreadInput = z.input<typeof chatThreadSchema>;

const mockThreadFixtures: ChatThreadInput[] = [
  {
    id: "thread_1",
    isGroup: false,
    updatedAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    unreadCount: 0,
    participants: [
      {
        id: MOCK_CURRENT_USER_ID,
        displayName: "You",
        username: "you",
        avatarUrl: "",
        isOnline: true,
      },
      {
        id: "clee753",
        displayName: "Changmin Lee",
        username: "Changmin",
        avatarUrl:
          "https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=facearea&w=160&h=160&q=80",
        isOnline: true,
      },
    ],
    messages: [
      {
        id: "1",
        threadId: "thread_1",
        senderId: "clee753",
        body: "Hey! I'm interested in your XBOX! It is still available right?",
        sentAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
        status: "read",
      },
      {
        id: "2",
        threadId: "thread_1",
        senderId: MOCK_CURRENT_USER_ID,
        body: "Hi! I'm Ethan. Yes, it is still available.",
        sentAt: new Date(Date.now() - 1000 * 60 * 60 * 23).toISOString(),
        status: "read",
      },
      {
        id: "3",
        threadId: "thread_1",
        senderId: "clee753",
        body: "Is $40 fine for you?",
        sentAt: new Date(Date.now() - 1000 * 60 * 60 * 22.5).toISOString(),
        status: "read",
      },
      {
        id: "4",
        threadId: "thread_1",
        senderId: MOCK_CURRENT_USER_ID,
        body: "Absolutely. Can we meet up in front of the Eagle Hall? I will send you the location in sec.",
        sentAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
        status: "delivered",
      },
    ],
  },
  {
    id: "thread_2",
    isGroup: true,
    updatedAt: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
    unreadCount: 3,
    participants: [
      {
        id: MOCK_CURRENT_USER_ID,
        displayName: "You",
        username: "you",
        avatarUrl: "",
      },
      {
        id: "alin228",
        displayName: "Andrew Lin",
        username: "Andy",
        avatarUrl:
          "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=facearea&w=160&h=160&q=80",
        isOnline: true,
      },
      {
        id: "esuh23",
        displayName: "Brian Suh",
        username: "Big B",
        avatarUrl:
          "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=facearea&w=160&h=160&q=80",
      },
      {
        id: "tkim462",
        displayName: "Taeeun Kim",
        username: "taetae",
        avatarUrl:
          "",
      },
    ],
    messages: [
      {
        id: "1",
        threadId: "thread_2",
        senderId: "alin228",
        body: "Hi, it's Andrew.",
        sentAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
        status: "read",
      },
      {
        id: "2",
        threadId: "thread_2",
        senderId: MOCK_CURRENT_USER_ID,
        body: "Nice, I am Ethan",
        sentAt: new Date(Date.now() - 1000 * 60 * 60 * 5.5).toISOString(),
        status: "read",
      },
      {
        id: "3",
        threadId: "thread_2",
        senderId: "esuh23",
        body: "Yo soy Brian.",
        sentAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
        status: "read",
      },
      {
        id: "4",
        threadId: "thread_2",
        senderId: "tkim462",
        body: "Hi guys, Im Taeeun.",
        sentAt: new Date(Date.now() - 1000 * 60 * 60 * 3.5).toISOString(),
        status: "read",
      },
      {
        id: "5",
        threadId: "thread_2",
        senderId: MOCK_CURRENT_USER_ID,
        body: "I am Ethan again.",
        sentAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
        status: "read",
      },
      {
        id: "6",
        threadId: "thread_2",
        senderId: "esuh23",
        body: "Welp, I am Brian S.",
        sentAt: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
        status: "sent",
      },
    ],
  },
  {
    id: "thread_3",
    isGroup: false,
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    unreadCount: 1,
    participants: [
      {
        id: MOCK_CURRENT_USER_ID,
        displayName: "You",
        username: "you",
        avatarUrl: "",
      },
      {
        id: "esuh24",
        displayName: "Bryan Suh",
        username: "Bryan",
        avatarUrl:
          "https://images.unsplash.com/photo-1500051638674-ff996a0ec29e?auto=format&fit=facearea&w=160&h=160&q=80",
        isOnline: false,
      },
    ],
    messages: [
      {
        id: "1",
        threadId: "thread_3",
        senderId: "esuh24",
        body: "cómo se dice computadora en español?",
        sentAt: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(),
        status: "read",
      },
      {
        id: "2",
        threadId: "thread_3",
        senderId: MOCK_CURRENT_USER_ID,
        body: "Computadora es computadora en español.",
        sentAt: new Date(Date.now() - 1000 * 60 * 60 * 25.5).toISOString(),
        status: "read",
      },
      {
        id: "3",
        threadId: "thread_3",
        senderId: "esuh24",
        body: "Ah Si.",
        sentAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
        status: "sent",
      },
    ],
  },
];

let threadsStore: ChatThread[] = mockThreadFixtures.map((thread) =>
  chatThreadSchema.parse(thread),
);

const cloneThread = (thread: ChatThread) =>
  chatThreadSchema.parse({
    ...thread,
    updatedAt: thread.updatedAt,
    messages: thread.messages.map((message) => ({
      ...message,
      sentAt: message.sentAt,
    })),
  });

const ensureThread = (threadId: string) => {
  const thread = threadsStore.find((item) => item.id === threadId);
  if (!thread) throw new Error(`Thread ${threadId} not found`);
  return thread;
};

export const listThreads = (): ChatThread[] => threadsStore.map((thread) => cloneThread(thread));

export const getThreadById = (threadId: string): ChatThread =>
  cloneThread(ensureThread(threadId));

export const appendMessage = (input: SendMessageInput): ChatMessage => {
  const payload = sendMessageInputSchema.parse(input);
  const thread = ensureThread(payload.threadId);

  const messageInput: z.input<typeof chatMessageSchema> = {
    id: `msg_${Date.now()}`,
    threadId: payload.threadId,
    senderId: payload.senderId,
    body: payload.body,
    sentAt: new Date().toISOString(),
    status: payload.senderId === MOCK_CURRENT_USER_ID ? "sent" : "delivered",
  };

  const newMessage = chatMessageSchema.parse(messageInput);
  thread.messages.push(newMessage);
  thread.updatedAt = newMessage.sentAt;
  if (payload.senderId === MOCK_CURRENT_USER_ID) {
    thread.unreadCount = 0;
  } else {
    thread.unreadCount += 1;
  }

  threadsStore = threadsStore
    .filter((item) => item.id !== payload.threadId)
    .concat(thread)
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());

  return chatMessageSchema.parse({
    ...newMessage,
    sentAt: newMessage.sentAt,
  });
};