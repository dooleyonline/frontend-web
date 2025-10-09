"use client";

import { NavMain } from "@/components/sidebar/nav-main";
import { NavSecondary } from "@/components/sidebar/nav-secondary";
import { NavUser } from "@/components/sidebar/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  BellIcon,
  MessageCircleIcon,
  SettingsIcon,
  ShoppingBasketIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import * as React from "react";

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

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader className="mb-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:p-1.5!"
            >
              <Link href="/">
                <Image src="/logo.svg" alt="logo" width={32} height={32} />
                <span className={`font-logo text-base font-medium`}>
                  dooleyonline
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  );
}
