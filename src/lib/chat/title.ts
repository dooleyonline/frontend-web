import { ChatThread } from "@/lib/types";

const MAX_GROUP_TITLE_LENGTH = 48;

const truncate = (value: string, maxLength: number) => {
  if (value.length <= maxLength) return value;
  const sliceLength = Math.max(maxLength - 3, 0);
  return `${value.slice(0, sliceLength).trimEnd().replace(/[, ]+$/, "")}...`;
};

const buildParticipantNames = (
  thread: ChatThread,
  currentUserId: string,
): string[] =>
  thread.participants
    .filter((participant) => participant.id !== currentUserId)
    .map((participant) => participant.displayName || participant.username || "Unknown");

export const buildThreadTitle = (
  thread: ChatThread,
  currentUserId: string,
): string => {
  const otherNames = buildParticipantNames(thread, currentUserId);

  if (!thread.isGroup) {
    return otherNames[0] ?? "Conversation";
  }

  if (otherNames.length === 0) {
    return "Group chat";
  }

  const joinedNames = otherNames.join(", ");
  return truncate(joinedNames, MAX_GROUP_TITLE_LENGTH);
};