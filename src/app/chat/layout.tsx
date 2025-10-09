import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Living @ dooleyonline",
  description: "Find your perfect place; WIP",
};

const ChatLayout = ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => {
  return <>{children}</>;
};

export default ChatLayout;
