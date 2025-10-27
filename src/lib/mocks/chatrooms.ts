import { z } from "zod";

import { MOCK_CURRENT_USER_ID } from "@/lib/constants/chat";
import {
  ChatMessage,
  Chatroom,
  chatMessageSchema,
  chatRoomSchema,
  SendMessageInput,
  sendMessageInputSchema,
} from "@/lib/types";

type ChatroomInput = z.input<typeof chatRoomSchema>;
type ChatMessageInput = z.input<typeof chatMessageSchema>;

const now = Date.now();

const makeDate = (offsetMs: number) => new Date(now + offsetMs).toISOString();

const initialChatroomsRaw: ChatroomInput[] = [
  {
    id: "room-1",
    updatedAt: makeDate(-1000 * 60 * 5),
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
        username: "changmin",
        avatarUrl:
          "https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=facearea&w=160&h=160&q=80",
        isOnline: true,
      },
    ],
    messages: [
      // {
      //   id: "msg-1",
      //   roomId: "room-1",
      //   senderId: "clee753",
      //   body: "Hey! Is the bike still available?",
      //   sentAt: makeDate(-1000 * 60 * 60 * 2),
      //   edited: false,
      // },
      // {
      //   id: "msg-2",
      //   roomId: "room-1",
      //   senderId: MOCK_CURRENT_USER_ID,
      //   body: "Yep, still available. Want to meet at Asbury Circle?",
      //   sentAt: makeDate(-1000 * 60 * 60 * 1.5),
      //   edited: false,
      // },
      {
        id: "msg-3",
        room_id: "room-1",
        sent_by: "clee753",
        body: "Sounds good. Could you pin the spot?",
        sent_at: makeDate(-1000 * 60 * 60 * 1.2),
        edited: false,
      },
    ],
  },
  {
    id: "room-2",
    updatedAt: makeDate(-1000 * 60 * 45),
    unreadCount: 3,
    participants: [
      {
        id: MOCK_CURRENT_USER_ID,
        displayName: "You",
        username: "you",
        avatarUrl: "",
        isOnline: true,
      },
      {
        id: "alin228",
        displayName: "Andrew Lin",
        username: "andy",
        avatarUrl:
          "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=facearea&w=160&h=160&q=80",
      },
      {
        id: "esuh23",
        displayName: "Brian Suh",
        username: "brian",
        avatarUrl:
          "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=facearea&w=160&h=160&q=80",
      },
      {
        id: "tkim462",
        displayName: "Taeeun Kim",
        username: "taetae",
        avatarUrl: "",
      },
    ],
    messages: [
      {
        id: "msg-4",
        room_id: "room-2",
        sent_by: "alin228",
        body: "Group study tonight?",
        sent_at: makeDate(-1000 * 60 * 50),
        edited: false,
      },
      // {
      //   id: "msg-5",
      //   roomId: "room-2",
      //   senderId: MOCK_CURRENT_USER_ID,
      //   body: "Yes! Let's meet at Woodruff Library entrance.",
      //   sentAt: makeDate(-1000 * 60 * 48),
      //   edited: false,
      // },
      // {
      //   id: "msg-6",
      //   roomId: "room-2",
      //   senderId: "esuh23",
      //   body: "Can someone share the exact spot?",
      //   sentAt: makeDate(-1000 * 60 * 46),
      //   edited: false,
      // },
    ],
  },
];

let chatroomsStore: Chatroom[] = initialChatroomsRaw.map((raw) => chatRoomSchema.parse(raw));

const cloneChatroom = (chatroom: Chatroom): Chatroom => ({
  ...chatroom,
  updatedAt: new Date(chatroom.updatedAt),
  participants: chatroom.participants.map((participant) => ({ ...participant })),
  messages: chatroom.messages.map((message) => ({
    ...message,
    sentAt: new Date(message.sentAt),
  })),
});

const ensureChatroom = (chatroomId: string) => {
  const chatroom = chatroomsStore.find((room) => room.id === chatroomId);
  if (!chatroom) throw new Error(`Chatroom ${chatroomId} not found`);
  return chatroom;
};

