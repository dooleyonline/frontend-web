// import ChatPageClient from "../chat-page-client";

// type ChatroomPageProps = {
//   params: Promise<{ id: string }>;
// };

// const ChatroomPage = async ({ params }: ChatroomPageProps) => {
//   const { id } = await params;
//   return <ChatPageClient initialChatroomSlug={id} />;
// };

// export default ChatroomPage;
"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import api from "@/lib/api";
import { ChatMessage, chatMessageSchema } from "@/lib/types/chat";
import { useQuery } from "@tanstack/react-query";
import {
  FormEventHandler,
  use,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import useWebSocket, { ReadyState } from "react-use-websocket";

// import ChatPageClient from "../chat-page-client";

// type ChatroomPageProps = {
//   params: Promise<{ id: string }>;
// };

// const ChatroomPage = async ({ params }: ChatroomPageProps) => {
//   const { id } = await params;
//   return <ChatPageClient initialChatroomSlug={id} />;
// };

// export default ChatroomPage;

// import ChatPageClient from "../chat-page-client";

// type ChatroomPageProps = {
//   params: Promise<{ id: string }>;
// };

// const ChatroomPage = async ({ params }: ChatroomPageProps) => {
//   const { id } = await params;
//   return <ChatPageClient initialChatroomSlug={id} />;
// };

// export default ChatroomPage;

// import ChatPageClient from "../chat-page-client";

// type ChatroomPageProps = {
//   params: Promise<{ id: string }>;
// };

// const ChatroomPage = async ({ params }: ChatroomPageProps) => {
//   const { id } = await params;
//   return <ChatPageClient initialChatroomSlug={id} />;
// };

// export default ChatroomPage;

// import ChatPageClient from "../chat-page-client";

// type ChatroomPageProps = {
//   params: Promise<{ id: string }>;
// };

// const ChatroomPage = async ({ params }: ChatroomPageProps) => {
//   const { id } = await params;
//   return <ChatPageClient initialChatroomSlug={id} />;
// };

// export default ChatroomPage;

// import ChatPageClient from "../chat-page-client";

// type ChatroomPageProps = {
//   params: Promise<{ id: string }>;
// };

// const ChatroomPage = async ({ params }: ChatroomPageProps) => {
//   const { id } = await params;
//   return <ChatPageClient initialChatroomSlug={id} />;
// };

// export default ChatroomPage;

// import ChatPageClient from "../chat-page-client";

// type ChatroomPageProps = {
//   params: Promise<{ id: string }>;
// };

// const ChatroomPage = async ({ params }: ChatroomPageProps) => {
//   const { id } = await params;
//   return <ChatPageClient initialChatroomSlug={id} />;
// };

// export default ChatroomPage;

// import ChatPageClient from "../chat-page-client";

// type ChatroomPageProps = {
//   params: Promise<{ id: string }>;
// };

// const ChatroomPage = async ({ params }: ChatroomPageProps) => {
//   const { id } = await params;
//   return <ChatPageClient initialChatroomSlug={id} />;
// };

// export default ChatroomPage;

// import ChatPageClient from "../chat-page-client";

// type ChatroomPageProps = {
//   params: Promise<{ id: string }>;
// };

// const ChatroomPage = async ({ params }: ChatroomPageProps) => {
//   const { id } = await params;
//   return <ChatPageClient initialChatroomSlug={id} />;
// };

// export default ChatroomPage;

// import ChatPageClient from "../chat-page-client";

// type ChatroomPageProps = {
//   params: Promise<{ id: string }>;
// };

// const ChatroomPage = async ({ params }: ChatroomPageProps) => {
//   const { id } = await params;
//   return <ChatPageClient initialChatroomSlug={id} />;
// };

// export default ChatroomPage;

// import ChatPageClient from "../chat-page-client";

// type ChatroomPageProps = {
//   params: Promise<{ id: string }>;
// };

// const ChatroomPage = async ({ params }: ChatroomPageProps) => {
//   const { id } = await params;
//   return <ChatPageClient initialChatroomSlug={id} />;
// };

// export default ChatroomPage;

// import ChatPageClient from "../chat-page-client";

// type ChatroomPageProps = {
//   params: Promise<{ id: string }>;
// };

// const ChatroomPage = async ({ params }: ChatroomPageProps) => {
//   const { id } = await params;
//   return <ChatPageClient initialChatroomSlug={id} />;
// };

// export default ChatroomPage;

// import ChatPageClient from "../chat-page-client";

// type ChatroomPageProps = {
//   params: Promise<{ id: string }>;
// };

// const ChatroomPage = async ({ params }: ChatroomPageProps) => {
//   const { id } = await params;
//   return <ChatPageClient initialChatroomSlug={id} />;
// };

// export default ChatroomPage;

// import ChatPageClient from "../chat-page-client";

// type ChatroomPageProps = {
//   params: Promise<{ id: string }>;
// };

// const ChatroomPage = async ({ params }: ChatroomPageProps) => {
//   const { id } = await params;
//   return <ChatPageClient initialChatroomSlug={id} />;
// };

// export default ChatroomPage;

// import ChatPageClient from "../chat-page-client";

// type ChatroomPageProps = {
//   params: Promise<{ id: string }>;
// };

// const ChatroomPage = async ({ params }: ChatroomPageProps) => {
//   const { id } = await params;
//   return <ChatPageClient initialChatroomSlug={id} />;
// };

// export default ChatroomPage;

// import ChatPageClient from "../chat-page-client";

// type ChatroomPageProps = {
//   params: Promise<{ id: string }>;
// };

// const ChatroomPage = async ({ params }: ChatroomPageProps) => {
//   const { id } = await params;
//   return <ChatPageClient initialChatroomSlug={id} />;
// };

// export default ChatroomPage;

// import ChatPageClient from "../chat-page-client";

// type ChatroomPageProps = {
//   params: Promise<{ id: string }>;
// };

// const ChatroomPage = async ({ params }: ChatroomPageProps) => {
//   const { id } = await params;
//   return <ChatPageClient initialChatroomSlug={id} />;
// };

// export default ChatroomPage;

// import ChatPageClient from "../chat-page-client";

// type ChatroomPageProps = {
//   params: Promise<{ id: string }>;
// };

// const ChatroomPage = async ({ params }: ChatroomPageProps) => {
//   const { id } = await params;
//   return <ChatPageClient initialChatroomSlug={id} />;
// };

// export default ChatroomPage;

// import ChatPageClient from "../chat-page-client";

// type ChatroomPageProps = {
//   params: Promise<{ id: string }>;
// };

// const ChatroomPage = async ({ params }: ChatroomPageProps) => {
//   const { id } = await params;
//   return <ChatPageClient initialChatroomSlug={id} />;
// };

// export default ChatroomPage;

// import ChatPageClient from "../chat-page-client";

// type ChatroomPageProps = {
//   params: Promise<{ id: string }>;
// };

// const ChatroomPage = async ({ params }: ChatroomPageProps) => {
//   const { id } = await params;
//   return <ChatPageClient initialChatroomSlug={id} />;
// };

// export default ChatroomPage;

// import ChatPageClient from "../chat-page-client";

// type ChatroomPageProps = {
//   params: Promise<{ id: string }>;
// };

// const ChatroomPage = async ({ params }: ChatroomPageProps) => {
//   const { id } = await params;
//   return <ChatPageClient initialChatroomSlug={id} />;
// };

// export default ChatroomPage;

// import ChatPageClient from "../chat-page-client";

// type ChatroomPageProps = {
//   params: Promise<{ id: string }>;
// };

// const ChatroomPage = async ({ params }: ChatroomPageProps) => {
//   const { id } = await params;
//   return <ChatPageClient initialChatroomSlug={id} />;
// };

// export default ChatroomPage;

// import ChatPageClient from "../chat-page-client";

// type ChatroomPageProps = {
//   params: Promise<{ id: string }>;
// };

// const ChatroomPage = async ({ params }: ChatroomPageProps) => {
//   const { id } = await params;
//   return <ChatPageClient initialChatroomSlug={id} />;
// };

// export default ChatroomPage;

// import ChatPageClient from "../chat-page-client";

// type ChatroomPageProps = {
//   params: Promise<{ id: string }>;
// };

// const ChatroomPage = async ({ params }: ChatroomPageProps) => {
//   const { id } = await params;
//   return <ChatPageClient initialChatroomSlug={id} />;
// };

// export default ChatroomPage;

// import ChatPageClient from "../chat-page-client";

// type ChatroomPageProps = {
//   params: Promise<{ id: string }>;
// };

// const ChatroomPage = async ({ params }: ChatroomPageProps) => {
//   const { id } = await params;
//   return <ChatPageClient initialChatroomSlug={id} />;
// };

// export default ChatroomPage;

// import ChatPageClient from "../chat-page-client";

// type ChatroomPageProps = {
//   params: Promise<{ id: string }>;
// };

// const ChatroomPage = async ({ params }: ChatroomPageProps) => {
//   const { id } = await params;
//   return <ChatPageClient initialChatroomSlug={id} />;
// };

// export default ChatroomPage;

// import ChatPageClient from "../chat-page-client";

// type ChatroomPageProps = {
//   params: Promise<{ id: string }>;
// };

// const ChatroomPage = async ({ params }: ChatroomPageProps) => {
//   const { id } = await params;
//   return <ChatPageClient initialChatroomSlug={id} />;
// };

// export default ChatroomPage;

// import ChatPageClient from "../chat-page-client";

// type ChatroomPageProps = {
//   params: Promise<{ id: string }>;
// };

// const ChatroomPage = async ({ params }: ChatroomPageProps) => {
//   const { id } = await params;
//   return <ChatPageClient initialChatroomSlug={id} />;
// };

// export default ChatroomPage;

// import ChatPageClient from "../chat-page-client";

// type ChatroomPageProps = {
//   params: Promise<{ id: string }>;
// };

// const ChatroomPage = async ({ params }: ChatroomPageProps) => {
//   const { id } = await params;
//   return <ChatPageClient initialChatroomSlug={id} />;
// };

// export default ChatroomPage;

// import ChatPageClient from "../chat-page-client";

// type ChatroomPageProps = {
//   params: Promise<{ id: string }>;
// };

// const ChatroomPage = async ({ params }: ChatroomPageProps) => {
//   const { id } = await params;
//   return <ChatPageClient initialChatroomSlug={id} />;
// };

// export default ChatroomPage;

// import ChatPageClient from "../chat-page-client";

// type ChatroomPageProps = {
//   params: Promise<{ id: string }>;
// };

// const ChatroomPage = async ({ params }: ChatroomPageProps) => {
//   const { id } = await params;
//   return <ChatPageClient initialChatroomSlug={id} />;
// };

// export default ChatroomPage;

// import ChatPageClient from "../chat-page-client";

// type ChatroomPageProps = {
//   params: Promise<{ id: string }>;
// };

// const ChatroomPage = async ({ params }: ChatroomPageProps) => {
//   const { id } = await params;
//   return <ChatPageClient initialChatroomSlug={id} />;
// };

// export default ChatroomPage;

// import ChatPageClient from "../chat-page-client";

// type ChatroomPageProps = {
//   params: Promise<{ id: string }>;
// };

// const ChatroomPage = async ({ params }: ChatroomPageProps) => {
//   const { id } = await params;
//   return <ChatPageClient initialChatroomSlug={id} />;
// };

// export default ChatroomPage;

// import ChatPageClient from "../chat-page-client";

// type ChatroomPageProps = {
//   params: Promise<{ id: string }>;
// };

// const ChatroomPage = async ({ params }: ChatroomPageProps) => {
//   const { id } = await params;
//   return <ChatPageClient initialChatroomSlug={id} />;
// };

// export default ChatroomPage;

// import ChatPageClient from "../chat-page-client";

// type ChatroomPageProps = {
//   params: Promise<{ id: string }>;
// };

// const ChatroomPage = async ({ params }: ChatroomPageProps) => {
//   const { id } = await params;
//   return <ChatPageClient initialChatroomSlug={id} />;
// };

// export default ChatroomPage;

// import ChatPageClient from "../chat-page-client";

// type ChatroomPageProps = {
//   params: Promise<{ id: string }>;
// };

// const ChatroomPage = async ({ params }: ChatroomPageProps) => {
//   const { id } = await params;
//   return <ChatPageClient initialChatroomSlug={id} />;
// };

// export default ChatroomPage;

// import ChatPageClient from "../chat-page-client";

// type ChatroomPageProps = {
//   params: Promise<{ id: string }>;
// };

// const ChatroomPage = async ({ params }: ChatroomPageProps) => {
//   const { id } = await params;
//   return <ChatPageClient initialChatroomSlug={id} />;
// };

// export default ChatroomPage;

// import ChatPageClient from "../chat-page-client";

// type ChatroomPageProps = {
//   params: Promise<{ id: string }>;
// };

// const ChatroomPage = async ({ params }: ChatroomPageProps) => {
//   const { id } = await params;
//   return <ChatPageClient initialChatroomSlug={id} />;
// };

// export default ChatroomPage;

// import ChatPageClient from "../chat-page-client";

// type ChatroomPageProps = {
//   params: Promise<{ id: string }>;
// };

// const ChatroomPage = async ({ params }: ChatroomPageProps) => {
//   const { id } = await params;
//   return <ChatPageClient initialChatroomSlug={id} />;
// };

// export default ChatroomPage;

// import ChatPageClient from "../chat-page-client";

// type ChatroomPageProps = {
//   params: Promise<{ id: string }>;
// };

// const ChatroomPage = async ({ params }: ChatroomPageProps) => {
//   const { id } = await params;
//   return <ChatPageClient initialChatroomSlug={id} />;
// };

// export default ChatroomPage;

const connStatus = {
  [ReadyState.CONNECTING]: "Connecting",
  [ReadyState.OPEN]: "Open",
  [ReadyState.CLOSING]: "Closing",
  [ReadyState.CLOSED]: "Closed",
  [ReadyState.UNINSTANTIATED]: "Uninstantiated",
};

const ChatRoomPage = ({ params }: PageProps<"/chat/[id]">) => {
  const { id } = use(params);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const input = useRef<HTMLInputElement>(null);
  // const {data: me} = useQuery(api.auth.me())

  const { sendMessage, lastMessage, readyState } = useWebSocket(
    `ws://localhost:8080/chat/${id}/ws`
  );

  const handleSubmit: FormEventHandler = useCallback((e) => {
    e.preventDefault();

    if (!input.current) return;
    sendMessage(input.current.value);
  }, []);
  console.log(connStatus[readyState]);

  useEffect(() => {
    if (!lastMessage) return;
    const { data: msg, error } = chatMessageSchema.safeParse(
      JSON.parse(lastMessage.data)
    );
    console.log(msg);
    if (error) {
      console.error(error);
      return;
    }

    setMessages((prev) => [...prev, msg]);
  }, [lastMessage]);

  return (
    <main>
      <h3 className="mb-4">Room {id.split("-")[0]}</h3>
      <ul>
        {messages.map((m, i) => (
          <Message key={i} msg={m} />
        ))}
      </ul>
      <form onSubmit={handleSubmit} className="flex gap-2 mt-2">
        <Input ref={input} type="text" />
        <Button type="submit">Send</Button>
      </form>
    </main>
  );
};

export default ChatRoomPage;

const Message = ({ msg }: { msg: ChatMessage }) => {
  // useQuery(api.)
  return (
    <li className="flex justify-between">
      <div>
        <span className="text-muted-foreground mr-2">
          {msg.sentAt.toTimeString()}
        </span>
        <span className="ml-1">{msg.body}</span>
      </div>
      <span className="font-mono">{msg.sentBy.split("-")[0]}</span>
    </li>
  );
};
