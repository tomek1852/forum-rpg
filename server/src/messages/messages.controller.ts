import { Body, Controller, Get, Inject, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import type { AuthenticatedUser } from "../common/decorators/current-user.decorator";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { CreateConversationDto } from "./dto/create-conversation.dto";
import { SendPrivateMessageDto } from "./dto/send-private-message.dto";
import { MessagesService } from "./messages.service";

@Controller("messages")
@UseGuards(JwtAuthGuard)
export class MessagesController {
  constructor(
    @Inject(MessagesService) private readonly messagesService: MessagesService,
  ) {}

  @Post("conversations")
  createConversation(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateConversationDto,
  ) {
    return this.messagesService.createConversation(user.userId, dto);
  }

  @Get("conversations")
  listMine(@CurrentUser() user: AuthenticatedUser) {
    return this.messagesService.listMine(user.userId);
  }

  @Get("conversations/:conversationId/messages")
  getConversationMessages(
    @CurrentUser() user: AuthenticatedUser,
    @Param("conversationId") conversationId: string,
  ) {
    return this.messagesService.getConversationMessages(user.userId, conversationId);
  }

  @Post("conversations/:conversationId/messages")
  sendMessage(
    @CurrentUser() user: AuthenticatedUser,
    @Param("conversationId") conversationId: string,
    @Body() dto: SendPrivateMessageDto,
  ) {
    return this.messagesService.sendMessage(user.userId, conversationId, dto);
  }

  @Patch("conversations/:conversationId/read")
  markAsRead(
    @CurrentUser() user: AuthenticatedUser,
    @Param("conversationId") conversationId: string,
  ) {
    return this.messagesService.markConversationAsRead(user.userId, conversationId);
  }
}
