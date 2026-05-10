import { Inject, Injectable } from "@nestjs/common";
import { MessagesGateway } from "./messages.gateway";

type RealtimeMessagePayload = {
  conversationId: string;
  message: {
    id: string;
    content: string;
    createdAt: Date;
    readAt: Date | null;
    senderId: string;
    sender: {
      id: string;
      username: string;
      displayName: string | null;
      avatarUrl: string | null;
      role: string;
    };
  };
};

@Injectable()
export class MessagesRealtimeService {
  constructor(
    @Inject(MessagesGateway) private readonly messagesGateway: MessagesGateway,
  ) {}

  emitConversationUpserted(conversationId: string, participantIds: string[]) {
    this.messagesGateway.emitConversationUpserted(conversationId, participantIds);
  }

  emitMessageCreated(payload: RealtimeMessagePayload, participantIds: string[]) {
    this.messagesGateway.emitMessageCreated(payload, participantIds);
  }

  emitConversationRead(
    conversationId: string,
    participantIds: string[],
    readByUserId: string,
  ) {
    this.messagesGateway.emitConversationRead(
      conversationId,
      participantIds,
      readByUserId,
    );
  }
}
