import { Chatroom } from "@/lib/types";

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
  // 1:1 chat: always use the other participant's name
  const otherNames = buildParticipantNames(chatroom, currentUserId);
  if (otherNames[0]) return otherNames[0];
  return "Conversation";
};
