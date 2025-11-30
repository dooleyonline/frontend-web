"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { format, formatDistanceToNow } from "date-fns";
import {
  ArrowLeftIcon,
  BellRingIcon,
  ExternalLinkIcon,
  ImageIcon,
  InfoIcon,
  LogOutIcon,
  MapIcon,
  MapPinIcon,
  SmileIcon,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import { buildChatroomTitle } from "@/lib/chat/title";
import { buildGoogleStaticMapUrl, extractLinkPreviewCandidate } from "@/lib/chat/link-preview";
import api from "@/lib/api";
import { ChatMessage, Chatroom, Item } from "@/lib/types";
import { cn, formatPrice } from "@/lib/utils";

import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Skeleton } from "../ui/skeleton";

type MessagePaneProps = {
  chatroom?: Chatroom | null;
  currentUserId: string;
  sending: boolean;
  onSendMessage: (body: string) => Promise<boolean>;
  onLoadMore?: () => Promise<void> | void;
  loadingMore?: boolean;
  hasMore?: boolean;
  onBack?: () => void;
  onOpenMap?: (chatroom: Chatroom) => void;
  onLeaveChatroom?: (chatroomId: string) => Promise<void> | void;
  leaving?: boolean;
  onOpenParticipants?: (chatroom: Chatroom) => void;
};

