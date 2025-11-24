import { Chatroom } from "@/lib/types";

const MAX_GROUP_TITLE_LENGTH = 48;

const truncate = (value: string, maxLength: number) => {
  if (value.length <= maxLength) return value;
  const sliceLength = Math.max(maxLength - 3, 0);
  return `${value.slice(0, sliceLength).trimEnd().replace(/[, ]+$/, "")}...`;
};

const buildParticipantNames = (
  chatroom: Chatroom,
  currentUserId: string,
): string[] =>
  chatroom.participants
    .filter((participant) => participant.id !== currentUserId)
    .map((participant) => participant.displayName || participant.username || "Unknown");

export const buildChatroomTitle = (
  chatroom: Chatroom,
  currentUserId: string,
): string => {
  if (chatroom.title && chatroom.title.trim().length > 0) {
    return chatroom.title.trim();
  }
  const otherNames = buildParticipantNames(chatroom, currentUserId);

  if (!chatroom.isGroup) {
    return otherNames[0] ?? "Conversation";
  }

  if (otherNames.length === 0) {
    return "Group chat";
  }

  const joinedNames = otherNames.join(", ");
  return truncate(joinedNames, MAX_GROUP_TITLE_LENGTH);
};
