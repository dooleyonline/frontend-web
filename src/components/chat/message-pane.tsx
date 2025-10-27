"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { format, formatDistanceToNow } from "date-fns";
import { ArrowLeftIcon, ImageIcon, MapIcon, SmileIcon } from "lucide-react";

import { buildChatroomTitle } from "@/lib/chat/title";
import { ChatMessage, Chatroom } from "@/lib/types";
import { cn } from "@/lib/utils";

import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Button } from "../ui/button";
import { Input } from "../ui/input";

type MessagePaneProps = {
  chatroom?: Chatroom | null;
  currentUserId: string;
  sending: boolean;
  onSendMessage: (body: string) => Promise<void>;
  onBack?: () => void;
  onOpenMap?: (chatroom: Chatroom) => void;
};

export const MessagePane = ({
  chatroom,
  currentUserId,
  sending,
  onSendMessage,
  onBack,
  onOpenMap,
}: MessagePaneProps) => {
  const [draft, setDraft] = useState("");
  const viewportRef = useRef<HTMLDivElement>(null);

  const otherParticipants = useMemo(
    () =>
      chatroom?.participants.filter((participant) => participant.id !== currentUserId) ?? [],
    [chatroom, currentUserId],
  );

  const conversationTitle = useMemo(
    () => (chatroom ? buildChatroomTitle(chatroom, currentUserId) : ""),
    [chatroom, currentUserId],
  );

  const conversationSubtitle = useMemo(() => {
    if (!chatroom) return "";
    if (!chatroom.isGroup) {
      const other = otherParticipants[0];
      if (!other) return "";
      return other.isOnline
        ? "Active now"
        : `Active ${formatDistanceToNow(chatroom.updatedAt, { addSuffix: true })}`;
    }

    const members = otherParticipants.map((participant) => participant.displayName);
    const totalMembers = chatroom.participants.length;
    const maxNames = 4;
    const visibleNames = members.slice(0, maxNames);
    const remainingCount = totalMembers - (visibleNames.length + 1);

    const namesLabel =
      visibleNames.length === 0
        ? ""
        : visibleNames.length === 1
        ? visibleNames[0]
        : visibleNames.length === 2
        ? visibleNames.join(" and ")
        : `${visibleNames.slice(0, -1).join(', ')}, and ${visibleNames.slice(-1)[0]}`;

    if (!namesLabel) {
      return `${totalMembers} member${totalMembers === 1 ? '' : 's'}`;
    }

    const remainderLabel =
      remainingCount > 0
        ? `, and ${remainingCount} other${remainingCount === 1 ? '' : 's'}`
        : "";

    return `${totalMembers} member${totalMembers === 1 ? '' : 's'} - ${namesLabel}${remainderLabel}`;
  }, [chatroom, otherParticipants]);

  const sortedMessages = useMemo(() => {
    if (!chatroom) return [];
    return [...chatroom.messages].sort((a, b) => a.sentAt.getTime() - b.sentAt.getTime());
  }, [chatroom]);

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [sortedMessages.length, chatroom?.id]);

  useEffect(() => {
    setDraft("");
  }, [chatroom?.id]);

  const handleOpenMap = () => {
    if (chatroom && onOpenMap) {
      onOpenMap(chatroom);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!chatroom) return;
    const content = draft.trim();
    if (!content) return;

    try {
      await onSendMessage(content);
      setDraft("");
    } catch {
      // handled upstream
    }
  };

  if (!chatroom) {
    return (
      <div className="flex h-full flex-1 flex-col items-center justify-center px-6 text-center text-sm text-muted-foreground">
        <div className="mx-auto flex max-w-sm flex-col gap-3">
          <h3 className="text-lg font-semibold text-foreground">
            Select a conversation
          </h3>
          <p>
            Choose a chat from the list to start messaging. New conversations
            will appear here as soon as they begin.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-1 flex-col">
      <header className="flex items-center gap-3 border-b px-3 py-3">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onBack}
          className="lg:hidden"
        >
          <ArrowLeftIcon className="h-5 w-5" />
        </Button>

        <Avatar className="size-11">
          {otherParticipants[0]?.avatarUrl ? (
            <AvatarImage
              src={otherParticipants[0]?.avatarUrl ?? ''}
              alt={conversationTitle}
            />
          ) : null}
          <AvatarFallback className="text-base font-semibold">
            {conversationTitle
              .split(' ')
              .map((part) => part[0])
              .join('')
              .toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="line-clamp-1 text-sm font-medium">
            {conversationTitle}
          </span>
          <span className="line-clamp-1 text-xs text-muted-foreground">
            {conversationSubtitle}
          </span>
        </div>
      </header>

      <div
        ref={viewportRef}
        className="flex-1 space-y-4 overflow-y-auto px-3 py-5"
      >
        {sortedMessages.map((message, index) => {
          const previous = sortedMessages[index - 1];
          const isOwn = message.senderId === currentUserId;
          const showAvatar =
            !isOwn && (!previous || previous.senderId !== message.senderId);

          return (
            <MessageBubble
              key={message.id}
              message={message}
              isOwn={isOwn}
              showAvatar={showAvatar}
              sender={
                chatroom.participants.find(
                  (participant) => participant.id === message.senderId,
                ) ?? null
              }
            />
          );
        })}
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-2 border-t px-3 py-3"
      >
        <Button type="button" size="icon" variant="ghost">
          <ImageIcon className="h-5 w-5" />
        </Button>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          onClick={handleOpenMap}
          disabled={!chatroom}
        >
          <MapIcon className="h-5 w-5" />
        </Button>

        <div className="relative flex-1">
          <Input
            value={draft}
            onChange={(event) => setDraft(event.currentTarget.value)}
            placeholder="Message..."
            className="h-11 rounded-full bg-muted px-4 text-sm"
            disabled={sending}
            autoComplete="off"
          />
          <SmileIcon className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
        </div>

        <Button
          type="submit"
          size="sm"
          className="rounded-full px-4"
          disabled={sending || draft.trim().length === 0}
        >
          Send
        </Button>
      </form>
    </div>
  );
};

