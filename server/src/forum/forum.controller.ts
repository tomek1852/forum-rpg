import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Post,
  UseGuards,
} from "@nestjs/common";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { Roles } from "../common/decorators/roles.decorator";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { CreateCategoryDto } from "./dto/create-category.dto";
import { CreatePostDto } from "./dto/create-post.dto";
import { CreateThreadDto } from "./dto/create-thread.dto";
import { ForumService } from "./forum.service";

@Controller("forum")
@UseGuards(JwtAuthGuard)
export class ForumController {
  constructor(@Inject(ForumService) private readonly forumService: ForumService) {}

  @Get("categories")
  listCategories() {
    return this.forumService.listCategories();
  }

  @Get("categories/:categoryId")
  getCategory(@Param("categoryId") categoryId: string) {
    return this.forumService.getCategory(categoryId);
  }

  @Post("categories")
  @UseGuards(RolesGuard)
  @Roles("GM", "ADMIN")
  createCategory(@Body() dto: CreateCategoryDto) {
    return this.forumService.createCategory(dto);
  }

  @Get("threads/:threadId")
  getThread(@Param("threadId") threadId: string) {
    return this.forumService.getThread(threadId);
  }

  @Post("threads")
  createThread(
    @CurrentUser() user: { userId: string },
    @Body() dto: CreateThreadDto,
  ) {
    return this.forumService.createThread(user.userId, dto);
  }

  @Post("threads/:threadId/posts")
  createPost(
    @Param("threadId") threadId: string,
    @CurrentUser() user: { userId: string },
    @Body() dto: CreatePostDto,
  ) {
    return this.forumService.createPost(threadId, user.userId, dto);
  }
}
