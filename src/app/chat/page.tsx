
"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";

import { MessagePane, ThreadList } from "@/components/chat";
import api from "@/lib/api";
import { MOCK_CURRENT_USER_ID } from "@/lib/api/chat";
import { ChatThread } from "@/lib/types";
import { cn } from "@/lib/utils";

const THREADS_QUERY_KEY = ["chat", "threads"] as const;

const ChatPage = () => {
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [showListOnMobile, setShowListOnMobile] = useState(true);
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const router = useRouter();

  const threadListQuery = useQuery(api.chat.getThreads());
  const threads = useMemo(
    () => threadListQuery.data ?? [],
    [threadListQuery.data],
  );

  useEffect(() => {
    if (threads.length === 0) {
      setActiveThreadId(null);
      return;
    }
    if (!activeThreadId) {
      setActiveThreadId(threads[0]?.id ?? null);
    }
    if (activeThreadId && !threads.some((thread) => thread.id === activeThreadId)) {
      setActiveThreadId(threads[0].id);
    }
  }, [threads, activeThreadId]);

  const selectedThread = useMemo<ChatThread | null>(() => {
    if (!activeThreadId) return null;
    return threads.find((thread) => thread.id === activeThreadId) ?? null;
  }, [threads, activeThreadId]);

  const {
    mutateAsync: sendMessageAsync,
    isPending: isSending,
  } = useMutation({
    mutationFn: api.chat.sendMessage,
    onSuccess: (message) => {
      queryClient.setQueryData<ChatThread[]>(THREADS_QUERY_KEY, (previous) => {
        if (!previous) return previous;
        const nextThreads = previous.map((thread) => {
          if (thread.id !== message.threadId) return thread;
          return {
            ...thread,
            messages: [...thread.messages, message],
            updatedAt: message.sentAt,
            unreadCount: 0,
          };
        });

        return [...nextThreads].sort(
          (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime(),
        );
      });
    },
    onError: (error: Error) => {
      toast.error(error.message ?? "Something went wrong while sending message.");
    },
  });

  const handleThreadSelect = (threadId: string) => {
    setActiveThreadId(threadId);
    setShowListOnMobile(false);
  };

  const handleSendMessage = async (body: string) => {
    if (!activeThreadId) return;
    await sendMessageAsync({
      threadId: activeThreadId,
      senderId: MOCK_CURRENT_USER_ID,
      body,
    });
  };

  const handleBackToList = () => {
    setShowListOnMobile(true);
  };

  const mapSelectionParam = searchParams.get("mapSelection");

  useEffect(() => {
    if (!mapSelectionParam) return;

    let payload: {
      threadId: string;
      spot: {
        name: string;
        desc?: string;
        zone?: string;
        coordinates: [number, number];
        category: string;
      };
    } | null = null;

    try {
      payload = JSON.parse(mapSelectionParam);
    } catch {
      router.replace("/chat");
      return;
    }

    if (!payload || !payload.threadId || !payload.spot || !Array.isArray(payload.spot.coordinates)) {
      router.replace("/chat");
      return;
    }

    const { threadId, spot } = payload;
    const [lng, lat] = spot.coordinates;
    if (typeof lng !== "number" || typeof lat !== "number") {
      router.replace("/chat");
      return;
    }

    setActiveThreadId(threadId);
    setShowListOnMobile(false);

    const titlePrefix = spot.category === "accessible" ? "🚗" : "📍";
    const googleLink = `https://www.google.com/maps?q=${lat},${lng}`;
    const messageLines = [
      `${titlePrefix} ${spot.name}`,
      spot.desc?.trim() ? spot.desc : null,
      spot.zone ? `Zone: ${spot.zone}` : null,
      `Map: ${googleLink}`,
    ].filter(Boolean);
    const messageBody = messageLines.join("\n");

    const send = async () => {
      try {
        await sendMessageAsync({
          threadId,
          senderId: MOCK_CURRENT_USER_ID,
          body: messageBody,
        });
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to share meetup spot.");
      } finally {
        router.replace("/chat");
      }
    };

    void send();
  }, [mapSelectionParam, router, sendMessageAsync]);

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
          <ThreadList
            threads={threads}
            activeThreadId={activeThreadId}
            currentUserId={MOCK_CURRENT_USER_ID}
            onSelect={handleThreadSelect}
            isLoading={threadListQuery.isLoading}
            isError={threadListQuery.isError}
            onRetry={() => threadListQuery.refetch()}
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
            thread={selectedThread}
            currentUserId={MOCK_CURRENT_USER_ID}
            sending={isSending}
            onSendMessage={handleSendMessage}
            onBack={handleBackToList}
          />
        </div>
      </div>
    </main>
  );
};

export default ChatPage;
