import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, UseGuards } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiCreatedResponse, ApiNoContentResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiErrors } from '../../../shared/interfaces/http/api-errors.decorator.js';
import type { AuthenticatedUser } from '../../../shared/interfaces/http/authenticated-request.js';
import { CurrentUser } from '../../../shared/interfaces/http/current-user.decorator.js';
import { JwtAuthGuard } from '../../../shared/infrastructure/security/jwt-auth.guard.js';
import {
  AcceptFriendInviteCommand,
  CreateFriendInviteCommand,
  DeleteFriendInviteCommand,
} from '../../application/cqrs/commands/friend-invite.commands.js';
import type { CreatedFriendInvite } from '../../application/cqrs/handlers/friend-invite.handlers.js';
import { CheckFriendInviteQuery, ListFriendInvitesQuery } from '../../application/cqrs/queries/friend-invite.queries.js';
import { FriendInvite } from '../../domain/aggregates/friend-invite.js';
import { Friendship } from '../../domain/aggregates/friendship.js';
import { FriendInviteDto, FriendInviteTokenDto } from './dto/friend-invite.dto.js';
import { FriendshipDto } from './dto/friendship.dto.js';

/** Invite links (spec 070): single use, 7 days, at most 10 active per user. */
@UseGuards(JwtAuthGuard)
@Controller('v1/friend-invites')
@ApiTags('Friendship')
export class FriendInviteController {
  constructor(
    private readonly queryBus: QueryBus,
    private readonly commandBus: CommandBus,
  ) {}

  @Post('')
  @ApiOperation({ operationId: 'createFriendInvite', summary: 'Create an invite link (the token is only in this answer)' })
  @ApiCreatedResponse({ type: FriendInviteDto, description: 'Created' })
  @ApiErrors({
    400: 'The caller has no RMU profile',
    403: 'Caller is not in the rmu-user or rmu-admin group',
    409: 'Ten invites are active already (friend-invite-limit)',
  })
  async create(@CurrentUser() user: AuthenticatedUser): Promise<FriendInviteDto> {
    const created = await this.commandBus.execute<CreateFriendInviteCommand, CreatedFriendInvite>(
      new CreateFriendInviteCommand(user.id, user.roles),
    );
    return FriendInviteDto.fromEntity(created.invite, created.token);
  }

  @Get('')
  @ApiOperation({ operationId: 'listFriendInvites', summary: 'Active invites of the caller, newest first (without tokens)' })
  @ApiOkResponse({ type: [FriendInviteDto], description: 'Success' })
  @ApiErrors()
  async list(@CurrentUser() user: AuthenticatedUser): Promise<FriendInviteDto[]> {
    const invites = await this.queryBus.execute<ListFriendInvitesQuery, FriendInvite[]>(new ListFriendInvitesQuery(user.id));
    return invites.map(invite => FriendInviteDto.fromEntity(invite));
  }

  @Post('check')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ operationId: 'checkFriendInvite', summary: 'Who invites with a token, before accepting it' })
  @ApiOkResponse({ type: FriendInviteDto, description: 'Success' })
  @ApiErrors({ 404: 'Unknown, expired or used invite (friend-invite-invalid)' })
  async check(@Body() body: FriendInviteTokenDto): Promise<FriendInviteDto> {
    const invite = await this.queryBus.execute<CheckFriendInviteQuery, FriendInvite>(new CheckFriendInviteQuery(body.token));
    return FriendInviteDto.fromEntity(invite);
  }

  @Post('accept')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ operationId: 'acceptFriendInvite', summary: 'Accept an invite: the inviter and the caller become friends' })
  @ApiOkResponse({ type: FriendshipDto, description: 'The accepted friendship' })
  @ApiErrors({
    400: 'The invite is the caller own (friend-invite-self), or the caller has no RMU profile',
    403: 'Caller is not in the rmu-user or rmu-admin group',
    404: 'Unknown, expired or used invite (friend-invite-invalid)',
    409: 'Already friends (already-friends) or blocked (friendship-blocked); the invite stays usable',
  })
  async accept(@CurrentUser() user: AuthenticatedUser, @Body() body: FriendInviteTokenDto): Promise<FriendshipDto> {
    const friendship = await this.commandBus.execute<AcceptFriendInviteCommand, Friendship>(
      new AcceptFriendInviteCommand(body.token, user.id, user.roles),
    );
    return FriendshipDto.fromEntity(friendship);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ operationId: 'deleteFriendInvite', summary: 'Delete an invite of the caller: its link stops working' })
  @ApiNoContentResponse({ description: 'Deleted' })
  @ApiErrors({ 404: 'Invite not found, or not the caller own' })
  async delete(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string): Promise<void> {
    await this.commandBus.execute(new DeleteFriendInviteCommand(id, user.id, user.roles));
  }
}
