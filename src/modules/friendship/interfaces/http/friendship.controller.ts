import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query, Request, UseGuards } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import {
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../auth/jwt.auth.guard';
import { Page } from '../../../shared/domain/entities/page';
import type { AuthenticatedRequest } from '../../../shared/interfaces/http/authenticated-request';
import { ErrorDto } from '../../../shared/interfaces/http/dto/error-dto';
import { PagedQueryDto } from '../../../shared/interfaces/http/dto/paged-rsql-query';
import { CreateFriendshipRequestCommand } from '../../application/cqrs/commands/create-friendship-request.command';
import { DeleteFriendshipCommand } from '../../application/cqrs/commands/delete-friendship.command';
import { UpdateFriendshipCommand } from '../../application/cqrs/commands/update-friendship.command';
import { GetFriendshipQuery } from '../../application/cqrs/queries/get-friendship.query';
import { ListFriendshipsQuery } from '../../application/cqrs/queries/list-friendships.query';
import { Friendship } from '../../domain/aggregates/friendship';
import { CreateFriendshipRequestDto } from './dto/create-friendship-request.dto';
import { FriendshipDto } from './dto/friendship.dto';
import { FriendshipPageDto } from './dto/friendship-page.dto';
import { UpdateFriendshipDto } from './dto/update-friendship.dto';

@UseGuards(JwtAuthGuard)
@Controller('v1/friendships')
@ApiTags('Friendship')
export class FriendshipController {
  constructor(
    private readonly queryBus: QueryBus,
    private readonly commandBus: CommandBus,
  ) {}

  @Post('')
  @ApiOperation({ operationId: 'createFriendshipRequest', summary: 'Create friendship request' })
  @ApiCreatedResponse({ type: FriendshipDto, description: 'Created' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing authentication token', type: ErrorDto })
  @ApiConflictResponse({ description: 'Friendship already exists', type: ErrorDto })
  async create(@Request() req: AuthenticatedRequest, @Body() body: CreateFriendshipRequestDto): Promise<FriendshipDto> {
    const userId = req.user.id;
    const roles = req.user.roles;
    const command = new CreateFriendshipRequestCommand(body.addresseeName, body.message ?? null, userId, roles);
    const friendship = await this.commandBus.execute<CreateFriendshipRequestCommand, Friendship>(command);
    return FriendshipDto.fromEntity(friendship);
  }

  @Get('')
  @ApiOperation({ operationId: 'listFriendships', summary: 'List current friendships' })
  @ApiOkResponse({ type: FriendshipPageDto, description: 'Success' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing authentication token', type: ErrorDto })
  async find(@Request() req: AuthenticatedRequest, @Query() query: PagedQueryDto): Promise<FriendshipPageDto> {
    const userId = req.user.id;
    const friendships = await this.queryBus.execute<ListFriendshipsQuery, Page<Friendship>>(
      new ListFriendshipsQuery(userId, query.q, query.page, query.size),
    );
    return FriendshipPageDto.fromPage(friendships);
  }

  @Get(':id')
  @ApiOperation({ operationId: 'getFriendship', summary: 'Get friendship by id' })
  @ApiOkResponse({ type: FriendshipDto, description: 'Success' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing authentication token', type: ErrorDto })
  @ApiNotFoundResponse({ description: 'Friendship not found', type: ErrorDto })
  async findById(@Request() req: AuthenticatedRequest, @Param('id') id: string): Promise<FriendshipDto> {
    const userId = req.user.id;
    const friendship = await this.queryBus.execute<GetFriendshipQuery, Friendship>(new GetFriendshipQuery(id, userId));
    return FriendshipDto.fromEntity(friendship);
  }

  @Patch(':id')
  @ApiOperation({ operationId: 'updateFriendship', summary: 'Update friendship' })
  @ApiOkResponse({ type: FriendshipDto, description: 'Success' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing authentication token', type: ErrorDto })
  @ApiForbiddenResponse({ description: 'Forbidden friendship operation', type: ErrorDto })
  @ApiNotFoundResponse({ description: 'Friendship not found', type: ErrorDto })
  async update(@Request() req: AuthenticatedRequest, @Param('id') id: string, @Body() body: UpdateFriendshipDto): Promise<FriendshipDto> {
    const userId = req.user.id;
    const roles = req.user.roles;
    const command = new UpdateFriendshipCommand(id, body.status, userId, roles);
    const friendship = await this.commandBus.execute<UpdateFriendshipCommand, Friendship>(command);
    return FriendshipDto.fromEntity(friendship);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ operationId: 'deleteFriendship', summary: 'Delete friendship' })
  @ApiNoContentResponse({ description: 'Deleted' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing authentication token', type: ErrorDto })
  @ApiNotFoundResponse({ description: 'Friendship not found', type: ErrorDto })
  async delete(@Request() req: AuthenticatedRequest, @Param('id') id: string): Promise<void> {
    const userId = req.user.id;
    const roles = req.user.roles;
    await this.commandBus.execute<DeleteFriendshipCommand, Friendship>(new DeleteFriendshipCommand(id, userId, roles));
  }
}
