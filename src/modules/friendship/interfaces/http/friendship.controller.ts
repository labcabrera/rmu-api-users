import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiCreatedResponse, ApiNoContentResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiErrors } from '../../../shared/interfaces/http/api-errors.decorator.js';
import type { AuthenticatedUser } from '../../../shared/interfaces/http/authenticated-request.js';
import { CurrentUser } from '../../../shared/interfaces/http/current-user.decorator.js';
import { JwtAuthGuard } from '../../../shared/infrastructure/security/jwt-auth.guard.js';
import { Page } from '../../../shared/application/pagination/page.js';
import { PagedQueryDto } from '../../../shared/interfaces/http/dto/paged-rsql-query.js';
import { CreateFriendshipRequestCommand } from '../../application/cqrs/commands/create-friendship-request.command.js';
import { DeleteFriendshipCommand } from '../../application/cqrs/commands/delete-friendship.command.js';
import { UpdateFriendshipCommand } from '../../application/cqrs/commands/update-friendship.command.js';
import { GetFriendshipQuery } from '../../application/cqrs/queries/get-friendship.query.js';
import { ListFriendshipsQuery } from '../../application/cqrs/queries/list-friendships.query.js';
import { Friendship } from '../../domain/aggregates/friendship.js';
import { CreateFriendshipRequestDto } from './dto/create-friendship-request.dto.js';
import { FriendshipDto } from './dto/friendship.dto.js';
import { FriendshipPageDto } from './dto/friendship-page.dto.js';
import { UpdateFriendshipDto } from './dto/update-friendship.dto.js';

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
  @ApiErrors({ 403: 'Caller is not in the rmu-user or rmu-admin group', 409: 'Friendship already exists' })
  async create(@CurrentUser() user: AuthenticatedUser, @Body() body: CreateFriendshipRequestDto): Promise<FriendshipDto> {
    const userId = user.id;
    const roles = user.roles;
    const command = new CreateFriendshipRequestCommand(body.addresseeName, body.message ?? null, userId, roles);
    const friendship = await this.commandBus.execute<CreateFriendshipRequestCommand, Friendship>(command);
    return FriendshipDto.fromEntity(friendship);
  }

  @Get('')
  @ApiOperation({ operationId: 'listFriendships', summary: 'List current friendships' })
  @ApiOkResponse({ type: FriendshipPageDto, description: 'Success' })
  @ApiErrors()
  async find(@CurrentUser() user: AuthenticatedUser, @Query() query: PagedQueryDto): Promise<FriendshipPageDto> {
    const userId = user.id;
    const friendships = await this.queryBus.execute<ListFriendshipsQuery, Page<Friendship>>(
      new ListFriendshipsQuery(userId, query.q, query.page, query.size),
    );
    return FriendshipPageDto.fromPage(friendships);
  }

  @Get(':id')
  @ApiOperation({ operationId: 'getFriendship', summary: 'Get friendship by id' })
  @ApiOkResponse({ type: FriendshipDto, description: 'Success' })
  @ApiErrors({ 404: 'Friendship not found' })
  async findById(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string): Promise<FriendshipDto> {
    const userId = user.id;
    const friendship = await this.queryBus.execute<GetFriendshipQuery, Friendship>(new GetFriendshipQuery(id, userId));
    return FriendshipDto.fromEntity(friendship);
  }

  @Patch(':id')
  @ApiOperation({ operationId: 'updateFriendship', summary: 'Update friendship' })
  @ApiOkResponse({ type: FriendshipDto, description: 'Success' })
  @ApiErrors({
    403: 'Caller is the requester, not the addressee',
    404: 'Friendship not found or caller outside it',
    409: 'Stale version (version-conflict)',
  })
  async update(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() body: UpdateFriendshipDto): Promise<FriendshipDto> {
    const userId = user.id;
    const roles = user.roles;
    const command = new UpdateFriendshipCommand(id, body.status, userId, roles, body.version);
    const friendship = await this.commandBus.execute<UpdateFriendshipCommand, Friendship>(command);
    return FriendshipDto.fromEntity(friendship);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ operationId: 'deleteFriendship', summary: 'Delete friendship' })
  @ApiNoContentResponse({ description: 'Deleted' })
  @ApiErrors({ 404: 'Friendship not found' })
  async delete(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string): Promise<void> {
    const userId = user.id;
    const roles = user.roles;
    await this.commandBus.execute<DeleteFriendshipCommand, Friendship>(new DeleteFriendshipCommand(id, userId, roles));
  }
}