export const MessagePane = ({
  chatroom,
  currentUserId,
  sending,
  onSendMessage,
  onLoadMore,
  loadingMore = false,
  hasMore = false,
  onBack,
  onOpenMap,
  onLeaveChatroom,
  leaving = false,
  onOpenParticipants,
}: MessagePaneProps) => {
  const [draftsByChatroom, setDraftsByChatroom] = useState<Record<string, string>>({});
  const viewportRef = useRef<HTMLDivElement>(null);
  const previousScrollHeightRef = useRef(0);
  const previousScrollTopRef = useRef(0);
  const pendingLoadRef = useRef(false);
  const nearBottomRef = useRef(true);
  const lastMessageIdRef = useRef<string | null>(null);
  const lastChatroomIdRef = useRef<string | null>(null);
  const currentChatroomId = chatroom?.id ?? null;
  const draft =
    currentChatroomId && draftsByChatroom[currentChatroomId] !== undefined
      ? draftsByChatroom[currentChatroomId]
      : "";

  const updateDraft = (value: string) => {
    if (!currentChatroomId) return;
    setDraftsByChatroom((previous) => {
      if (previous[currentChatroomId] === value) {
        return previous;
      }
      return { ...previous, [currentChatroomId]: value };
    });
  };

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

    // If we're prepending older messages, wait until loadingMore flips false,
    // then restore the relative scroll position without jumping to bottom.
    if (pendingLoadRef.current) {
      if (!loadingMore) {
        const delta = el.scrollHeight - previousScrollHeightRef.current;
        el.scrollTop = previousScrollTopRef.current + delta;
        pendingLoadRef.current = false;
      }
      return;
    }

    const chatroomChanged = lastChatroomIdRef.current !== chatroom?.id;
    if (chatroomChanged) {
      nearBottomRef.current = true;
    }

    const lastMessage = sortedMessages.at(-1);
    const lastMessageId = lastMessage?.id ?? null;
    const hasNewMessage = lastMessageId && lastMessageId !== lastMessageIdRef.current;
    const lastMessageFromSelf =
      hasNewMessage && lastMessage?.senderId === currentUserId;

    // Stay pinned to bottom when switching rooms, when the user is near bottom, or when
    // the latest message is our own.
    if (chatroomChanged || nearBottomRef.current || lastMessageFromSelf) {
      el.scrollTop = el.scrollHeight;
    }

    lastChatroomIdRef.current = chatroom?.id ?? null;
    lastMessageIdRef.current = lastMessageId;
  }, [sortedMessages.length, chatroom?.id, loadingMore, currentUserId, sortedMessages]);

  const handleScroll = () => {
    const el = viewportRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.clientHeight - el.scrollTop;
    nearBottomRef.current = distanceFromBottom < 120;

    if (!onLoadMore || !hasMore || loadingMore || pendingLoadRef.current) return;
    if (el.scrollTop <= 40) {
      previousScrollHeightRef.current = el.scrollHeight;
      previousScrollTopRef.current = el.scrollTop;
      pendingLoadRef.current = true;
      void onLoadMore();
    }
  };

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
      const success = await onSendMessage(content);
      if (success) {
        updateDraft("");
      }
    } catch {
      // handled upstream
    }
  };

  const handleLeaveChat = () => {
    if (!chatroom || !onLeaveChatroom) return;
    void onLeaveChatroom(chatroom.id);
  };

  const handleOpenParticipants = () => {
    if (!chatroom || !onOpenParticipants) return;
    onOpenParticipants(chatroom);
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
    <div className="flex h-full min-h-0 flex-1 flex-col">
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
        {onLeaveChatroom || onOpenParticipants ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="ml-auto"
              >
                <InfoIcon className="h-5 w-5" />
                <span className="sr-only">Chat info</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              {onOpenParticipants ? (
                <DropdownMenuItem onSelect={handleOpenParticipants}>
                  Participants
                </DropdownMenuItem>
              ) : null}
              {onLeaveChatroom ? (
                <DropdownMenuItem
                  onSelect={handleLeaveChat}
                  variant="destructive"
                  disabled={leaving}
                >
                  <LogOutIcon className="h-4 w-4" />
                  Leave chat
                </DropdownMenuItem>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}
      </header>

      <div
        ref={viewportRef}
        className="flex-1 min-h-0 max-h-[calc(80vh-0px)] space-y-4 overflow-y-auto px-3 py-5"
        onScroll={handleScroll}
      >
        {hasMore ? (
          <div className="flex justify-center">
            {loadingMore ? (
              <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
                Loading earlier messages...
              </span>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="text-[11px] uppercase"
                onClick={onLoadMore}
              >
                Load earlier messages
              </Button>
            )}
          </div>
        ) : null}
        <SystemNotice message="Avoid meeting in places without an emergency (the blue) tower." />
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
            onChange={(event) => updateDraft(event.currentTarget.value)}
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

const SystemNotice = ({ message }: { message: string }) => {
  return (
    <div className="flex justify-center">
      <div className="flex max-w-[80%] items-start gap-2 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-2 text-xs text-blue-700 shadow-sm dark:border-blue-400/30 dark:bg-blue-500/10 dark:text-blue-100">
        <BellRingIcon className="mt-0.5 h-4 w-4 shrink-0 text-blue-600 dark:text-blue-200" />
        <span className="whitespace-pre-line leading-relaxed">{message}</span>
      </div>
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
            "flex flex-col gap-2 rounded-2xl px-4 py-2 text-sm shadow-sm",
            isOwn
              ? "ml-auto bg-primary text-primary-foreground"
              : "bg-muted text-foreground",
          )}
        >
          <span className="whitespace-pre-line break-words">
            {message.body}
          </span>
          <MessageLinkPreview message={message} isOwn={isOwn} />
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

type ProductPreviewState =
  | {
      kind: "product";
      status: "loading";
      url: string;
      itemId: string;
    }
  | {
      kind: "product";
      status: "error";
      url: string;
      itemId: string;
    }
  | {
      kind: "product";
      status: "success";
      url: string;
      itemId: string;
      item: Item;
    };

type MapPreviewState = {
  kind: "google-map";
  status: "success";
  url: string;
  label: string;
  staticMapUrl: string | null;
};

type MessagePreviewState = ProductPreviewState | MapPreviewState | null;

const ensureAbsoluteUrl = (value: string): string => {
  if (value.startsWith("http://") || value.startsWith("https://")) {
    return value;
  }
  if (value.startsWith("www.")) {
    return `https://${value}`;
  }
  return value;
};

const useMessageLinkPreview = (message: ChatMessage): MessagePreviewState => {
  const candidate = useMemo(
    () => extractLinkPreviewCandidate(message.body),
    [message.body],
  );

  const productItemId =
    candidate?.kind === "product" ? candidate.itemId : null;

  const productQueryOptions = useMemo(
    () => (productItemId ? api.item.get(productItemId) : null),
    [productItemId],
  );

  const productQuery = useQuery<Item | null>({
    ...(productQueryOptions ?? {
      queryKey: ["chat", "preview", "product", "noop"],
      queryFn: async () => null,
    }),
    enabled: Boolean(productItemId),
    staleTime: 1000 * 60 * 5,
  });

  return useMemo(() => {
    if (!candidate) return null;

    if (candidate.kind === "product") {
      if (productQuery.isLoading) {
        return {
          kind: "product",
          status: "loading",
          url: ensureAbsoluteUrl(candidate.url),
          itemId: candidate.itemId,
        };
      }

      if (productQuery.isError || !productQuery.data) {
        return {
          kind: "product",
          status: "error",
          url: ensureAbsoluteUrl(candidate.url),
          itemId: candidate.itemId,
        };
      }

      return {
        kind: "product",
        status: "success",
        url: ensureAbsoluteUrl(candidate.url),
        itemId: candidate.itemId,
        item: productQuery.data,
      };
    }

    if (candidate.kind === "google-map") {
      return {
        kind: "google-map",
        status: "success",
        url: ensureAbsoluteUrl(candidate.url),
        label: candidate.label,
        staticMapUrl: buildGoogleStaticMapUrl(
          candidate.query,
          candidate.center,
        ),
      };
    }

    return null;
  }, [candidate, productQuery.data, productQuery.isError, productQuery.isLoading]);
};

const MessageLinkPreview = ({
  message,
  isOwn,
}: {
  message: ChatMessage;
  isOwn: boolean;
}) => {
  const preview = useMessageLinkPreview(message);
  if (!preview) return null;

  if (preview.kind === "product") {
    if (preview.status === "loading") {
      return (
        <div
          className={cn(
            "rounded-xl border border-dashed p-3",
            isOwn
              ? "border-primary-foreground/40 bg-primary-foreground/60"
              : "border-border/60 bg-background/60",
          )}
        >
          <Skeleton className="h-16 w-full rounded-md" />
        </div>
      );
    }

    if (preview.status === "error") {
      return (
        <div
          className={cn(
            "rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs",
            isOwn ? "text-primary" : "text-destructive",
          )}
        >
          Unable to load item preview
        </div>
      );
    }

    return (
      <ProductPreviewCard
        item={preview.item}
        url={preview.url}
        isOwn={isOwn}
      />
    );
  }

  if (preview.kind === "google-map") {
    return (
      <MapPreviewCard
        label={preview.label}
        url={preview.url}
        staticMapUrl={preview.staticMapUrl}
        isOwn={isOwn}
      />
    );
  }

  return null;
};

const ProductPreviewCard = ({
  item,
  url,
  isOwn,
}: {
  item: Item;
  url: string;
  isOwn: boolean;
}) => {
  const imageSrc = item.images[0] ?? "";
  const priceLabel = formatPrice(item.price);
  const mutedTextClass = isOwn ? "text-primary/70" : "text-muted-foreground";

  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className={cn(
        "block overflow-hidden rounded-xl border transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        isOwn
          ? "border-primary-foreground/40 bg-primary-foreground text-primary ring-offset-primary"
          : "border-border bg-background text-foreground ring-offset-background",
      )}
    >
      <div className="flex items-center gap-3 p-3">
        <div className="relative h-16 w-16 overflow-hidden rounded-lg bg-muted">
          {imageSrc ? (
            <Image
              src={imageSrc}
              alt={item.name}
              fill
              sizes="64px"
              className="object-cover"
              unoptimized
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs font-medium text-muted-foreground">
              No image
            </div>
          )}
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="line-clamp-2 text-sm font-semibold">
            {item.name}
          </span>
          <span className={cn("text-xs font-medium", mutedTextClass)}>
            {priceLabel}
            {item.isNegotiable ? " • Negotiable" : ""}
          </span>
          <span
            className={cn(
              "flex items-center gap-1 text-xs font-semibold",
              isOwn ? "text-primary" : "text-foreground",
            )}
          >
            View item
            <ExternalLinkIcon className="h-3.5 w-3.5" />
          </span>
        </div>
      </div>
    </a>
  );
};

const MapPreviewCard = ({
  url,
  label,
  staticMapUrl,
  isOwn,
}: {
  url: string;
  label: string;
  staticMapUrl: string | null;
  isOwn: boolean;
}) => {
  const cardClasses = cn(
    "overflow-hidden rounded-xl border transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
    isOwn
      ? "border-primary-foreground/40 bg-primary-foreground text-primary ring-offset-primary"
      : "border-border bg-background text-foreground ring-offset-background",
  );

  return (
    <a href={url} target="_blank" rel="noreferrer" className={cardClasses}>
      {staticMapUrl ? (
        <div className="relative h-32 w-full">
          <Image
            src={staticMapUrl}
            alt={label}
            fill
            sizes="(max-width: 768px) 100vw, 384px"
            className="object-cover"
            unoptimized
          />
        </div>
      ) : (
        <div className="flex h-32 w-full items-center justify-center bg-muted text-xs">
          Map preview unavailable
        </div>
      )}
      <div className="flex items-center justify-between gap-2 px-3 py-2">
        <span className="flex min-w-0 items-center gap-2 text-sm font-semibold">
          <MapPinIcon className="h-4 w-4 shrink-0" />
          <span className="line-clamp-2">{label}</span>
        </span>
        <ExternalLinkIcon className="h-3.5 w-3.5 shrink-0" />
      </div>
    </a>
  );
};
