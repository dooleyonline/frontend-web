import { Chatroom } from "@/lib/types";

const isLikelyID = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return true;
  const uuidRegex =
    /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
  if (uuidRegex.test(trimmed)) return true;
  if (trimmed.length > 18 && !trimmed.includes(" ")) return true;
  return false;
};

const buildParticipantNames = (
  chatroom: Chatroom,
  currentUserId: string,
): string[] =>
  chatroom.participants
    .filter((participant) => participant.id !== currentUserId)
    .map((participant) => participant.displayName || participant.username || "Unknown")
    .map((name, index) => {
      const participant = chatroom.participants.filter((p) => p.id !== currentUserId)[index];
      if (participant && isLikelyID(name)) {
        const candidate = participant.username || "";
        if (candidate && !isLikelyID(candidate)) return candidate;
        return "";
      }
      return name;
    })
    .filter((name) => name.trim().length > 0);

export const buildChatroomTitle = (
  chatroom: Chatroom,
  currentUserId: string,
): string => {
  // 1:1 chat: always use the other participant's name
  const otherNames = buildParticipantNames(chatroom, currentUserId);
  if (otherNames[0]) return otherNames[0];
  return "Conversation";
};
