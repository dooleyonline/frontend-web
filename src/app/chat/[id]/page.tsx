import ChatPageClient from "../chat-page-client";

type ChatroomPageProps = {
  params: Promise<{ id: string }>;
};

const ChatroomPage = async ({ params }: ChatroomPageProps) => {
  const { id } = await params;
  return <ChatPageClient initialChatroomSlug={id} />;
};

export default ChatroomPage;
