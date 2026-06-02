import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { UserRole } from "@prisma/client";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { Roles } from "../common/decorators/roles.decorator";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { CreateDocCategoryDto } from "./dto/create-doc-category.dto";
import { UpdateDocCategoryDto } from "./dto/update-doc-category.dto";
import { CreateDocPageDto } from "./dto/create-doc-page.dto";
import { UpdateDocPageDto } from "./dto/update-doc-page.dto";
import { CreateMediaAssetDto } from "./dto/create-media-asset.dto";
import { DocsService } from "./docs.service";

@Controller("docs")
@UseGuards(JwtAuthGuard)
export class DocsController {
  constructor(@Inject(DocsService) private readonly docsService: DocsService) {}

  @Get("categories")
  listCategories(
    @CurrentUser() user: { userId: string; role: UserRole },
    @Query("worldId") worldId?: string,
  ) {
    return this.docsService.listCategories(user.role, worldId);
  }

  @Get("categories/:id/pages")
  getCategoryPages(
    @Param("id") id: string,
    @CurrentUser() user: { userId: string; role: UserRole },
  ) {
    return this.docsService.getCategoryPages(id, user.role);
  }

  @Get("pages/:id")
  getPage(
    @Param("id") id: string,
    @CurrentUser() user: { userId: string; role: UserRole },
  ) {
    return this.docsService.getPage(id, user.role);
  }

  @Post("categories")
  @UseGuards(RolesGuard)
  @Roles("GM", "ADMIN")
  createCategory(
    @CurrentUser() user: { userId: string },
    @Body() dto: CreateDocCategoryDto,
  ) {
    return this.docsService.createCategory(user.userId, dto);
  }

  @Patch("categories/:id")
  @UseGuards(RolesGuard)
  @Roles("GM", "ADMIN")
  updateCategory(@Param("id") id: string, @Body() dto: UpdateDocCategoryDto) {
    return this.docsService.updateCategory(id, dto);
  }

  @Post("pages")
  @UseGuards(RolesGuard)
  @Roles("GM", "ADMIN")
  createPage(
    @CurrentUser() user: { userId: string },
    @Body() dto: CreateDocPageDto,
  ) {
    return this.docsService.createPage(user.userId, dto);
  }

  @Patch("pages/:id")
  @UseGuards(RolesGuard)
  @Roles("GM", "ADMIN")
  updatePage(@Param("id") id: string, @Body() dto: UpdateDocPageDto) {
    return this.docsService.updatePage(id, dto);
  }

  @Post("media")
  @UseGuards(RolesGuard)
  @Roles("GM", "ADMIN")
  createMediaAsset(
    @CurrentUser() user: { userId: string },
    @Body() dto: CreateMediaAssetDto,
  ) {
    return this.docsService.createMediaAsset(user.userId, dto);
  }

  @Get("media")
  @UseGuards(RolesGuard)
  @Roles("GM", "ADMIN")
  listMediaAssets(@Query("worldId") worldId?: string) {
    return this.docsService.listMediaAssets(worldId);
  }
}
