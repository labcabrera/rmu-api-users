/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Controller, Get, Query, Request, UseGuards } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/modules/auth/jwt.auth.guard';
import { Page } from 'src/modules/shared/domain/entities/page';
import { ErrorDto } from 'src/modules/shared/interfaces/http/dto/error-dto';
import { UserDto } from './dto/user.dto';
import { GetUserQuery } from '../../application/cqrs/queries/GetUserQuery';
import { User } from '../../domain/aggregates/user';
import { SearchUsersQuery } from '../../application/cqrs/queries/search-users.query';
import { UserApiResponse } from '../../application/ports/user-search.port';
import { UserSearchPageDto } from './dto/user-search-page.dto';
import { SearchUsersQueryDto } from './dto/search-users-query.dto';

@UseGuards(JwtAuthGuard)
@Controller('v1/users')
@ApiTags('User')
export class UserController {
  constructor(
    private readonly queryBus: QueryBus,
    private readonly commandBus: CommandBus,
  ) {}

  @Get('')
  @ApiOperation({ operationId: 'searchUsers', summary: 'Search users' })
  @ApiOkResponse({ type: UserSearchPageDto, description: 'Success' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing authentication token', type: ErrorDto })
  async searchUsers(@Query() query: SearchUsersQueryDto): Promise<UserSearchPageDto> {
    const users = await this.queryBus.execute<SearchUsersQuery, Page<UserApiResponse>>(
      new SearchUsersQuery(query.q, query.page, query.size),
    );
    return UserSearchPageDto.fromPage(users);
  }

  @Get('me')
  @ApiOperation({ operationId: 'getUser', summary: 'Get current user' })
  @ApiOkResponse({ type: UserDto, description: 'Success' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing authentication token', type: ErrorDto })
  @ApiNotFoundResponse({ description: 'User not found', type: ErrorDto })
  async getUser(@Request() req) {
    const userId = req.user!.id as string;
    const roles = req.user!.roles as string[];
    const query = new GetUserQuery(userId, roles);
    const user = await this.queryBus.execute<GetUserQuery, User>(query);
    return UserDto.fromEntity(user);
  }
}
