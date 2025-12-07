"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { usePathname, useRouter } from "next/navigation";
import useWebSocket, { ReadyState } from "react-use-websocket";

import { MessagePane, ChatroomList } from "@/components/chat";
import { CreateChatroomDialog } from "@/components/chat/create-chatroom-dialog";
import { CampusMapWrapper } from "@/components/map/map-wrapper";
import type { SelectedSpot } from "@/components/map/map";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";
import { API_BASE_URL } from "@/lib/env";
import { ChatMessage, ChatParticipant, Chatroom, chatMessageSchema } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  clearPendingChatMessage,
  loadPendingChatMessage,
} from "@/lib/chat/pending-message";
import {
  CHAT_MESSAGES_PAGE_SIZE,
  fetchMessagesPage,
  fetchParticipants,
} from "@/lib/api/chat";

const CHATROOMS_QUERY_KEY = ["chat", "chatrooms"] as const;
const ACCESS_DENIED_MESSAGE = "You do not have access to this conversation.";
const CHATROOM_NOT_FOUND_MESSAGE = "Conversation not found.";
const CHATROOM_ID_PREFIX = "room-";
const isDuplicateMessage = (messages: ChatMessage[], candidate: ChatMessage) =>
  messages.some((message) => {
    if (message.id === candidate.id) return true;
    if (message.senderId !== candidate.senderId) return false;
    if (message.body !== candidate.body) return false;
    const delta = Math.abs(message.sentAt.getTime() - candidate.sentAt.getTime());
    return delta <= 2000;
  });
const mergeMessages = (existing: ChatMessage[], incoming: ChatMessage[]) => {
  const merged = [...existing];
  incoming.forEach((message) => {
    if (!isDuplicateMessage(merged, message)) {
      merged.push(message);
    }
  });
  return merged.sort((a, b) => a.sentAt.getTime() - b.sentAt.getTime());
};
const buildParticipantStub = (id: string): ChatParticipant => ({
  id,
  displayName: id,
  username: id,
  avatarUrl: "",
  isOnline: false,
});

const removeTrailingSlash = (value: string) =>
  value.endsWith("/") ? value.slice(0, -1) : value;

const ensureWebSocketBaseUrl = () => {
  if (!API_BASE_URL || API_BASE_URL.length === 0) {
    throw new Error("NEXT_PUBLIC_API_BASE_URL must be defined for chat WebSocket connection.");
  }

  const trimmed = removeTrailingSlash(API_BASE_URL);
  if (trimmed.startsWith("https://")) {
    return `wss://${trimmed.slice("https://".length)}`;
  }
  if (trimmed.startsWith("http://")) {
    return `ws://${trimmed.slice("http://".length)}`;
  }
  return trimmed;
};

const WS_BASE_URL = ensureWebSocketBaseUrl();

const getChatroomSlug = (chatroomId: string) => {
  if (chatroomId.startsWith(CHATROOM_ID_PREFIX)) {
    const slug = chatroomId.slice(CHATROOM_ID_PREFIX.length);
    if (slug.length > 0) {
      return slug;
    }
  }
  return chatroomId;
};

type ChatPageClientProps = {
  initialChatroomSlug?: string | null;
};

