"use client";

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

type NavMainProps = {
  items: {
    title: string;
    url: string;
    icon?: LucideIcon;
  }[];
};

export const NavMain = ({ items }: NavMainProps) => {
  const pathname = usePathname();

  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
          {items.map((item) => (
            <Link
              key={item.title}
              href={item.url}
              style={{
                background:
                  pathname === item.url ? "var(--sidebar-accent)" : "",
                color:
                  pathname === item.url
                    ? "var(--sidebar-accent-foreground)"
                    : "",
              }}
              className="cursor-pointer overflow-hidden rounded-md"
            >
              <SidebarMenuItem>
                <SidebarMenuButton tooltip={item.title}>
                  {item.icon && <item.icon />}
                  <span>{item.title}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </Link>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
};
