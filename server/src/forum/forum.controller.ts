import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";
import type { AuthenticatedUser } from "../common/decorators/current-user.decorator";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { Roles } from "../common/decorators/roles.decorator";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { CreateCategoryDto } from "./dto/create-category.dto";
import { UpdateCategoryDto } from "./dto/update-category.dto";
import { CreatePostDto } from "./dto/create-post.dto";
import { CreateThreadDto } from "./dto/create-thread.dto";
import { ForumService } from "./forum.service";

@Controller("forum")
@UseGuards(JwtAuthGuard)
export class ForumController {
  constructor(@Inject(ForumService) private readonly forumService: ForumService) {}

  @Get("categories")
  listCategories(@CurrentUser() user: AuthenticatedUser) {
    return this.forumService.listCategories(user.role);
  }

  @Get("categories/:categoryId")
  getCategory(
    @Param("categoryId") categoryId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.forumService.getCategory(categoryId, user.role);
  }

  @Post("categories")
  @UseGuards(RolesGuard)
  @Roles("GM", "ADMIN")
  createCategory(
    @Body() dto: CreateCategoryDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.forumService.createCategory(dto, user.userId);
  }

  @Patch("categories/:categoryId")
  @UseGuards(RolesGuard)
  @Roles("GM", "ADMIN")
  updateCategory(
    @Param("categoryId") categoryId: string,
    @Body() dto: UpdateCategoryDto,
  ) {
    return this.forumService.updateCategory(categoryId, dto);
  }

  @Delete("categories/:categoryId")
  @UseGuards(RolesGuard)
  @Roles("GM", "ADMIN")
  archiveCategory(@Param("categoryId") categoryId: string) {
    return this.forumService.archiveCategory(categoryId);
  }

  @Get("threads/:threadId")
  getThread(@Param("threadId") threadId: string) {
    return this.forumService.getThread(threadId);
  }

  @Post("threads")
  createThread(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateThreadDto,
  ) {
    return this.forumService.createThread(user.userId, user.role, dto);
  }

  @Post("threads/:threadId/posts")
  createPost(
    @Param("threadId") threadId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreatePostDto,
  ) {
    return this.forumService.createPost(threadId, user.userId, dto);
  }
}
