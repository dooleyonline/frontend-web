import Link from "next/link";

const rooms = [1];

const ChatPage = () => {
  return (
    <main className="flex flex-col items-center justify-center h-full">
      {rooms.map((r) => (
        <Link key={r} href={`/chat/${r}`} className="">
          Room {r}
        </Link>
      ))}
    </main>
  );
};

export default ChatPage;
