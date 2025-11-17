"use client";

import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";

import api from "@/lib/api";
import { CHATROOMS_QUERY_KEY } from "@/lib/api/chat";
import { useUser } from "@/hooks/use-user";
import { ChatMessage, Chatroom } from "@/lib/types";

const RETRY_DELAY_MS = 3000;

export const ChatroomsStreamListener = () => {
  const { user } = useUser();
  const queryClient = useQueryClient();

  const unsubscribeRef = useRef<(() => void) | null>(null);
  const retryTimerRef = useRef<number | null>(null);
  const isProcessingRef = useRef(false);

  useEffect(() => {
    if (!user) {
      isProcessingRef.current = false;
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
      queryClient.removeQueries({ queryKey: CHATROOMS_QUERY_KEY });
      return;
    }

    let cancelled = false;

    const startStream = () => {
      if (cancelled) return;

      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }

      unsubscribeRef.current = api.chat.subscribeToChatRoomsStream(
        async (rooms, rawPayload) => {
          if (cancelled) return;
          if (!rawPayload) return;
          if (isProcessingRef.current) return;

          isProcessingRef.current = true;
          try {
            const chatrooms = await api.chat.buildChatroomsFromRooms(
              rooms,
              queryClient.getQueryData<Chatroom[]>(CHATROOMS_QUERY_KEY),
              { currentUserId: user.id },
            );
            queryClient.setQueryData<Chatroom[]>(CHATROOMS_QUERY_KEY, (previous) => {
              if (!previous) return chatrooms;

              const byId = new Map<string, Chatroom>();
              previous.forEach((room) => byId.set(room.id, room));

              const merged = chatrooms.map((room) => {
                const existing = byId.get(room.id);
                if (!existing) return room;

                const combinedMessages: ChatMessage[] = [];
                const seen = new Set<string>();
                [...room.messages, ...existing.messages].forEach((msg) => {
                  if (seen.has(msg.id)) return;
                  seen.add(msg.id);
                  combinedMessages.push(msg);
                });
                combinedMessages.sort((a, b) => a.sentAt.getTime() - b.sentAt.getTime());

                return {
                  ...room,
                  messages: combinedMessages,
                };
              });

              const existingIds = new Set(chatrooms.map((r) => r.id));
              previous.forEach((room) => {
                if (!existingIds.has(room.id)) {
                  merged.push(room);
                }
              });

              return merged.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
            });
          } catch (error) {
            console.error("Failed to sync chatrooms from SSE", error);
          } finally {
            isProcessingRef.current = false;
          }
        },
        () => {
          if (cancelled) return;
          if (retryTimerRef.current) {
            window.clearTimeout(retryTimerRef.current);
          }
          retryTimerRef.current = window.setTimeout(startStream, RETRY_DELAY_MS);
        },
      );
    };

    startStream();

    return () => {
      cancelled = true;
      if (retryTimerRef.current) {
        window.clearTimeout(retryTimerRef.current);
      }
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [user, queryClient]);

  return null;
};
