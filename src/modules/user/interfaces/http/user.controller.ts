import { Body, Controller, Get, Param, Patch, Put, Query, UseGuards } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiErrors } from '../../../shared/interfaces/http/api-errors.decorator.js';
import type { AuthenticatedUser } from '../../../shared/interfaces/http/authenticated-request.js';
import { CurrentUser } from '../../../shared/interfaces/http/current-user.decorator.js';
import { JwtAuthGuard } from '../../../shared/infrastructure/security/jwt-auth.guard.js';
import { Page } from '../../../shared/application/pagination/page.js';
import { PagedQueryDto } from '../../../shared/interfaces/http/dto/paged-rsql-query.js';
import { SetUserEnabledCommand } from '../../application/cqrs/commands/set-user-enabled.command.js';
import { UpdateCurrentUserCommand } from '../../application/cqrs/commands/update-current-user.command.js';
import { UpdateUserGroupsCommand } from '../../application/cqrs/commands/update-user-groups.command.js';
import { GetUserByIdQuery } from '../../application/cqrs/queries/get-user-by-id.query.js';
import { GetUserQuery } from '../../application/cqrs/queries/get-user.query.js';
import { GetUsersQuery } from '../../application/cqrs/queries/get-users.query.js';
import { SearchUsersQuery } from '../../application/cqrs/queries/search-users.query.js';
import type { UserClaims } from '../../application/models/user-claims.js';
import type { UserSummary } from '../../application/models/user-summary.js';
import { User } from '../../domain/aggregates/user.js';
import { UserSettings } from '../../domain/value-objects/user-settings.vo.js';
import { SearchUsersDto } from './dto/search-users.dto.js';
import { UpdateCurrentUserDto } from './dto/update-current-user.dto.js';
import { UpdateUserGroupsDto } from './dto/update-user-groups.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { UserPageDto } from './dto/user-page.dto.js';
import { UserSummaryPageDto } from './dto/user-summary.dto.js';
import { UserDto } from './dto/user.dto.js';

function toClaims(user: AuthenticatedUser): UserClaims {
  return {
    id: user.id,
    email: user.email,
    emailVerified: user.emailVerified,
    username: user.username,
    givenName: user.given_name,
    familyName: user.family_name,
    groups: user.roles,
    identityProvider: user.identityProvider,
  };
}

@UseGuards(JwtAuthGuard)
@Controller('v1/users')
@ApiTags('User')
export class UserController {
  constructor(
    private readonly queryBus: QueryBus,
    private readonly commandBus: CommandBus,
  ) {}

  @Get('me')
  @ApiOperation({
    operationId: 'getUser',
    summary: 'Get current user',
    description: 'Creates the profile from the token claims on first access and refreshes it when the claims change.',
  })
  @ApiOkResponse({ type: UserDto, description: 'Success' })
  @ApiErrors()
  async getUser(@CurrentUser() user: AuthenticatedUser): Promise<UserDto> {
    const profile = await this.queryBus.execute<GetUserQuery, User>(new GetUserQuery(toClaims(user)));
    return UserDto.fromEntity(profile);
  }

  @Patch('me')
  @ApiOperation({ operationId: 'updateCurrentUser', summary: 'Update current user profile (display name, settings, image)' })
  @ApiOkResponse({ type: UserDto, description: 'Success' })
  @ApiErrors({
    404: 'Profile not found (call GET /v1/users/me first)',
    409: 'Display name already in use, or stale version (version-conflict)',
  })
  async updateCurrentUser(@CurrentUser() user: AuthenticatedUser, @Body() body: UpdateCurrentUserDto): Promise<UserDto> {
    const settings = body.settings?.measurementSystem ? new UserSettings(body.settings.measurementSystem) : undefined;
    const command = new UpdateCurrentUserCommand(body.name, settings, body.imageUrl, user.id, user.roles, body.version);
    const profile = await this.commandBus.execute<UpdateCurrentUserCommand, User>(command);
    return UserDto.fromEntity(profile);
  }

  @Get('search')
  @ApiOperation({ operationId: 'searchUsersByName', summary: 'Search users by display name prefix (public projection)' })
  @ApiOkResponse({ type: UserSummaryPageDto, description: 'Success' })
  @ApiErrors()
  async searchByName(@CurrentUser() user: AuthenticatedUser, @Query() dto: SearchUsersDto): Promise<UserSummaryPageDto> {
    const query = new SearchUsersQuery(dto.name, dto.page, dto.size, user.id, user.roles);
    const page = await this.queryBus.execute<SearchUsersQuery, Page<UserSummary>>(query);
    return UserSummaryPageDto.fromPage(page);
  }

  @Get('')
  @ApiOperation({ operationId: 'searchUsers', summary: 'List users with RSQL (rmu-admin only)' })
  @ApiOkResponse({ type: UserPageDto, description: 'Success' })
  @ApiErrors({ 403: 'Caller is not in the rmu-admin group' })
  async searchUsers(@CurrentUser() user: AuthenticatedUser, @Query() dto: PagedQueryDto): Promise<UserPageDto> {
    const query = new GetUsersQuery(dto.q, dto.page, dto.size, user.id, user.roles);
    const page = await this.queryBus.execute<GetUsersQuery, Page<User>>(query);
    return UserPageDto.fromPage(page);
  }

  // The routes with an id go last, so `me` and `search` are not taken as ids.
  @Get(':id')
  @ApiOperation({ operationId: 'getUserById', summary: 'Get a user by id (rmu-admin only)' })
  @ApiOkResponse({ type: UserDto, description: 'Success' })
  @ApiErrors({ 403: 'Caller is not in the rmu-admin group', 404: 'User not found' })
  async getById(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string): Promise<UserDto> {
    const profile = await this.queryBus.execute<GetUserByIdQuery, User>(new GetUserByIdQuery(id, user.id, user.roles));
    return UserDto.fromEntity(profile);
  }

  @Put(':id/groups')
  @ApiOperation({ operationId: 'updateUserGroups', summary: 'Set the managed realm groups of a user (rmu-admin only)' })
  @ApiOkResponse({ type: UserDto, description: 'Success' })
  @ApiErrors({
    403: 'Caller is not in the rmu-admin group',
    404: 'User not found',
    409: 'An administrator removing their own rmu-admin group (self-admin-removal)',
  })
  async updateGroups(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() body: UpdateUserGroupsDto): Promise<UserDto> {
    const command = new UpdateUserGroupsCommand(id, body.groups, user.id, user.roles);
    return UserDto.fromEntity(await this.commandBus.execute<UpdateUserGroupsCommand, User>(command));
  }

  @Patch(':id')
  @ApiOperation({ operationId: 'updateUser', summary: 'Enable or disable an account (rmu-admin only)' })
  @ApiOkResponse({ type: UserDto, description: 'Success' })
  @ApiErrors({
    403: 'Caller is not in the rmu-admin group',
    404: 'User not found',
    409: 'An administrator disabling their own account (self-disable)',
  })
  async updateUser(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() body: UpdateUserDto): Promise<UserDto> {
    const command = new SetUserEnabledCommand(id, body.enabled, user.id, user.roles);
    return UserDto.fromEntity(await this.commandBus.execute<SetUserEnabledCommand, User>(command));
  }
}
