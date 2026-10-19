import { Body, Controller, Get, Patch, Query, Request, UseGuards } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import {
  ApiConflictResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AuthenticatedUser } from 'src/modules/auth/authenticated-user';
import { JwtAuthGuard } from 'src/modules/auth/jwt.auth.guard';
import { Page } from 'src/modules/shared/domain/entities/page';
import { ErrorDto } from 'src/modules/shared/interfaces/http/dto/error-dto';
import { PagedQueryDto } from 'src/modules/shared/interfaces/http/dto/paged-rsql-query';
import { UpdateCurrentUserCommand } from '../../application/cqrs/commands/update-current-user.command';
import { GetUserQuery } from '../../application/cqrs/queries/get-user-query';
import { GetUsersQuery } from '../../application/cqrs/queries/get-users-query';
import { SearchUsersQuery } from '../../application/cqrs/queries/search-users-query';
import { UserClaims } from '../../application/models/user-claims';
import { UserSummary } from '../../application/models/user-summary';
import { User } from '../../domain/aggregates/user';
import { UserSettings } from '../../domain/value-objects/user-settings.vo';
import { SearchUsersDto } from './dto/search-users.dto';
import { UpdateCurrentUserDto } from './dto/update-current-user.dto';
import { UserPageDto } from './dto/user-page.dto';
import { UserSummaryPageDto } from './dto/user-summary.dto';
import { UserDto } from './dto/user.dto';

interface AuthenticatedRequest {
  user: AuthenticatedUser;
}

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
  @ApiUnauthorizedResponse({ description: 'Invalid or missing authentication token', type: ErrorDto })
  async getUser(@Request() req: AuthenticatedRequest): Promise<UserDto> {
    const user = await this.queryBus.execute<GetUserQuery, User>(new GetUserQuery(toClaims(req.user)));
    return UserDto.fromEntity(user);
  }

  @Patch('me')
  @ApiOperation({ operationId: 'updateCurrentUser', summary: 'Update current user profile (display name, settings, image)' })
  @ApiOkResponse({ type: UserDto, description: 'Success' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing authentication token', type: ErrorDto })
  @ApiNotFoundResponse({ description: 'Profile not found (call GET /v1/users/me first)', type: ErrorDto })
  @ApiConflictResponse({ description: 'Display name already in use', type: ErrorDto })
  async updateCurrentUser(@Request() req: AuthenticatedRequest, @Body() body: UpdateCurrentUserDto): Promise<UserDto> {
    const settings = body.settings?.measurementSystem ? new UserSettings(body.settings.measurementSystem) : undefined;
    const command = new UpdateCurrentUserCommand(body.name, settings, body.imageUrl, req.user.id, req.user.roles);
    const user = await this.commandBus.execute<UpdateCurrentUserCommand, User>(command);
    return UserDto.fromEntity(user);
  }

  @Get('search')
  @ApiOperation({ operationId: 'searchUsersByName', summary: 'Search users by display name prefix (public projection)' })
  @ApiOkResponse({ type: UserSummaryPageDto, description: 'Success' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing authentication token', type: ErrorDto })
  async searchByName(@Request() req: AuthenticatedRequest, @Query() dto: SearchUsersDto): Promise<UserSummaryPageDto> {
    const query = new SearchUsersQuery(dto.name, dto.page, dto.size, req.user.id, req.user.roles);
    const page = await this.queryBus.execute<SearchUsersQuery, Page<UserSummary>>(query);
    return UserSummaryPageDto.fromPage(page);
  }

  @Get('')
  @ApiOperation({ operationId: 'searchUsers', summary: 'List users with RSQL (rmu-admin only)' })
  @ApiOkResponse({ type: UserPageDto, description: 'Success' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing authentication token', type: ErrorDto })
  @ApiForbiddenResponse({ description: 'Caller is not in the rmu-admin group', type: ErrorDto })
  async searchUsers(@Request() req: AuthenticatedRequest, @Query() dto: PagedQueryDto): Promise<UserPageDto> {
    const query = new GetUsersQuery(dto.q, dto.page, dto.size, req.user.id, req.user.roles);
    const page = await this.queryBus.execute<GetUsersQuery, Page<User>>(query);
    return UserPageDto.fromPage(page);
  }
}
