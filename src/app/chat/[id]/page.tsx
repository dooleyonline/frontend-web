"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChatMessage, chatMessageSchema } from "@/lib/types/chat";
import { use, useCallback, useEffect, useState } from "react";
import useWebSocket, { ReadyState } from "react-use-websocket";

const connStatus = {
  [ReadyState.CONNECTING]: "Connecting",
  [ReadyState.OPEN]: "Open",
  [ReadyState.CLOSING]: "Closing",
  [ReadyState.CLOSED]: "Closed",
  [ReadyState.UNINSTANTIATED]: "Uninstantiated",
};

const ChatRoomPage = ({ params }: PageProps<"/chat/[id]">) => {
  const { id } = use(params);
  // const [messages, setMessages] = useState<MessageEvent<ChatMessage>[]>([]);
  const [messages, setMessages] = useState<string[]>([]);

  const { sendMessage, lastMessage, readyState } = useWebSocket(
    // `ws://localhost:8080/chat/${id}/ws`
    "wss://echo.websocket.org"
  );

  const handleSend = useCallback(() => sendMessage("test message"), []);
  console.log(connStatus[readyState]);

  useEffect(() => {
    if (!lastMessage) return;
    // const { error } = chatMessageSchema.safeParse(lastMessage);
    // console.error(error);
    console.log(lastMessage);

    setMessages((prev) => [...prev, lastMessage.data]);
  }, [lastMessage]);

  return (
    <div>
      <h3>Messages</h3>
      <ul>
        {messages.map((m, i) => (
          <div key={i}>{m}</div>
        ))}
      </ul>
      <Button onClick={handleSend}>Send</Button>
    </div>
  );
};

export default ChatRoomPage;
