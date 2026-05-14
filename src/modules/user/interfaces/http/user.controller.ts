/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Controller, Get, Query, Request, UseGuards } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/modules/auth/jwt.auth.guard';
import { Page } from 'src/modules/shared/domain/entities/page';
import { ErrorDto } from 'src/modules/shared/interfaces/http/dto/error-dto';
import { UserDto } from './dto/user.dto';
import { GetUserQuery } from '../../application/cqrs/queries/get-user-query';
import { User } from '../../domain/aggregates/user';
import { GetUsersQuery } from '../../application/cqrs/queries/get-users-query';
import { PagedQueryDto } from 'src/modules/shared/interfaces/http/dto/paged-rsql-query';

@UseGuards(JwtAuthGuard)
@Controller('v1/users')
@ApiTags('User')
export class UserController {
  constructor(private readonly queryBus: QueryBus) {}

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

  @Get('')
  @ApiOperation({ operationId: 'searchUsers', summary: 'Search users' })
  @ApiOkResponse({ type: Page<UserDto>, description: 'Success' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing authentication token', type: ErrorDto })
  async searchUsers(@Query() dto: PagedQueryDto, @Request() req): Promise<Page<UserDto>> {
    const userId = req.user!.id as string;
    const roles = req.user!.roles as string[];
    const query = new GetUsersQuery(dto.q, dto.page, dto.size, userId, roles);
    const page = await this.queryBus.execute<GetUsersQuery, Page<User>>(query);
    const mapped = page.content.map(e => UserDto.fromEntity(e));
    return new Page<UserDto>(mapped, page.pagination.page, page.pagination.size, page.pagination.totalElements);
  }
}
