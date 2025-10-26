const ChatRoomLayout = async ({
  params,
  children,
}: LayoutProps<"/chat/[id]">) => {
  const { id } = await params;

  return (
    <main>
      <h2>Room {id}</h2>
      {children}
    </main>
  );
};

export default ChatRoomLayout;
