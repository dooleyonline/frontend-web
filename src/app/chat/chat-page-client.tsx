"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { usePathname, useRouter } from "next/navigation";

import { MessagePane, ChatroomList } from "@/components/chat";
import { CampusMapWrapper } from "@/components/map/map-wrapper";
import type { SelectedSpot } from "@/components/map/map";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import api from "@/lib/api";
import { MOCK_CURRENT_USER_ID } from "@/lib/api/chat";
import { Chatroom } from "@/lib/types";
import { cn } from "@/lib/utils";

const CHATROOMS_QUERY_KEY = ["chat", "chatrooms"] as const;
const ACCESS_DENIED_MESSAGE = "You do not have access to this conversation.";
const CHATROOM_NOT_FOUND_MESSAGE = "Conversation not found.";
const CHATROOM_ID_PREFIX = "room-";

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
  const currentUserId = MOCK_CURRENT_USER_ID;
  const router = useRouter();
  const pathname = usePathname();
  const [activeChatroomId, setActiveChatroomId] = useState<string | null>(null);
  const [showListOnMobile, setShowListOnMobile] = useState(
    () => !initialChatroomSlug,
  );
  const [isMapDialogOpen, setIsMapDialogOpen] = useState(false);
  const [mapDialogChatroom, setMapDialogChatroom] = useState<Chatroom | null>(null);
  const queryClient = useQueryClient();
  const invalidAccessToastShownRef = useRef(false);

  const chatroomListQuery = useQuery(api.chat.getChatrooms());
  const allChatrooms = useMemo(
    () => chatroomListQuery.data ?? [],
    [chatroomListQuery.data],
  );
  const chatrooms = useMemo(
    () =>
      allChatrooms.filter((chatroom) =>
        chatroom.participants.some((participant) => participant.id === currentUserId),
      ),
    [allChatrooms, currentUserId],
  );

  useEffect(() => {
    invalidAccessToastShownRef.current = false;
  }, [initialChatroomSlug]);
  useEffect(() => {
    if (!chatroomListQuery.isFetched) {
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

    const isParticipant = matchingChatroom.participants.some(
      (participant) => participant.id === currentUserId,
    );

    if (!isParticipant) {
      if (!invalidAccessToastShownRef.current) {
        toast.error(ACCESS_DENIED_MESSAGE);
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
    chatroomListQuery.isFetched,
    currentUserId,
    initialChatroomSlug,
    pathname,
    router,
    showListOnMobile,
  ]);

  const selectedChatroom = useMemo<Chatroom | null>(() => {
    if (!activeChatroomId) return null;
    return chatrooms.find((chatroom) => chatroom.id === activeChatroomId) ?? null;
  }, [chatrooms, activeChatroomId]);

  const {
    mutateAsync: sendMessageAsync,
    isPending: isSending,
  } = useMutation({
    mutationFn: api.chat.sendMessage,
    onSuccess: (message) => {
      queryClient.setQueryData<Chatroom[]>(CHATROOMS_QUERY_KEY, (previous) => {
        if (!previous) return previous;
        const nextChatrooms = previous.map((chatroom) => {
          if (chatroom.id !== message.chatroomId) return chatroom;
          return {
            ...chatroom,
            messages: [...chatroom.messages, message],
            updatedAt: message.sentAt,
            unreadCount: 0,
          };
        });

        return [...nextChatrooms].sort(
          (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime(),
        );
      });
    },
    onError: (error: Error) => {
      toast.error(error.message ?? "Something went wrong while sending message.");
    },
  });

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

  const handleSendMessage = async (body: string) => {
    if (!activeChatroomId) return;
    if (!chatrooms.some((chatroom) => chatroom.id === activeChatroomId)) {
      toast.error(ACCESS_DENIED_MESSAGE);
      return;
    }

    await sendMessageAsync({
      chatroomId: activeChatroomId,
      senderId: currentUserId,
      body,
    });
  };

  const handleBackToList = () => {
    setShowListOnMobile(true);
    setIsMapDialogOpen(false);
    setMapDialogChatroom(null);
    if (pathname !== "/chat") {
      router.push("/chat");
    }
  };

  const handleOpenMapDialog = (chatroom: Chatroom) => {
    if (!chatroom.participants.some((participant) => participant.id === currentUserId)) {
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

  const handleShareSpot = async (spot: SelectedSpot) => {
    if (!mapDialogChatroom) return;
    if (
      !mapDialogChatroom.participants.some(
        (participant) => participant.id === currentUserId,
      )
    ) {
      toast.error(ACCESS_DENIED_MESSAGE);
      return;
    }

    const { id: chatroomId } = mapDialogChatroom;
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

    try {
      await sendMessageAsync({
        chatroomId,
        senderId: currentUserId,
        body: messageBody,
      });
      setIsMapDialogOpen(false);
      setMapDialogChatroom(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to share meetup spot.");
    }
  };

  return (
    <main className="flex h-full flex-1 flex-col">
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
            onBack={handleBackToList}
            onOpenMap={handleOpenMapDialog}
          />
        </div>
      </div>
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
    </main>
  );
};

export default ChatPageClient;
