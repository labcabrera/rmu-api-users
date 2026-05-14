/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Controller, Get, Request, UseGuards } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/modules/auth/jwt.auth.guard';
import { ErrorDto } from 'src/modules/shared/interfaces/http/dto/error-dto';
import { UserDto } from './dto/user.dto';
import { GetUserQuery } from '../../application/cqrs/queries/GetUserQuery';
import { User } from '../../domain/aggregates/user';

@UseGuards(JwtAuthGuard)
@Controller('v1/users')
@ApiTags('User')
export class UserController {
  constructor(
    private readonly queryBus: QueryBus,
    private readonly commandBus: CommandBus,
  ) {}

  @Get('')
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