const ChatPageClient = ({ initialChatroomSlug = null }: ChatPageClientProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const [activeChatroomId, setActiveChatroomId] = useState<string | null>(null);
  const [showListOnMobile, setShowListOnMobile] = useState(
    () => !initialChatroomSlug,
  );
  const [isMapDialogOpen, setIsMapDialogOpen] = useState(false);
  const [mapDialogChatroom, setMapDialogChatroom] = useState<Chatroom | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isParticipantsDialogOpen, setIsParticipantsDialogOpen] = useState(false);
  const [participantsDialogChatroom, setParticipantsDialogChatroom] =
    useState<Chatroom | null>(null);
  const [paginationByRoom, setPaginationByRoom] = useState<
    Record<string, { page: number; loading: boolean; exhausted: boolean; initialized: boolean }>
  >({});
  const [chatroomListReady, setChatroomListReady] = useState(false);
  const participantsFetchInFlightRef = useRef<Set<string>>(new Set());
  const queryClient = useQueryClient();
  const invalidAccessToastShownRef = useRef(false);
  const meQuery = useQuery(api.auth.me());
  const currentUserId = meQuery.data?.id ?? null;
  const participantNeedsHydration = (participant: ChatParticipant) => {
    const display = participant.displayName?.trim() ?? "";
    const username = participant.username?.trim() ?? "";
    return !display || display === participant.id || display === username;
  };

  const logPaginationDebug = useCallback(
    (
      context: string,
      opts: {
        roomId: string;
        messageCount?: number;
        messagesLength: number;
        pageSize?: number;
        page?: number;
        exhausted: boolean;
        loading?: boolean;
        initialized?: boolean;
      },
    ) => {
      const {
        roomId,
        messageCount,
        messagesLength,
        pageSize,
        page,
        exhausted,
        loading,
        initialized,
      } = opts;
      console.debug("[chat-pagination]", context, {
        roomId,
        messageCount,
        messagesLength,
        pageSize,
        page,
        exhausted,
        loading,
        initialized,
      });
    },
    [],
  );

  const chatroomListQuery = useQuery({
    ...api.chat.getChatrooms(),
    enabled: Boolean(currentUserId),
  });
  const mergeChatrooms = useCallback(
    (existing: Chatroom[] | undefined, incoming: Chatroom[]): Chatroom[] => {
      if (!existing || existing.length === 0) return incoming;
      const existingMap = new Map(existing.map((room) => [room.id, room]));

      const merged = incoming.map((room) => {
        const prior = existingMap.get(room.id);
        if (!prior) return room;

        const messages = mergeMessages(prior.messages, room.messages);
        const updatedAt =
          messages.at(-1)?.sentAt ?? room.updatedAt ?? prior.updatedAt;
        const readAll = prior.readAll || room.readAll;
        const unreadCount = readAll
          ? 0
          : room.unreadCount ?? prior.unreadCount;
        const messageCount =
          room.messageCount !== undefined
            ? room.messageCount
            : prior.messageCount;

        return {
          ...room,
          participants:
            prior.participants.length > 0 ? prior.participants : room.participants,
          messages,
          readAll,
          unreadCount,
          updatedAt,
          messageCount,
        };
      });

      existing.forEach((room) => {
        if (!merged.some((r) => r.id === room.id)) {
          merged.push(room);
        }
      });

      return merged.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
    },
    [],
  );

  useEffect(() => {
    if (!currentUserId) return;

    let cancelled = false;
    let source: EventSource | null = null;
    let retryDelay = 2000;

    const connect = () => {
      if (cancelled) return;
      source?.close();

      source = new EventSource(`${API_BASE_URL}/chat/rooms`, {
        withCredentials: true,
      });

      source.addEventListener("rooms", (event) => {
        const payload = (event as MessageEvent).data;
        try {
          const parsed = JSON.parse(payload);
          void api.chat
            .hydrateChatroomsFromPayload(parsed)
            .then((rooms) => {
              if (cancelled) return;
              queryClient.setQueryData<Chatroom[] | undefined>(
                CHATROOMS_QUERY_KEY,
                (previous) => mergeChatrooms(previous, rooms),
              );
            })
            .catch((error) => {
              console.error("Failed to hydrate chat rooms from stream.", error);
            });
          retryDelay = 2000;
        } catch (error) {
          console.error("Failed to parse chat rooms stream payload.", error);
        }
      });

      source.onerror = () => {
        source?.close();
        if (cancelled) return;
        const delay = Math.min(retryDelay, 30000);
        retryDelay = Math.min(retryDelay * 2, 30000);
        window.setTimeout(connect, delay);
      };
    };

    connect();

    return () => {
      cancelled = true;
      source?.close();
    };
  }, [currentUserId, queryClient, mergeChatrooms]);
  const chatrooms = useMemo(
    () => chatroomListQuery.data ?? [],
    [chatroomListQuery.data],
  );
  useEffect(() => {
    if (chatrooms.length > 0) {
      setChatroomListReady(true);
    }
  }, [chatrooms.length]);
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (chatroomListQuery.isLoading || chatroomListQuery.isFetching) return;
    const timer = window.setTimeout(() => setChatroomListReady(true), 2000);
    return () => window.clearTimeout(timer);
  }, [chatroomListQuery.isLoading, chatroomListQuery.isFetching]);
  useEffect(() => {
    setPaginationByRoom((previous) => {
      const next = { ...previous };
      chatrooms.forEach((room) => {
        if (next[room.id]) return;
        next[room.id] = {
          page: 1,
          loading: false,
          exhausted:
            typeof room.messageCount === "number"
              ? room.messageCount <= room.messages.length
              : false,
          initialized: room.messages.length >= CHAT_MESSAGES_PAGE_SIZE,
        };
        logPaginationDebug("init", {
          roomId: room.id,
          messageCount: room.messageCount,
          messagesLength: room.messages.length,
          pageSize: CHAT_MESSAGES_PAGE_SIZE,
          page: 1,
          exhausted: next[room.id].exhausted,
        });
      });
      return next;
    });
  }, [chatrooms, logPaginationDebug]);
  const chatroomListFetched = Boolean(currentUserId && chatroomListQuery.data);
  const chatroomListFetching = chatroomListQuery.isLoading || chatroomListQuery.isFetching;
  const chatroomListLoading = !chatroomListReady;

  const upsertChatroom = useCallback(
    (incoming: Chatroom) => {
      queryClient.setQueryData<Chatroom[] | undefined>(
        CHATROOMS_QUERY_KEY,
        (previous) => {
          if (!previous || previous.length === 0) {
            return [incoming];
          }

          const index = previous.findIndex((room) => room.id === incoming.id);
          if (index === -1) {
            return [...previous, incoming].sort(
              (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime(),
            );
          }

          const existing = previous[index];

          const mergedMessages = mergeMessages(existing.messages, incoming.messages);
          const messageCount =
            incoming.messageCount !== undefined
              ? incoming.messageCount
              : existing.messageCount;

          const nextRoom: Chatroom = {
            ...existing,
            ...incoming,
            participants:
              incoming.participants.length > 0
                ? incoming.participants
                : existing.participants,
            messages: mergedMessages,
            messageCount,
          };

          const next = [...previous];
          next[index] = nextRoom;
          return next.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
        },
      );
    },
    [queryClient],
  );

  const hydrateChatroom = useCallback(
    async (chatroomId: string, participantIds: string[] = []): Promise<Chatroom | null> => {
      try {
        const [participants, messages] = await Promise.all([
          fetchParticipants(chatroomId, participantIds),
          fetchMessagesPage(chatroomId, 1),
        ]);
        const latestMessageAt = messages.at(-1)?.sentAt ?? new Date();
        return {
          id: chatroomId,
          readAll: true,
          isGroup: participants.length > 2,
          updatedAt: latestMessageAt,
          unreadCount: 0,
          participants,
          messages,
        };
      } catch (error) {
        console.error("Failed to hydrate chatroom", chatroomId, error);
        return null;
      }
    },
    [],
  );

  const markChatroomAsRead = useCallback(
    (chatroomId: string | null) => {
      if (!chatroomId) return;
      queryClient.setQueryData<Chatroom[] | undefined>(
        CHATROOMS_QUERY_KEY,
        (previous) => {
          if (!previous) return previous;
          const index = previous.findIndex((room) => room.id === chatroomId);
          if (index === -1) return previous;
          const next = [...previous];
          next[index] = {
            ...previous[index],
            unreadCount: 0,
            readAll: true,
          };
          return next;
        },
      );
    },
    [queryClient],
  );

  const ensureRoomParticipants = useCallback(
    async (chatroomId: string) => {
      if (!chatroomId) return;
      const rooms = queryClient.getQueryData<Chatroom[] | undefined>(CHATROOMS_QUERY_KEY);
      const target = rooms?.find((room) => room.id === chatroomId);
      const needsHydration =
        !target ||
        target.participants.length === 0 ||
        target.participants.some(participantNeedsHydration);
      if (!needsHydration) return;
      const knownParticipantIds =
        target?.participants?.map((participant) => participant.id).filter(Boolean) ?? [];
      if (knownParticipantIds.length === 0) return;

      if (participantsFetchInFlightRef.current.has(chatroomId)) return;

      participantsFetchInFlightRef.current.add(chatroomId);
      try {
        const participants = await api.chat.fetchParticipants(chatroomId, knownParticipantIds);
        queryClient.setQueryData<Chatroom[] | undefined>(
          CHATROOMS_QUERY_KEY,
          (previous) => {
            if (!previous) return previous;
            const idx = previous.findIndex((room) => room.id === chatroomId);
            if (idx === -1) return previous;
            const nextRooms = [...previous];
            nextRooms[idx] = { ...previous[idx], participants };
            return nextRooms;
          },
        );
      } catch (error) {
        console.error("Failed to fetch participants", error);
      } finally {
        participantsFetchInFlightRef.current.delete(chatroomId);
      }
    },
    [queryClient],
  );
  useEffect(() => {
    if (!currentUserId) return;
    chatrooms.forEach((room) => {
      const needsParticipants =
        room.participants.length === 0 ||
        room.participants.some(participantNeedsHydration);
      if (needsParticipants) {
        void ensureRoomParticipants(room.id);
      }
    });
  }, [chatrooms, currentUserId, ensureRoomParticipants]);

  const {
    mutateAsync: createChatroomAsync,
    isPending: isCreatingChatroom,
  } = useMutation({
    mutationFn: api.chat.createChatroom,
  });
  const {
    mutateAsync: leaveChatroomAsync,
    isPending: isLeavingChatroom,
  } = useMutation({
    mutationFn: async (chatroomId: string) => {
      if (!currentUserId) {
        throw new Error("Sign in to leave this conversation.");
      }

      await api.chat.removeParticipant({
        chatroomId,
        userId: currentUserId,
      });

      return chatroomId;
    },
  });

  const activeChatroomSlug = useMemo(() => {
    if (!activeChatroomId) return null;
    return getChatroomSlug(activeChatroomId);
  }, [activeChatroomId]);

  const webSocketUrl = useMemo(() => {
    if (!activeChatroomSlug) return null;
    return `${WS_BASE_URL}/chat/${activeChatroomSlug}/ws`;
  }, [activeChatroomSlug]);

  const { sendMessage, lastMessage, readyState } = useWebSocket(webSocketUrl, {
    shouldReconnect: () => true,
    reconnectInterval: 2000,
  });

  useEffect(() => {
    invalidAccessToastShownRef.current = false;
  }, [initialChatroomSlug]);

  useEffect(() => {
    if (!activeChatroomId) return;
    markChatroomAsRead(activeChatroomId);
  }, [activeChatroomId, markChatroomAsRead]);

  useEffect(() => {
    if (!activeChatroomId) return;
    setPaginationByRoom((previous) => {
      if (previous[activeChatroomId]) return previous;
      return {
        ...previous,
        [activeChatroomId]: {
          page: 1,
          loading: false,
          exhausted: false,
          initialized: false,
        },
      };
    });
  }, [activeChatroomId]);

  const ensureRoomMessages = useCallback(
    async (chatroomId: string) => {
      let shouldFetch = false;

      setPaginationByRoom((previous) => {
        const pagination = previous[chatroomId];
        if (pagination?.loading || pagination?.initialized) {
          return previous;
        }

        shouldFetch = true;
        return {
          ...previous,
          [chatroomId]: {
            page: pagination?.page ?? 1,
            // keep loading false for initial fetch; we only flip it on manual load-more
            loading: false,
            exhausted: pagination?.exhausted ?? false,
            initialized: pagination?.initialized ?? false,
          },
        };
      });

      if (!shouldFetch) return;

      try {
        const messages = await fetchMessagesPage(chatroomId, 1);
        const rooms = queryClient.getQueryData<Chatroom[] | undefined>(CHATROOMS_QUERY_KEY);
        const room = rooms?.find((r) => r.id === chatroomId);
        const totalCount = room?.messageCount;
        setPaginationByRoom((previous) => ({
          ...previous,
          [chatroomId]: {
            page: 1,
            loading: false,
            exhausted:
              typeof totalCount === "number"
                ? totalCount <= messages.length
                : messages.length >= CHAT_MESSAGES_PAGE_SIZE,
            initialized: true,
          },
        }));
        logPaginationDebug("first-page", {
          roomId: chatroomId,
          messageCount: totalCount,
          messagesLength: messages.length,
          pageSize: CHAT_MESSAGES_PAGE_SIZE,
          page: 1,
          exhausted:
            typeof totalCount === "number"
              ? totalCount <= messages.length
              : messages.length >= CHAT_MESSAGES_PAGE_SIZE,
        });

        if (messages.length === 0) return;

        queryClient.setQueryData<Chatroom[] | undefined>(
          CHATROOMS_QUERY_KEY,
          (previous) => {
            if (!previous) return previous;
            const index = previous.findIndex((room) => room.id === chatroomId);
            if (index === -1) return previous;
            const target = previous[index];
            const mergedMessages = mergeMessages(target.messages, messages);

            const updated: Chatroom = {
              ...target,
              messages: mergedMessages,
            };

            const nextRooms = [...previous];
            nextRooms[index] = updated;
            return nextRooms;
          },
        );
      } catch (error) {
        console.error("Failed to fetch messages", error);
        const status =
          (error as { status?: number })?.status ??
          (error as { response?: { status?: number } })?.response?.status;
        if (status === 400) {
          toast.error(ACCESS_DENIED_MESSAGE);
        } else {
          toast.error("Could not load messages. Please try again.");
        }
        setPaginationByRoom((previous) => ({
          ...previous,
          [chatroomId]: {
            page: previous[chatroomId]?.page ?? 1,
            loading: false,
            exhausted: previous[chatroomId]?.exhausted ?? false,
            initialized: previous[chatroomId]?.initialized ?? false,
          },
        }));
      }
    },
    [queryClient, logPaginationDebug],
  );
  
  useEffect(() => {
    if (!chatroomListFetched || !currentUserId) {
      return;
    }

    if (!initialChatroomSlug) {
      if (activeChatroomId !== null) {
        setActiveChatroomId(null);
      }
      if (!showListOnMobile) {
        setShowListOnMobile(true);
      }
      setMapDialogChatroom(null);
      setIsMapDialogOpen(false);
      if (pathname !== "/chat") {
        router.replace("/chat");
      }
      return;
    }

    const matchingChatroom = chatrooms.find((chatroom) => {
      const normalizedSlug = getChatroomSlug(chatroom.id);
      return (
        normalizedSlug === initialChatroomSlug || chatroom.id === initialChatroomSlug
      );
    });

    if (!matchingChatroom) {
      if (chatroomListFetching) {
        return;
      }
      if (!invalidAccessToastShownRef.current) {
        toast.error(CHATROOM_NOT_FOUND_MESSAGE);
        invalidAccessToastShownRef.current = true;
      }
      if (activeChatroomId !== null) {
        setActiveChatroomId(null);
      }
      if (!showListOnMobile) {
        setShowListOnMobile(true);
      }
      setMapDialogChatroom(null);
      setIsMapDialogOpen(false);
      if (pathname !== "/chat") {
        router.replace("/chat");
      }
      return;
    }

    void ensureRoomParticipants(matchingChatroom.id);
    void ensureRoomMessages(matchingChatroom.id);

    if (activeChatroomId !== matchingChatroom.id) {
      setActiveChatroomId(matchingChatroom.id);
    }

    if (showListOnMobile) {
      setShowListOnMobile(false);
    }

    const desiredPath = `/chat/${getChatroomSlug(matchingChatroom.id)}`;
    if (pathname !== desiredPath) {
      router.replace(desiredPath);
    }
  }, [
    activeChatroomId,
    chatrooms,
    chatroomListFetched,
    chatroomListFetching,
    currentUserId,
    ensureRoomMessages,
    ensureRoomParticipants,
    initialChatroomSlug,
    pathname,
    router,
    showListOnMobile,
  ]);

  useEffect(() => {
    if (!lastMessage || !currentUserId) return;

    let parsed: ChatMessage;

    try {
      const payload = JSON.parse(lastMessage.data);
      const result = chatMessageSchema.safeParse(payload);
      if (!result.success) {
        console.error("Failed to parse chat message payload from WebSocket.", result.error);
        return;
      }
      parsed = result.data;
    } catch (error) {
      console.error("Invalid WebSocket message received for chat.", error);
      return;
    }

    let handled = false;

    queryClient.setQueryData<Chatroom[]>(CHATROOMS_QUERY_KEY, (previous) => {
      if (!previous) return previous;

      const index = previous.findIndex((chatroom) => chatroom.id === parsed.chatroomId);
      if (index === -1) {
        return previous;
      }

      const target = previous[index];
      if (isDuplicateMessage(target.messages, parsed)) {
        return previous;
      }

      handled = true;
      const isOwnMessage = parsed.senderId === currentUserId;
      const isActiveRoom = target.id === activeChatroomId;

      const updatedChatroom: Chatroom = {
        ...target,
        messages: [...target.messages, parsed],
        updatedAt: parsed.sentAt,
        unreadCount:
          isOwnMessage || isActiveRoom ? 0 : target.unreadCount + 1,
      };

      const next = [...previous];
      next[index] = updatedChatroom;

      return next.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
    });

    if (!handled && chatroomListFetched) {
      void (async () => {
        const hydrated = await hydrateChatroom(parsed.chatroomId);
        if (!hydrated) return;

        const nextUnread =
          parsed.senderId === currentUserId || activeChatroomId === parsed.chatroomId
            ? 0
            : hydrated.unreadCount + 1;

        upsertChatroom({
          ...hydrated,
          messages: [...hydrated.messages, parsed],
          updatedAt: parsed.sentAt,
          unreadCount: nextUnread,
        });
      })();
    }
  }, [
    lastMessage,
    queryClient,
    currentUserId,
    activeChatroomId,
    chatroomListFetched,
    hydrateChatroom,
    upsertChatroom,
  ]);


  const handleCreateChatroom = useCallback(
    async (participantIds: string[]) => {
      try {
        const uniqueParticipantIds = Array.from(
          new Set([currentUserId, ...participantIds]),
        ).filter(Boolean) as string[];

        const targetIds = new Set(uniqueParticipantIds);

        const findExistingRoom = async (): Promise<string | null> => {
          for (const room of chatrooms) {
            let candidate = room;
            if (candidate.participants.length === 0) {
              await ensureRoomParticipants(candidate.id);
              const refreshed = queryClient.getQueryData<Chatroom[] | undefined>(
                CHATROOMS_QUERY_KEY,
              );
              candidate = refreshed?.find((r) => r.id === room.id) ?? candidate;
            }

            const ids = new Set(candidate.participants.map((p) => p.id));
            if (
              ids.size === targetIds.size &&
              Array.from(targetIds).every((id) => ids.has(id))
            ) {
              return candidate.id;
            }
          }
          return null;
        };

        const existingRoomId = await findExistingRoom();
        if (existingRoomId) {
          setActiveChatroomId(existingRoomId);
          setShowListOnMobile(false);
          setIsMapDialogOpen(false);
          setMapDialogChatroom(null);
          const targetPath = `/chat/${getChatroomSlug(existingRoomId)}`;
          if (pathname !== targetPath) {
            router.push(targetPath);
          }
          toast.success("You already have a conversation with this person.");
          return;
        }

        const newChatroomId = await createChatroomAsync({
          participantIds: uniqueParticipantIds,
        });
        const participantStubs = uniqueParticipantIds.map(buildParticipantStub);
        const hydrated = await hydrateChatroom(newChatroomId, uniqueParticipantIds);
        if (hydrated) {
          const filled = hydrated.participants.length > 0 ? hydrated.participants : participantStubs;
          upsertChatroom({ ...hydrated, participants: filled });
        } else {
          upsertChatroom({
            id: newChatroomId,
            readAll: true,
            isGroup: uniqueParticipantIds.length > 2,
            updatedAt: new Date(),
            unreadCount: 0,
            participants: participantStubs,
            messages: [],
          });
          void ensureRoomParticipants(newChatroomId);
        }
        setActiveChatroomId(newChatroomId);
        markChatroomAsRead(newChatroomId);
        setShowListOnMobile(false);
        setIsMapDialogOpen(false);
        setMapDialogChatroom(null);
        const targetPath = `/chat/${getChatroomSlug(newChatroomId)}`;
        if (pathname !== targetPath) {
          router.push(targetPath);
        }
        toast.success("Chatroom created.");
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : "Failed to create chatroom. Please try again.",
        );
        throw error;
      }
    },
    [
      createChatroomAsync,
      currentUserId,
      chatrooms,
      ensureRoomParticipants,
      queryClient,
      router,
      pathname,
      hydrateChatroom,
      upsertChatroom,
      markChatroomAsRead,
    ],
  );

  const selectedChatroom = useMemo<Chatroom | null>(() => {
    if (!activeChatroomId) return null;
    return chatrooms.find((chatroom) => chatroom.id === activeChatroomId) ?? null;
  }, [chatrooms, activeChatroomId]);

  const handleChatroomSelect = (chatroomId: string) => {
    const chatroom = chatrooms.find((item) => item.id === chatroomId);
    if (!chatroom) {
      toast.error(ACCESS_DENIED_MESSAGE);
      if (pathname !== "/chat") {
        router.replace("/chat");
      }
      return;
    }

    const pagination = paginationByRoom[chatroomId];
    logPaginationDebug("select", {
      roomId: chatroomId,
      messageCount: chatroom.messageCount,
      messagesLength: chatroom.messages.length,
      pageSize: CHAT_MESSAGES_PAGE_SIZE,
      page: pagination?.page ?? 1,
      exhausted: pagination?.exhausted ?? false,
      loading: pagination?.loading ?? false,
      initialized: pagination?.initialized ?? false,
    });

    void ensureRoomParticipants(chatroomId);
    void ensureRoomMessages(chatroomId);

    setActiveChatroomId(chatroomId);
    markChatroomAsRead(chatroomId);
    setShowListOnMobile(false);
    setIsMapDialogOpen(false);
    setMapDialogChatroom(null);
    const targetPath = `/chat/${getChatroomSlug(chatroomId)}`;
    if (pathname !== targetPath) {
      router.push(targetPath);
    }
  };

  useEffect(() => {
    if (!activeChatroomId) return;
    const pagination = paginationByRoom[activeChatroomId];
    const room = chatrooms.find((r) => r.id === activeChatroomId);
    logPaginationDebug("state", {
      roomId: activeChatroomId,
      messageCount: room?.messageCount,
      messagesLength: room?.messages.length ?? 0,
      pageSize: CHAT_MESSAGES_PAGE_SIZE,
      page: pagination?.page ?? 1,
      exhausted: pagination?.exhausted ?? false,
      loading: pagination?.loading ?? false,
      initialized: pagination?.initialized ?? false,
    });
  }, [activeChatroomId, paginationByRoom, chatrooms, logPaginationDebug]);

  const handleSendMessage = useCallback(
    async (body: string) => {
      if (!activeChatroomId || !currentUserId) return false;
      if (!chatrooms.some((chatroom) => chatroom.id === activeChatroomId)) {
        toast.error(ACCESS_DENIED_MESSAGE);
        return false;
      }

      const payload = body.trim();
      if (!payload) return false;

      if (readyState !== ReadyState.OPEN) {
        toast.error("Reconnecting to chat... please try again in a moment.");
        return false;
      }

      setIsSending(true);
      let success = false;
      try {
        sendMessage(payload);
        success = true;
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : "Unable to send message through chat right now.",
        );
      } finally {
        setIsSending(false);
      }
      return success;
    },
    [
      activeChatroomId,
      chatrooms,
      currentUserId,
      readyState,
      sendMessage,
    ],
  );

  const handleLoadMoreMessages = useCallback(
    async (chatroomId: string) => {
      if (!chatroomId) return;
      const pagination = paginationByRoom[chatroomId];
      if (pagination?.loading || pagination?.exhausted) return;

      setPaginationByRoom((previous) => ({
        ...previous,
        [chatroomId]: {
          page: previous[chatroomId]?.page ?? 1,
          loading: true,
          exhausted: previous[chatroomId]?.exhausted ?? false,
          initialized: previous[chatroomId]?.initialized ?? false,
        },
      }));
      logPaginationDebug("load-more-start", {
        roomId: chatroomId,
        messageCount: queryClient.getQueryData<Chatroom[] | undefined>(CHATROOMS_QUERY_KEY)?.find((r) => r.id === chatroomId)?.messageCount,
        messagesLength: 0,
        pageSize: CHAT_MESSAGES_PAGE_SIZE,
        page: pagination?.page ?? 1,
        exhausted: pagination?.exhausted ?? false,
      });

      const nextPage = (pagination?.page ?? 1) + 1;
      try {
        const olderMessages = await fetchMessagesPage(chatroomId, nextPage);

        const rooms = queryClient.getQueryData<Chatroom[] | undefined>(CHATROOMS_QUERY_KEY);
        const room = rooms?.find((r) => r.id === chatroomId);
        const totalCount = room?.messageCount;

        setPaginationByRoom((previous) => ({
          ...previous,
          [chatroomId]: {
            page: nextPage,
            loading: false,
            exhausted:
              typeof totalCount === "number"
                ? totalCount <= (previous[chatroomId]?.page ?? 1) * CHAT_MESSAGES_PAGE_SIZE + olderMessages.length
                : olderMessages.length >= CHAT_MESSAGES_PAGE_SIZE,
            initialized: true,
          },
        }));
        logPaginationDebug("load-more", {
          roomId: chatroomId,
          messageCount: totalCount,
          messagesLength: olderMessages.length,
          pageSize: CHAT_MESSAGES_PAGE_SIZE,
          page: nextPage,
          exhausted:
            typeof totalCount === "number"
              ? totalCount <= (pagination?.page ?? 1) * CHAT_MESSAGES_PAGE_SIZE + olderMessages.length
              : olderMessages.length >= CHAT_MESSAGES_PAGE_SIZE,
        });

        if (olderMessages.length === 0) {
          return;
        }

    queryClient.setQueryData<Chatroom[] | undefined>(
      CHATROOMS_QUERY_KEY,
      (previous) => {
        if (!previous) return previous;
        const index = previous.findIndex((room) => room.id === chatroomId);
        if (index === -1) return previous;
        const target = previous[index];

        const mergedMessages = mergeMessages(target.messages, olderMessages);

        const updated: Chatroom = {
          ...target,
          messages: mergedMessages,
        };

        const nextRooms = [...previous];
        nextRooms[index] = updated;
        return nextRooms;
      },
    );
  } catch (error) {
        console.error("Failed to load older messages", error);
        setPaginationByRoom((previous) => ({
          ...previous,
          [chatroomId]: {
            page: pagination?.page ?? 1,
            loading: false,
            exhausted: pagination?.exhausted ?? false,
            initialized: pagination?.initialized ?? false,
          },
        }));
        toast.error("Could not load older messages. Please try again.");
      }
    },
    [paginationByRoom, queryClient, logPaginationDebug],
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!activeChatroomId) return;
    if (readyState !== ReadyState.OPEN) return;
    const pending = loadPendingChatMessage();
    if (!pending) return;
    if (pending.chatroomId !== activeChatroomId) return;

    const maxAgeMs = 5 * 60 * 1000;
    const isStale = Date.now() - pending.createdAt > maxAgeMs;
    if (isStale) {
      clearPendingChatMessage();
      return;
    }

    let cancelled = false;
    void (async () => {
      const sent = await handleSendMessage(pending.body);
      if (!cancelled && sent) {
        clearPendingChatMessage();
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [activeChatroomId, readyState, handleSendMessage]);

  const handleLeaveChatroom = useCallback(
    async (chatroomId: string) => {
      if (!chatroomId || !currentUserId) return;
      try {
        await leaveChatroomAsync(chatroomId);

        queryClient.setQueryData<Chatroom[] | undefined>(
          CHATROOMS_QUERY_KEY,
          (previous) => {
            if (!previous) return previous;
            return previous.filter((chatroom) => chatroom.id !== chatroomId);
          },
        );

        const leftActiveChatroom = activeChatroomId === chatroomId;
        if (leftActiveChatroom) {
          setActiveChatroomId(null);
          setShowListOnMobile(true);
          setIsMapDialogOpen(false);
          setMapDialogChatroom(null);
          setIsParticipantsDialogOpen(false);
          setParticipantsDialogChatroom(null);
          if (pathname !== "/chat") {
            router.replace("/chat");
          }
        }

        toast.success("You left the conversation.");
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : "Failed to leave the conversation. Please try again.",
        );
      }
    },
    [
      activeChatroomId,
      currentUserId,
      leaveChatroomAsync,
      pathname,
      queryClient,
      router,
    ],
  );

  const handleBackToList = () => {
    setShowListOnMobile(true);
    setIsMapDialogOpen(false);
    setMapDialogChatroom(null);
    if (pathname !== "/chat") {
      router.push("/chat");
    }
  };

  const handleOpenMapDialog = (chatroom: Chatroom) => {
    if (
      !currentUserId ||
      !chatroom.participants.some((participant) => participant.id === currentUserId)
    ) {
      toast.error(ACCESS_DENIED_MESSAGE);
      return;
    }

    setActiveChatroomId(chatroom.id);
    setShowListOnMobile(false);
    const targetPath = `/chat/${getChatroomSlug(chatroom.id)}`;
    if (pathname !== targetPath) {
      router.push(targetPath);
    }
    setMapDialogChatroom(chatroom);
    setIsMapDialogOpen(true);
  };

  const handleMapDialogOpenChange = (open: boolean) => {
    setIsMapDialogOpen(open);
    if (!open) {
      setMapDialogChatroom(null);
    }
  };

  const handleOpenParticipantsDialog = (chatroom: Chatroom) => {
    if (
      !currentUserId ||
      !chatroom.participants.some((participant) => participant.id === currentUserId)
    ) {
      toast.error(ACCESS_DENIED_MESSAGE);
      return;
    }

    if (!chatroom.participants || chatroom.participants.length === 0) {
      void ensureRoomParticipants(chatroom.id);
    }

    setParticipantsDialogChatroom(chatroom);
    setIsParticipantsDialogOpen(true);
  };

  const handleParticipantsDialogOpenChange = (open: boolean) => {
    setIsParticipantsDialogOpen(open);
    if (!open) {
      setParticipantsDialogChatroom(null);
    }
  };

  const handleShareSpot = async (spot: SelectedSpot) => {
    if (!mapDialogChatroom) return;
    if (!currentUserId) {
      toast.error(ACCESS_DENIED_MESSAGE);
      return;
    }
    if (
      !mapDialogChatroom.participants.some(
        (participant) => participant.id === currentUserId,
      )
    ) {
      toast.error(ACCESS_DENIED_MESSAGE);
      return;
    }

    const { id: chatroomId } = mapDialogChatroom;
    if (activeChatroomId !== chatroomId) {
      toast.error("Open this conversation to share a meetup spot.");
      return;
    }
    const [lng, lat] = spot.coordinates;
    const titlePrefix = spot.category === "accessible" ? "🚗" : "📍";
    const googleLink = `https://www.google.com/maps?q=${lat},${lng}`;
    const messageLines = [
      `${titlePrefix} ${spot.name}`,
      spot.desc?.trim() ? spot.desc : null,
      spot.zone ? `Zone: ${spot.zone}` : null,
      `Map: ${googleLink}`,
    ].filter(Boolean);
    const messageBody = messageLines.join("\n");

    const sent = await handleSendMessage(messageBody);
    if (sent) {
      setIsMapDialogOpen(false);
      setMapDialogChatroom(null);
    }
  };

  if (meQuery.isLoading) {
    return (
      <main className="flex h-full items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading chat...</p>
      </main>
    );
  }

  if (meQuery.isError) {
    return (
      <main className="flex h-full items-center justify-center">
        <p className="text-sm text-destructive">
          {meQuery.error instanceof Error
            ? meQuery.error.message
            : "Failed to load your account. Please try again."}
        </p>
      </main>
    );
  }

  if (!currentUserId) {
    return (
      <main className="flex h-full items-center justify-center">
        <p className="text-sm text-muted-foreground">
          Sign in to view your conversations.
        </p>
      </main>
    );
  }

  return (
    <>
      <CreateChatroomDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        currentUserId={currentUserId}
        onCreate={handleCreateChatroom}
      />

      <main className="flex min-h-0 flex-1 flex-col overflow-hidden h-[calc(100svh-3rem)]">
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden lg:flex-row">
          <div
            className={cn(
              "min-h-0 w-full shrink-0 flex-col border-b border-border/60 bg-background lg:w-[360px] lg:border-b-0 lg:border-r",
              showListOnMobile ? "flex" : "hidden",
              "lg:flex",
            )}
          >
            <ChatroomList
              chatrooms={chatrooms}
              activeChatroomId={activeChatroomId}
              currentUserId={currentUserId}
              onSelect={handleChatroomSelect}
              isLoading={chatroomListLoading}
              isError={chatroomListQuery.isError}
              onRetry={() => chatroomListQuery.refetch()}
              onStartNewChat={() => setIsCreateDialogOpen(true)}
              disableNewChat={isCreatingChatroom}
              showEmptyState={chatroomListReady}
            />
          </div>

          <div
            className={cn(
              "min-h-0 flex-1 flex-col bg-background",
              showListOnMobile ? "hidden" : "flex",
              "lg:flex",
            )}
          >
            <MessagePane
              chatroom={selectedChatroom}
              currentUserId={currentUserId}
              sending={isSending}
            onSendMessage={handleSendMessage}
            onLoadMore={
              selectedChatroom
                ? () => handleLoadMoreMessages(selectedChatroom.id)
                : undefined
            }
            loadingMore={
              selectedChatroom
                ? (paginationByRoom[selectedChatroom.id]?.initialized
                    ? paginationByRoom[selectedChatroom.id]?.loading ?? false
                    : false)
                : false
            }
            hasMore={
              selectedChatroom
                ? !(paginationByRoom[selectedChatroom.id]?.exhausted ?? false)
                : false
            }
            onBack={handleBackToList}
            onOpenMap={handleOpenMapDialog}
            onLeaveChatroom={handleLeaveChatroom}
            leaving={isLeavingChatroom}
            onOpenParticipants={handleOpenParticipantsDialog}
            />
          </div>
        </div>
      </main>
      <Dialog
        open={isParticipantsDialogOpen}
        onOpenChange={handleParticipantsDialogOpenChange}
      >
        <DialogContent className="w-full max-w-md">
          <DialogHeader className="space-y-2">
            <DialogTitle>Participants</DialogTitle>
            <DialogDescription>
              {participantsDialogChatroom
                ? "Review the people in this conversation."
                : "View the members of this conversation."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {participantsDialogChatroom?.participants.length ? (
              participantsDialogChatroom.participants.map((participant) => {
                const displayName = participant.displayName?.trim().length
                  ? participant.displayName
                  : participant.username ?? participant.id;
                const initials =
                  displayName
                    .split(/\s+/)
                    .filter(Boolean)
                    .map((part) => part[0] ?? "")
                    .join("")
                    .slice(0, 2)
                    .toUpperCase() || "?";
                const subtitle = participant.username ?? participant.id;

                return (
                  <div
                    key={participant.id}
                    className="flex items-center gap-3 rounded-lg border px-3 py-2"
                  >
                    <Avatar className="size-10">
                      {participant.avatarUrl ? (
                        <AvatarImage src={participant.avatarUrl} alt={displayName} />
                      ) : null}
                      <AvatarFallback className="text-sm font-semibold">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground">
                        {displayName}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {subtitle}
                      </p>
                    </div>
                    <Button type="button" size="sm" variant="outline">
                      Block
                    </Button>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-muted-foreground">
                No participants found for this conversation.
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={isMapDialogOpen} onOpenChange={handleMapDialogOpenChange}>
        <DialogContent className="flex h-[min(95svh,820px)] w-full max-w-[calc(100vw-3rem)] flex-col overflow-hidden p-0 sm:max-w-[min(1200px,95vw)]">
          <DialogHeader className="space-y-2 px-6 pb-4 pt-6">
            <DialogTitle>Choose a meetup spot</DialogTitle>
            <DialogDescription>
              {mapDialogChatroom
                ? 'Tap a zone, pick a marker, then press “Select This Spot” to share it in chat.'
                : 'Select a conversation before sharing a meetup spot.'}
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 px-6 pb-4 flex">
            <CampusMapWrapper
              className="h-full min-h-[520px]"
              onSelectSpot={mapDialogChatroom ? handleShareSpot : undefined}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ChatPageClient;
