import {
  applyConversationReadEvent,
  applyMessageCreatedEvent,
} from "./messages-realtime";
import type { PrivateConversationMessagesResponse } from "./types";

describe("messages realtime helpers", () => {
  const current: PrivateConversationMessagesResponse = {
    conversation: {
      id: "conversation-1",
      createdAt: "2026-05-10T10:00:00.000Z",
      updatedAt: "2026-05-10T10:00:00.000Z",
      lastMessageAt: "2026-05-10T10:00:00.000Z",
      unreadCount: 0,
      otherParticipant: {
        id: "user-2",
        username: "gracz2",
        displayName: "Gracz 2",
        avatarUrl: null,
        role: "PLAYER",
      },
      lastMessage: null,
    },
    messages: [],
  };

  it("appends an incoming message without refreshing the page", () => {
    const result = applyMessageCreatedEvent(
      current,
      {
        conversationId: "conversation-1",
        message: {
          id: "message-1",
          content: "Czesc!",
          createdAt: "2026-05-10T10:05:00.000Z",
          readAt: null,
          senderId: "user-2",
          sender: {
            id: "user-2",
            username: "gracz2",
            displayName: "Gracz 2",
            avatarUrl: null,
            role: "PLAYER",
          },
        },
      },
      "user-1",
    );

    expect(result?.messages).toHaveLength(1);
    expect(result?.conversation.lastMessage?.id).toBe("message-1");
    expect(result?.conversation.unreadCount).toBe(1);
  });

  it("marks my outbound messages as read when the other user reads the conversation", () => {
    const withMessage = applyMessageCreatedEvent(
      current,
      {
        conversationId: "conversation-1",
        message: {
          id: "message-2",
          content: "Ping",
          createdAt: "2026-05-10T10:10:00.000Z",
          readAt: null,
          senderId: "user-1",
          sender: {
            id: "user-1",
            username: "gracz1",
            displayName: null,
            avatarUrl: null,
            role: "PLAYER",
          },
        },
      },
      "user-1",
    );

    const result = applyConversationReadEvent(
      withMessage,
      {
        conversationId: "conversation-1",
        readByUserId: "user-2",
      },
      "user-1",
      "2026-05-10T10:15:00.000Z",
    );

    expect(result?.messages[0]?.readAt).toBe("2026-05-10T10:15:00.000Z");
  });
});