const nextId = () => `mock-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

export const mockChatApi = {
  listChatrooms: async (): Promise<Chatroom[]> =>
    chatroomsStore
      .slice()
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
      .map(cloneChatroom),

  getChatroom: async (chatroomId: string): Promise<Chatroom> =>
    cloneChatroom(ensureChatroom(chatroomId)),

  createChatroom: async (participantIds: string[] = []): Promise<string> => {
    const chatroomId = nextId();
    const newChatroom: Chatroom = chatRoomSchema.parse({
      id: chatroomId,
      updatedAt: new Date().toISOString(),
      unreadCount: 0,
      participants: [
        {
          id: MOCK_CURRENT_USER_ID,
          displayName: "You",
          username: "you",
          avatarUrl: "",
          isOnline: true,
        },
        ...participantIds.map((id) => ({
          id,
          displayName: id,
          username: id,
          avatarUrl: "",
          isOnline: false,
        })),
      ],
      messages: [],
    });
    chatroomsStore = [newChatroom, ...chatroomsStore];
    return chatroomId;
  },

  deleteChatroom: async (chatroomId: string): Promise<void> => {
    chatroomsStore = chatroomsStore.filter((chatroom) => chatroom.id !== chatroomId);
  },

  sendMessage: async (input: SendMessageInput): Promise<ChatMessage> => {
    const payload = sendMessageInputSchema.parse(input);
    const chatroom = ensureChatroom(payload.chatroomId);

    const messageInput: ChatMessageInput = {
      id: nextId(),
      room_id: payload.chatroomId,
      sent_by: payload.senderId,
      body: payload.body,
      sent_at: new Date().toISOString(),
      edited: false,
    };

    const newMessage = chatMessageSchema.parse(messageInput);
    chatroom.messages.push(newMessage);
    chatroom.updatedAt = newMessage.sentAt;
    chatroom.unreadCount = payload.senderId === MOCK_CURRENT_USER_ID ? 0 : chatroom.unreadCount + 1;

    chatroomsStore = chatroomsStore
      .filter((room) => room.id !== chatroom.id)
      .concat(chatroom)
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());

    return cloneChatroom(chatroom).messages.slice(-1)[0]!;
  },

  addParticipant: async (chatroomId: string, userId: string): Promise<Chatroom> => {
    const chatroom = ensureChatroom(chatroomId);
    if (!chatroom.participants.some((participant) => participant.id === userId)) {
      chatroom.participants.push({
        id: userId,
        displayName: userId,
        username: userId,
        avatarUrl: "",
        isOnline: false,
      });
      chatroom.updatedAt = new Date();
    }
    chatroomsStore = chatroomsStore
      .filter((room) => room.id !== chatroom.id)
      .concat(chatroom)
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
    return cloneChatroom(chatroom);
  },

  removeParticipant: async (chatroomId: string, userId: string): Promise<Chatroom> => {
    const chatroom = ensureChatroom(chatroomId);
    chatroom.participants = chatroom.participants.filter((participant) => participant.id !== userId);
    chatroom.updatedAt = new Date();
    chatroomsStore = chatroomsStore
      .filter((room) => room.id !== chatroom.id)
      .concat(chatroom)
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
    return cloneChatroom(chatroom);
  },

  updateMessage: async (chatroomId: string, messageId: string, body: string): Promise<ChatMessage> => {
    const chatroom = ensureChatroom(chatroomId);
    const target = chatroom.messages.find((message) => message.id === messageId);
    if (!target) throw new Error("Message not found");
    target.body = body;
    target.edited = true;
    target.sentAt = new Date();
    chatroom.updatedAt = target.sentAt;
    chatroomsStore = chatroomsStore
      .filter((room) => room.id !== chatroom.id)
      .concat(chatroom)
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
    return { ...target };
  },

  deleteMessage: async (chatroomId: string, messageId: string): Promise<void> => {
    const chatroom = ensureChatroom(chatroomId);
    chatroom.messages = chatroom.messages.filter((message) => message.id !== messageId);
    chatroom.updatedAt = new Date();
    chatroomsStore = chatroomsStore
      .filter((room) => room.id !== chatroom.id)
      .concat(chatroom)
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  },
};
