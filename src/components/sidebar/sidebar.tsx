"use client";

import {
  Sidebar as SidebarComponent,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar";
import {
  BellIcon,
  MessageCircleIcon,
  SettingsIcon,
  ShoppingBasketIcon,
} from "lucide-react";
import Image from "next/image";
import { ComponentProps } from "react";

import { NavMain } from "./nav-main";
import { NavSecondary } from "./nav-secondary";
import { NavUser } from "./nav-user";

const data = {
  user: {
    name: "Ethan Lee",
    email: "ethan.lee@emory.edu",
    avatar: "https://github.com/shadcn.png",
  },
  navMain: [
    {
      title: "Browse",
      url: "/",
      icon: ShoppingBasketIcon,
    },
    {
      title: "Chat",
      url: "/chat",
      icon: MessageCircleIcon,
    },
  ],
  navSecondary: [
    {
      title: "Notifications",
      url: "#",
      icon: BellIcon,
    },
    {
      title: "Settings",
      url: "#",
      icon: SettingsIcon,
    },
  ],
};

export function Sidebar({ ...props }: ComponentProps<typeof SidebarComponent>) {
  return (
    <SidebarComponent collapsible="offcanvas" {...props}>
      <SidebarHeader className="mb-4">
        <div className="flex items-center gap-2 pointer-events-none">
          <Image src="/logo.svg" alt="logo" width={32} height={32} />
          <span className={`font-logo text-base font-medium`}>
            dooleyonline
          </span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <NavMain pages={data.navMain} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </SidebarComponent>
  );
}
