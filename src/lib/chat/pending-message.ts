const STORAGE_KEY = "dooley-chat:pending-message";

export type PendingChatMessage = {
  chatroomId: string;
  body: string;
  createdAt: number;
};

const parsePendingMessage = (value: string | null): PendingChatMessage | null => {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value) as Partial<PendingChatMessage>;
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      typeof parsed.chatroomId === "string" &&
      typeof parsed.body === "string" &&
      typeof parsed.createdAt === "number"
    ) {
      return {
        chatroomId: parsed.chatroomId,
        body: parsed.body,
        createdAt: parsed.createdAt,
      };
    }
  } catch {
    // ignore malformed payload
  }
  return null;
};

export const loadPendingChatMessage = (): PendingChatMessage | null => {
  if (typeof window === "undefined") return null;
  try {
    return parsePendingMessage(window.localStorage.getItem(STORAGE_KEY));
  } catch {
    return null;
  }
};

export const savePendingChatMessage = (message: PendingChatMessage) => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(message));
  } catch {
    // storage might be full or unavailable; fail silently
  }
};

export const clearPendingChatMessage = () => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
};
