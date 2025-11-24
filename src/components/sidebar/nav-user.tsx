"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useUser } from "@/hooks/use-user";
import api from "@/lib/api";
import { serverQuery } from "@/lib/api/shared";
import { User } from "@/lib/types";
import { createImageURL, userFullname, userInitial } from "@/lib/utils";
import {
  BellIcon,
  LogOutIcon,
  MoreVerticalIcon,
  UserCircleIcon,
} from "lucide-react";
import Link from "next/link";
import { memo, useCallback } from "react";

import { Button } from "../ui/button";

export function NavUser() {
  const { isMobile } = useSidebar();
  const { user, revalidate } = useUser();

  const handleSignOut = useCallback(async () => {
    await serverQuery(api.auth.signOut());
    await revalidate();
  }, [revalidate]);

  return (
    <SidebarMenu>
      {user ? (
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                size="lg"
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              >
                <UserAvatar {...user} />
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">
                    {userFullname(user)}
                  </span>
                  <span className="truncate text-xs text-muted-foreground">
                    {user.email}
                  </span>
                </div>
                <MoreVerticalIcon className="ml-auto size-4" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg **:cursor-pointer"
              side={isMobile ? "bottom" : "right"}
              align="end"
              sideOffset={4}
            >
              <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                  <UserAvatar {...user} />
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">
                      {userFullname(user)}
                    </span>
                    <span className="truncate text-xs text-muted-foreground">
                      {user.email}
                    </span>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem>
                  <UserCircleIcon />
                  Account
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <BellIcon />
                  Notifications
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut}>
                <LogOutIcon />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      ) : (
        <SidebarMenuItem>
          <Link href="/auth/sign-in">
            <Button variant="outline" className="w-full">
              Sign In
            </Button>
          </Link>
        </SidebarMenuItem>
      )}
    </SidebarMenu>
  );
}

const UserAvatar = memo((user: User) => {
  return (
    <Avatar className="h-8 w-8 rounded-lg">
      <AvatarImage src={createImageURL(user.avatar, "user")} alt={userFullname(user)} />
      <AvatarFallback className="rounded-lg">
        {userInitial(user)}
      </AvatarFallback>
    </Avatar>
  );
});
UserAvatar.displayName = "UserAvatar";
