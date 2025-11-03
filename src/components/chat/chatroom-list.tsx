"use client";

import { useMemo, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import {
  MessageSquarePlusIcon,
  SearchIcon,
  UsersIcon,
} from "lucide-react";

import { buildChatroomTitle } from "@/lib/chat/title";
import { Chatroom } from "@/lib/types";
import { cn } from "@/lib/utils";

import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { ScrollArea } from "../ui/scroll-area";

type ChatroomListProps = {
  chatrooms: Chatroom[];
  currentUserId: string;
  activeChatroomId?: string | null;
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
  onSelect: (chatroomId: string) => void;
  onStartNewChat?: () => void;
  disableNewChat?: boolean;
};

const normalize = (value: string) => value.toLowerCase().trim();

const getLastMessage = (chatroom: Chatroom) =>
  chatroom.messages[chatroom.messages.length - 1] ?? null;

const getSenderName = (
  chatroom: Chatroom,
  senderId: string,
  currentUserId: string,
) => {
  if (senderId === currentUserId) return "You";
  return (
    chatroom.participants.find((participant) => participant.id === senderId)
      ?.displayName ?? "Unknown"
  );
};

const getAvatarUrl = (chatroom: Chatroom, currentUserId: string) => {
  if (chatroom.isGroup) {
    return chatroom.participants.find((p) => p.id !== currentUserId)?.avatarUrl;
  }
  return chatroom.participants.find((p) => p.id !== currentUserId)?.avatarUrl;
};

const getInitials = (value: string) =>
  value
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase())
    .slice(0, 2)
    .join("");

export const ChatroomList = (props: ChatroomListProps) => {
  const {
    chatrooms,
    activeChatroomId,
    currentUserId,
    onSelect,
    isLoading,
    isError,
    onRetry,
    onStartNewChat,
    disableNewChat,
  } = props;
  const [search, setSearch] = useState("");

  const filteredChatrooms = useMemo(() => {
    if (!search) return chatrooms;
    const regex = normalize(search);
    return chatrooms.filter((chatroom) => {
      const title = normalize(buildChatroomTitle(chatroom, currentUserId));
      if (title.includes(regex)) return true;

      return chatroom.participants
        .map((participant) => normalize(participant.displayName))
        .some((name) => name.includes(regex));
    });
  }, [chatrooms, search, currentUserId]);

  return (
    <div className="flex h-full flex-col bg-background">
      <div className="flex items-center justify-between px-3 py-3">
        <div className="flex flex-col">
          <span className="text-sm font-medium text-muted-foreground">
            Inbox
          </span>
          <h2 className="text-lg font-semibold leading-none">Messages</h2>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onStartNewChat}
          disabled={disableNewChat}
          aria-label="Start a new chat"
        >
          <MessageSquarePlusIcon className="h-5 w-5" />
        </Button>
      </div>

      <div className="px-3 pb-3">
        <div className="relative">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            autoComplete="off"
            placeholder="Search"
            onChange={(event) => setSearch(event.currentTarget.value)}
            className="h-9 rounded-full bg-muted pl-9 text-sm"
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="flex flex-col">
          {isLoading &&
            Array.from({ length: 6 }).map((_, index) => (
              <div
                key={`chat-skeleton-${index}`}
                className="flex items-center gap-3 px-3 py-3"
              >
                <div className="size-12 animate-pulse rounded-full bg-muted" />
                <div className="flex flex-1 flex-col gap-2">
                  <div className="h-3 w-2/3 animate-pulse rounded-full bg-muted" />
                  <div className="h-3 w-4/5 animate-pulse rounded-full bg-muted/70" />
                </div>
              </div>
            ))}

          {!isLoading && isError && (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-12 text-center text-sm text-muted-foreground">
              <p>We couldn&apos;t load your messages.</p>
              {onRetry ? (
                <Button size="sm" onClick={onRetry} variant="outline">
                  Try again
                </Button>
              ) : null}
            </div>
          )}

          {!isLoading && !isError && filteredChatrooms.length === 0 ? (
            <div className="px-5 py-8 text-center text-sm text-muted-foreground">
              {chatrooms.length === 0
                ? "No conversations yet. Start a new chat to see messages here."
                : "No conversations found."}
            </div>
          ) : (
            filteredChatrooms.map((chatroom) => {
              const lastMessage = getLastMessage(chatroom);
              const title = buildChatroomTitle(chatroom, currentUserId);
              const avatarUrl = getAvatarUrl(chatroom, currentUserId);
              const preview = lastMessage
                ? `${getSenderName(chatroom, lastMessage.senderId, currentUserId)}: ${
                    lastMessage.body
                  }`
                : "No messages yet";
              const timeLabel = lastMessage
                ? formatDistanceToNow(lastMessage.sentAt, { addSuffix: false })
                : "";

              return (
                <ChatroomListItem
                  key={chatroom.id}
                  active={activeChatroomId === chatroom.id}
                  unreadCount={chatroom.unreadCount}
                  title={title}
                  subtitle={preview}
                  onClick={() => onSelect(chatroom.id)}
                  timeLabel={timeLabel}
                  avatarUrl={avatarUrl}
                  isGroup={chatroom.isGroup}
                />
              );
            })
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

type ChatroomListItemProps = {
  title: string;
  subtitle: string;
  timeLabel: string;
  unreadCount: number;
  active: boolean;
  avatarUrl?: string | null | undefined;
  isGroup?: boolean;
  onClick: () => void;
};

const ChatroomListItem = (props: ChatroomListItemProps) => {
  const {
    title,
    subtitle,
    timeLabel,
    unreadCount,
    active,
    onClick,
    avatarUrl,
    isGroup,
  } = props;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 border-b px-3 py-3 text-left transition hover:bg-accent",
        active ? "bg-accent" : "bg-background",
      )}
    >
      <div className="relative">
        <Avatar className={cn("size-12", isGroup && "ring-2 ring-border")}>
          {avatarUrl ? <AvatarImage src={avatarUrl} alt={title} /> : null}
          <AvatarFallback className="text-base font-semibold">
            {isGroup ? <UsersIcon className="h-5 w-5" /> : getInitials(title)}
          </AvatarFallback>
        </Avatar>
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start gap-1">
          <span className="line-clamp-1 text-sm font-medium">{title}</span>
          {timeLabel ? (
            <span className="ml-auto text-xs text-muted-foreground">
              {timeLabel}
            </span>
          ) : null}
        </div>
        <p className="line-clamp-2 text-xs text-muted-foreground">{subtitle}</p>
      </div>

      {unreadCount > 0 ? (
        <span className="ml-2 inline-flex min-w-5 items-center justify-center rounded-full bg-primary px-2 text-xs font-semibold text-primary-foreground">
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      ) : null}
    </button>
  );
};
