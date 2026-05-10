import type {
  PrivateConversationMessagesResponse,
  PrivateMessage,
} from "./types";

export type MessageCreatedEvent = {
  conversationId: string;
  message: PrivateMessage;
};

export type ConversationReadEvent = {
  conversationId: string;
  readByUserId: string;
};

export function applyMessageCreatedEvent(
  current: PrivateConversationMessagesResponse | undefined,
  event: MessageCreatedEvent,
  currentUserId: string | null,
) {
  if (!current) {
    return current;
  }

  if (current.messages.some((message) => message.id === event.message.id)) {
    return current;
  }

  return {
    ...current,
    conversation: {
      ...current.conversation,
      lastMessage: event.message,
      lastMessageAt: event.message.createdAt,
      unreadCount:
        event.message.senderId === currentUserId
          ? current.conversation.unreadCount
          : current.conversation.unreadCount + 1,
    },
    messages: [...current.messages, event.message],
  };
}

export function applyConversationReadEvent(
  current: PrivateConversationMessagesResponse | undefined,
  event: ConversationReadEvent,
  currentUserId: string | null,
  readAt = new Date().toISOString(),
) {
  if (!current) {
    return current;
  }

  return {
    ...current,
    conversation: {
      ...current.conversation,
      unreadCount:
        event.readByUserId === currentUserId ? 0 : current.conversation.unreadCount,
    },
    messages: current.messages.map((message) =>
      message.senderId === currentUserId && !message.readAt
        ? {
            ...message,
            readAt,
          }
        : message,
    ),
  };
}
