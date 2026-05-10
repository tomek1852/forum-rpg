import { Body, Controller, Get, Inject, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { Roles } from "../common/decorators/roles.decorator";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { CreateEventParticipationDto } from "./dto/create-event-participation.dto";
import { CreateEventDto } from "./dto/create-event.dto";
import { ReviewEventParticipationDto } from "./dto/review-event-participation.dto";
import { UpdateEventDto } from "./dto/update-event.dto";
import { EventsService } from "./events.service";

@Controller("events")
@UseGuards(JwtAuthGuard)
export class EventsController {
  constructor(@Inject(EventsService) private readonly eventsService: EventsService) {}

  @Get()
  listEvents(@CurrentUser() user: { userId: string; role?: string }) {
    return this.eventsService.listEvents(user);
  }

  @Get(":eventId")
  getById(
    @Param("eventId") eventId: string,
    @CurrentUser() user: { userId: string; role?: string },
  ) {
    return this.eventsService.getById(eventId, user);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles("GM", "ADMIN")
  create(
    @CurrentUser() user: { userId: string; role?: string },
    @Body() dto: CreateEventDto,
  ) {
    return this.eventsService.create(user.userId, user.role, dto);
  }

  @Patch(":eventId")
  @UseGuards(RolesGuard)
  @Roles("GM", "ADMIN")
  update(
    @Param("eventId") eventId: string,
    @CurrentUser() user: { userId: string; role?: string },
    @Body() dto: UpdateEventDto,
  ) {
    return this.eventsService.update(eventId, user, dto);
  }

  @Post(":eventId/participations")
  createParticipation(
    @Param("eventId") eventId: string,
    @CurrentUser() user: { userId: string; role?: string },
    @Body() dto: CreateEventParticipationDto,
  ) {
    return this.eventsService.createParticipation(eventId, user.userId, dto);
  }

  @Patch("participations/:participationId/review")
  @UseGuards(RolesGuard)
  @Roles("GM", "ADMIN")
  reviewParticipation(
    @Param("participationId") participationId: string,
    @CurrentUser() user: { userId: string; role?: string },
    @Body() dto: ReviewEventParticipationDto,
  ) {
    return this.eventsService.reviewParticipation(participationId, user, dto);
  }
}
