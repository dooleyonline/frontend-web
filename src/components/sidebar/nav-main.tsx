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
import { usePathname, useRouter } from "next/navigation";

type NavMainProps = {
  pages: {
    title: string;
    url: string;
    icon?: LucideIcon;
  }[];
};

export const NavMain = ({ pages }: NavMainProps) => {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
          {pages.map((page) => (
            <Link
              key={page.title}
              href={page.url}
              onClick={router.refresh}
              style={{
                background:
                  pathname === page.url ? "var(--sidebar-accent)" : "",
                color:
                  pathname === page.url
                    ? "var(--sidebar-accent-foreground)"
                    : "",
              }}
              className="cursor-pointer overflow-hidden rounded-md"
            >
              <SidebarMenuItem>
                <SidebarMenuButton tooltip={page.title}>
                  {page.icon && <page.icon />}
                  <span>{page.title}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </Link>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
};
