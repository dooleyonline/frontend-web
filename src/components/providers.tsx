"use client";

import { UserProvider } from "@/contexts/user";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { type ReactNode } from "react";

import { ChatroomsStreamListener } from "./chat/chatrooms-stream-listener";
import { SidebarProvider } from "./ui/sidebar";

const queryClient = new QueryClient();

const Providers = ({ children }: { children: ReactNode }) => {
  return (
    <QueryClientProvider client={queryClient}>
      <ReactQueryDevtools initialIsOpen={false} />
      <UserProvider>
        <ChatroomsStreamListener />
        <SidebarProvider>{children}</SidebarProvider>
      </UserProvider>
    </QueryClientProvider>
  );
};

export default Providers;
