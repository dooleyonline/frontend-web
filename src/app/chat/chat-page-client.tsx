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
import { CHATROOMS_QUERY_KEY, mergeMessages } from "@/lib/api/chat";
import { API_BASE_URL } from "@/lib/env";
import { ChatMessage, Chatroom, ChatParticipant, chatMessageSchema } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  clearPendingChatMessage,
  loadPendingChatMessage,
} from "@/lib/chat/pending-message";

const ACCESS_DENIED_MESSAGE = "You do not have access to this conversation.";
const CHATROOM_NOT_FOUND_MESSAGE = "Conversation not found.";
const CHATROOM_ID_PREFIX = "room-";
const MESSAGES_PAGE_SIZE = 10;

const removeTrailingSlash = (value: string) =>
  value.endsWith("/") ? value.slice(0, -1) : value;

const ensureWebSocketBaseUrl = () => {
  if (!API_BASE_URL || API_BASE_URL.length === 0) {
    throw new Error("NEXT_PUBLIC_API_BASE_URL must be defined for chat WebSocket connection.");
  }

  const normalized = removeTrailingSlash(API_BASE_URL);
  return normalized.replace(/^http/i, "ws");
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
  const [messagePagesByChatroom, setMessagePagesByChatroom] = useState<Record<string, number>>({});
  const [hasMoreMessagesByChatroom, setHasMoreMessagesByChatroom] = useState<Record<string, boolean>>(
    {},
  );
  const [loadingOlderMessages, setLoadingOlderMessages] = useState(false);
  const initialMessagesLoadedRef = useRef<Set<string>>(new Set());
  const queryClient = useQueryClient();
  const invalidAccessToastShownRef = useRef(false);
  const meQuery = useQuery(api.auth.me());
  const currentUserId = meQuery.data?.id ?? null;

  const previousChatroomsRef = useRef<Chatroom[] | undefined>(undefined);

  const chatroomsQueryOptions = useMemo(
    () => api.chat.getChatrooms(currentUserId ?? undefined),
    [currentUserId],
  );
  const chatroomListQuery = useQuery({
    ...chatroomsQueryOptions,
    enabled: Boolean(currentUserId),
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    staleTime: 1000 * 60 * 30,
    onSuccess: (data) => {
      const previous = previousChatroomsRef.current ?? queryClient.getQueryData<Chatroom[]>(
        CHATROOMS_QUERY_KEY,
      );
      queryClient.setQueryData<Chatroom[]>(CHATROOMS_QUERY_KEY, () => {
        if (!previous) return data;

        const byId = new Map<string, Chatroom>();
        previous.forEach((room) => byId.set(room.id, room));

        const merged = data.map((room) => {
          const existing = byId.get(room.id);
          if (!existing) return room;

          return {
            ...room,
            messages: mergeMessages(room.messages, existing.messages),
          };
        });

        const newIds = new Set(data.map((room) => room.id));
        previous.forEach((room) => {
          if (!newIds.has(room.id)) {
            merged.push(room);
          }
        });

        return merged.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
      });
    },
  });

  useEffect(() => {
    if (chatroomListQuery.isFetching) {
      previousChatroomsRef.current = queryClient.getQueryData<Chatroom[]>(CHATROOMS_QUERY_KEY);
    } else if (!chatroomListQuery.isLoading) {
      previousChatroomsRef.current = undefined;
    }
  }, [chatroomListQuery.isFetching, chatroomListQuery.isLoading, queryClient]);

  useEffect(() => {
    if (!chatroomListQuery.data) return;
    setMessagePagesByChatroom((previous) => {
      const next = { ...previous };
      for (const room of chatroomListQuery.data ?? []) {
        if (next[room.id] === undefined) {
          next[room.id] = 1;
        }
      }
      return next;
    });
    setHasMoreMessagesByChatroom((previous) => {
      const next = { ...previous };
      for (const room of chatroomListQuery.data ?? []) {
        if (next[room.id] === undefined) {
          next[room.id] = true;
        }
      }
      return next;
    });
  }, [chatroomListQuery.data]);
  const allChatrooms = useMemo(
    () => chatroomListQuery.data ?? [],
    [chatroomListQuery.data],
  );
  const chatrooms = useMemo(
    () => (currentUserId ? allChatrooms : []),
    [allChatrooms, currentUserId],
  );
  const chatroomListFetched = chatroomListQuery.isFetched && Boolean(currentUserId);
  const chatroomListFetching = chatroomListQuery.isFetching;
  const refetchChatrooms = chatroomListQuery.refetch;

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

  useEffect(() => {
    if (!activeChatroomId) return;
    queryClient.setQueryData<Chatroom[] | undefined>(CHATROOMS_QUERY_KEY, (previous) => {
      if (!previous) return previous;
      let updated = false;
      const next = previous.map((room) => {
        if (room.id !== activeChatroomId || room.unreadCount === 0) return room;
        updated = true;
        return { ...room, unreadCount: 0 };
      });
      return updated ? next : previous;
    });
  }, [activeChatroomId, chatroomListQuery.data, queryClient]);

  useEffect(() => {
    if (!activeChatroomId) return;
    setHasMoreMessagesByChatroom((previous) => ({
      ...previous,
      [activeChatroomId]: previous[activeChatroomId] ?? true,
    }));
    setMessagePagesByChatroom((previous) => ({
      ...previous,
      [activeChatroomId]: previous[activeChatroomId] ?? 1,
    }));
  }, [activeChatroomId]);

  const ensureParticipants = useCallback(
    async (chatroomId: string): Promise<ChatParticipant[]> => {
      const cachedRooms = queryClient.getQueryData<Chatroom[]>(CHATROOMS_QUERY_KEY);
      const cachedRoom = cachedRooms?.find((room) => room.id === chatroomId);
      if (cachedRoom && cachedRoom.participants.length > 0) {
        return cachedRoom.participants;
      }

      const participants = await api.chat.getParticipants(chatroomId);

      queryClient.setQueryData<Chatroom[]>(CHATROOMS_QUERY_KEY, (previous) => {
        if (!previous) return previous;
        return previous.map((room) =>
          room.id === chatroomId ? { ...room, participants } : room,
        );
      });

      return participants;
    },
    [queryClient],
  );

  useEffect(() => {
    if (!activeChatroomId) return;
    void ensureParticipants(activeChatroomId);
  }, [activeChatroomId, ensureParticipants]);

  const webSocketUrl = useMemo(() => {
    if (!activeChatroomSlug) return null;
    return `${WS_BASE_URL}/chat/${activeChatroomSlug}/ws`;
  }, [activeChatroomSlug]);

  const { sendMessage, lastMessage, readyState } = useWebSocket(webSocketUrl, {
    shouldReconnect: () => true,
    reconnectInterval: 2000,
  });
  const socketReadyRef = useRef(readyState);
  useEffect(() => {
    socketReadyRef.current = readyState;
  }, [readyState]);

  useEffect(() => {
    invalidAccessToastShownRef.current = false;
  }, [initialChatroomSlug]);
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

    const matchingChatroom = allChatrooms.find((chatroom) => {
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
    allChatrooms,
    chatroomListFetched,
    chatroomListFetching,
    currentUserId,
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
      const updatedMessages = mergeMessages([parsed], target.messages);
      const changed =
        updatedMessages.length !== target.messages.length ||
        updatedMessages.some((message, idx) => message.id !== target.messages[idx]?.id);
      if (!changed) {
        return previous;
      }

      handled = true;
      const isOwnMessage = parsed.senderId === currentUserId;
      const isActiveRoom = target.id === activeChatroomId;

      const updatedChatroom: Chatroom = {
        ...target,
        messages: updatedMessages,
        updatedAt: updatedMessages.at(-1)?.sentAt ?? parsed.sentAt ?? target.updatedAt,
        unreadCount:
          isOwnMessage || isActiveRoom ? 0 : target.unreadCount + 1,
      };

      const next = [...previous];
      next[index] = updatedChatroom;

      return next.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
    });

    if (!handled && chatroomListFetched) {
      void refetchChatrooms();
    }
  }, [
    lastMessage,
    queryClient,
    currentUserId,
    activeChatroomId,
    chatroomListFetched,
    refetchChatrooms,
  ]);

  const handleCreateChatroom = useCallback(
    async (participantIds: string[]) => {
      try {
        const uniqueParticipantIds = Array.from(
          new Set([currentUserId, ...participantIds]),
        ).filter(Boolean) as string[];
        const newChatroomId = await createChatroomAsync({
          participantIds: uniqueParticipantIds,
        });
        await refetchChatrooms();
        setActiveChatroomId(newChatroomId);
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
      refetchChatrooms,
      router,
      pathname,
    ],
  );

  const selectedChatroom = useMemo<Chatroom | null>(() => {
    if (!activeChatroomId) return null;
    return chatrooms.find((chatroom) => chatroom.id === activeChatroomId) ?? null;
  }, [chatrooms, activeChatroomId]);

  useEffect(() => {
    if (!selectedChatroom) return;
    if (loadingOlderMessages) return;
    if (initialMessagesLoadedRef.current.has(selectedChatroom.id)) return;

    if (selectedChatroom.messages.length > 0) {
      setHasMoreMessagesByChatroom((previous) => ({
        ...previous,
        [selectedChatroom.id]: selectedChatroom.messages.length >= MESSAGES_PAGE_SIZE,
      }));
      setMessagePagesByChatroom((previous) => ({
        ...previous,
        [selectedChatroom.id]: 1,
      }));
      initialMessagesLoadedRef.current.add(selectedChatroom.id);
      return;
    }

    setLoadingOlderMessages(true);
    void (async () => {
      try {
        const messages = await api.chat.getMessagesPage(selectedChatroom.id, 1);
        setHasMoreMessagesByChatroom((previous) => ({
          ...previous,
          [selectedChatroom.id]: messages.length >= MESSAGES_PAGE_SIZE,
        }));
        setMessagePagesByChatroom((previous) => ({
          ...previous,
          [selectedChatroom.id]: 1,
        }));
        initialMessagesLoadedRef.current.add(selectedChatroom.id);

        queryClient.setQueryData<Chatroom[]>(CHATROOMS_QUERY_KEY, (previous) => {
          if (!previous) return previous;
          return previous.map((room) =>
            room.id === selectedChatroom.id
              ? { ...room, messages: mergeMessages(messages, room.messages) }
              : room,
          );
        });
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to load messages.",
        );
      } finally {
        setLoadingOlderMessages(false);
      }
    })();
  }, [
    selectedChatroom,
    loadingOlderMessages,
    queryClient,
    setHasMoreMessagesByChatroom,
    setMessagePagesByChatroom,
  ]);

  const currentHasMoreMessages = useMemo(
    () =>
      activeChatroomId
        ? hasMoreMessagesByChatroom[activeChatroomId] ?? true
        : false,
    [activeChatroomId, hasMoreMessagesByChatroom],
  );

  const handleChatroomSelect = (chatroomId: string) => {
    const chatroom = chatrooms.find((item) => item.id === chatroomId);
    if (!chatroom) {
      toast.error(ACCESS_DENIED_MESSAGE);
      if (pathname !== "/chat") {
        router.replace("/chat");
      }
      return;
    }

    setActiveChatroomId(chatroomId);
    setShowListOnMobile(false);
    setIsMapDialogOpen(false);
    setMapDialogChatroom(null);
    const targetPath = `/chat/${getChatroomSlug(chatroomId)}`;
    if (pathname !== targetPath) {
      router.push(targetPath);
    }
  };

  const handleSendMessage = useCallback(
    async (body: string) => {
      if (!activeChatroomId || !currentUserId) return false;
      if (!chatrooms.some((chatroom) => chatroom.id === activeChatroomId)) {
        toast.error(ACCESS_DENIED_MESSAGE);
        return false;
      }

      const payload = body.trim();
      if (!payload) return false;

      const waitForOpen = async () => {
        if (socketReadyRef.current === ReadyState.OPEN) return true;
        const maxWaitMs = 2000;
        const intervalMs = 50;
        let elapsed = 0;
        return new Promise<boolean>((resolve, reject) => {
          const timer = setInterval(() => {
            elapsed += intervalMs;
            if (socketReadyRef.current === ReadyState.OPEN) {
              clearInterval(timer);
              resolve(true);
            } else if (socketReadyRef.current === ReadyState.CLOSED || elapsed >= maxWaitMs) {
              clearInterval(timer);
              reject(new Error("Reconnecting to chat... please try again in a moment."));
            }
          }, intervalMs);
        });
      };

      setIsSending(true);
      let success = false;
      try {
        await waitForOpen();
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
      sendMessage,
    ],
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

  const handleLoadOlderMessages = useCallback(async () => {
    if (!activeChatroomId) return;
    if (loadingOlderMessages) return;
    if (hasMoreMessagesByChatroom[activeChatroomId] === false) return;

    const currentPage = messagePagesByChatroom[activeChatroomId] ?? 1;
    const nextPage = currentPage + 1;
    setLoadingOlderMessages(true);
    try {
      const olderMessages = await api.chat.getMessagesPage(activeChatroomId, nextPage);
      if (olderMessages.length === 0) {
        setHasMoreMessagesByChatroom((previous) => ({
          ...previous,
          [activeChatroomId]: false,
        }));
        return;
      }

      let messagesAdded = false;
      setHasMoreMessagesByChatroom((previous) => ({
        ...previous,
        [activeChatroomId]: olderMessages.length >= MESSAGES_PAGE_SIZE,
      }));

      queryClient.setQueryData<Chatroom[]>(CHATROOMS_QUERY_KEY, (previous) => {
        if (!previous) return previous;
        return previous.map((chatroom) => {
          if (chatroom.id !== activeChatroomId) return chatroom;
          const merged = mergeMessages(olderMessages, chatroom.messages);
          messagesAdded = merged.length !== chatroom.messages.length;
          return {
            ...chatroom,
            messages: merged,
          };
        });
      });

      if (!messagesAdded) {
        setHasMoreMessagesByChatroom((previous) => ({
          ...previous,
          [activeChatroomId]: false,
        }));
        return;
      }

      setMessagePagesByChatroom((previous) => ({
        ...previous,
        [activeChatroomId]: nextPage,
      }));
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to load older messages.",
      );
    } finally {
      setLoadingOlderMessages(false);
    }
  }, [
    activeChatroomId,
    loadingOlderMessages,
    hasMoreMessagesByChatroom,
    messagePagesByChatroom,
    queryClient,
  ]);

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

        void refetchChatrooms();

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
      refetchChatrooms,
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
    const hasParticipants = chatroom.participants.length > 0;
    const isParticipant = !hasParticipants
      ? true
      : chatroom.participants.some((participant) => participant.id === currentUserId);

    if (!currentUserId || !isParticipant) {
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

  const handleOpenParticipantsDialog = async (chatroom: Chatroom) => {
    const hasParticipants = chatroom.participants.length > 0;
    const isParticipant = !hasParticipants
      ? true
      : chatroom.participants.some((participant) => participant.id === currentUserId);

    if (!currentUserId || !isParticipant) {
      toast.error(ACCESS_DENIED_MESSAGE);
      return;
    }

    try {
      const participants = await ensureParticipants(chatroom.id);
      setParticipantsDialogChatroom({ ...chatroom, participants });
      setIsParticipantsDialogOpen(true);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to load participants for this chat.",
      );
    }
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
    const hasParticipants = mapDialogChatroom.participants.length > 0;
    const isParticipant = hasParticipants
      ? mapDialogChatroom.participants.some((participant) => participant.id === currentUserId)
      : true;
    if (!isParticipant) {
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

      <main className="flex min-h-0 flex-1 flex-col overflow-hidden h-[calc(100svh-3rem)] max-h-[calc(100svh-3rem)]">
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
              isLoading={chatroomListQuery.isLoading}
              isError={chatroomListQuery.isError}
              onRetry={() => chatroomListQuery.refetch()}
              onStartNewChat={() => setIsCreateDialogOpen(true)}
              disableNewChat={isCreatingChatroom}
            />
          </div>

          <div
            className={cn(
              "min-h-0 flex flex-1 flex-col bg-background",
              showListOnMobile ? "hidden" : "flex",
              "lg:flex",
            )}
          >
            <MessagePane
              chatroom={selectedChatroom}
              currentUserId={currentUserId}
              sending={isSending}
              onSendMessage={handleSendMessage}
              onLoadOlderMessages={handleLoadOlderMessages}
              hasMoreMessages={currentHasMoreMessages}
              loadingOlderMessages={loadingOlderMessages}
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
                const isSelf = participant.id === currentUserId;
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
                    {!isSelf ? (
                      <Button type="button" size="sm" variant="outline">
                        Block
                      </Button>
                    ) : null}
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
          <div className="flex-1 px-6 pb-6">
            <CampusMapWrapper
              className="h-[53vh]"
              onSelectSpot={mapDialogChatroom ? handleShareSpot : undefined}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ChatPageClient;
