
"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

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

const ChatPage = () => {
  const [activeChatroomId, setActiveChatroomId] = useState<string | null>(null);
  const [showListOnMobile, setShowListOnMobile] = useState(true);
  const [isMapDialogOpen, setIsMapDialogOpen] = useState(false);
  const [mapDialogChatroom, setMapDialogChatroom] = useState<Chatroom | null>(null);
  const queryClient = useQueryClient();

  const chatroomListQuery = useQuery(api.chat.getChatrooms());
  const chatrooms = useMemo(
    () => chatroomListQuery.data ?? [],
    [chatroomListQuery.data],
  );

  useEffect(() => {
    if (chatrooms.length === 0) {
      setActiveChatroomId(null);
      return;
    }
    if (!activeChatroomId) {
      setActiveChatroomId(chatrooms[0]?.id ?? null);
    }
    if (
      activeChatroomId &&
      !chatrooms.some((chatroom) => chatroom.id === activeChatroomId)
    ) {
      setActiveChatroomId(chatrooms[0].id);
    }
  }, [chatrooms, activeChatroomId]);

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
    setActiveChatroomId(chatroomId);
    setShowListOnMobile(false);
  };

  const handleSendMessage = async (body: string) => {
    if (!activeChatroomId) return;
    await sendMessageAsync({
      chatroomId: activeChatroomId,
      senderId: MOCK_CURRENT_USER_ID,
      body,
    });
  };

  const handleBackToList = () => {
    setShowListOnMobile(true);
  };

  const handleOpenMapDialog = (chatroom: Chatroom) => {
    setActiveChatroomId(chatroom.id);
    setShowListOnMobile(false);
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
        senderId: MOCK_CURRENT_USER_ID,
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
            currentUserId={MOCK_CURRENT_USER_ID}
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
            currentUserId={MOCK_CURRENT_USER_ID}
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

export default ChatPage;
