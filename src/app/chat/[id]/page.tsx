import ChatPageClient from "../chat-page-client";

const ChatroomPage = async ({ params }: PageProps<"/chat/[id]">) => {
  const { id } = await params;

  return <ChatPageClient initialChatroomSlug={id} />;
};

export default ChatroomPage;