type MessageBubbleProps = {
  message: ChatMessage;
  isOwn: boolean;
  showAvatar: boolean;
  sender: Chatroom["participants"][number] | null;
};

const MessageBubble = ({
  message,
  isOwn,
  showAvatar,
  sender,
}: MessageBubbleProps) => {
  return (
    <div
      className={cn(
        "flex items-end gap-2",
        isOwn ? "justify-end" : "justify-start",
      )}
    >
      {!isOwn ? (
        showAvatar ? (
          <Avatar className="size-9">
            {sender?.avatarUrl ? (
              <AvatarImage src={sender.avatarUrl} alt={sender.displayName} />
            ) : null}
            <AvatarFallback className="text-xs font-semibold">
              {sender
                ? sender.displayName
                    .split(' ')
                    .map((part) => part[0])
                    .join('')
                    .toUpperCase()
                : "?"}
            </AvatarFallback>
          </Avatar>
        ) : (
          <div className="size-9 shrink-0" />
        )
      ) : null}

      <div className="flex max-w-[75%] flex-col gap-1">
        <div
          className={cn(
            "rounded-2xl px-4 py-2 text-sm shadow-sm whitespace-pre-line",
            isOwn
              ? "ml-auto bg-primary text-primary-foreground"
              : "bg-muted text-foreground",
          )}
        >
          {message.body}
        </div>
        <span
          className={cn(
            "text-[10px] uppercase tracking-wide text-muted-foreground",
            isOwn ? "text-right" : "text-left",
          )}
        >
          {format(message.sentAt, "MMM d • h:mm a")}
        </span>
      </div>
    </div>
  );
};
