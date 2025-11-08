"use client";

import { UserProvider } from "@/contexts/user";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { type ReactNode } from "react";

import { SidebarProvider } from "./ui/sidebar";

const queryClient = new QueryClient();

const Providers = ({ children }: { children: ReactNode }) => {
  return (
    <QueryClientProvider client={queryClient}>
      <UserProvider>
        <SidebarProvider>{children}</SidebarProvider>
      </UserProvider>
    </QueryClientProvider>
  );
};

export default Providers;
