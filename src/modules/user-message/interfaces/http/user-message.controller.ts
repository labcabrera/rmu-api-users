import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query, Request, UseGuards } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import {
  ApiCreatedResponse,
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
import { CreateUserMessageCommand } from '../../application/cqrs/commands/create-user-message.command';
import { DeleteUserMessageCommand } from '../../application/cqrs/commands/delete-user-message.command';
import { MarkUserMessageReadCommand } from '../../application/cqrs/commands/mark-user-message-read.command';
import { GetUserMessagesQuery } from '../../application/cqrs/queries/get-user-messages.query';
import { UserMessage } from '../../domain/aggregates/user-message';
import { CreateUserMessageDto } from './dto/create-user-message.dto';
import { UserMessageDto } from './dto/user-message.dto';
import { UserMessagePageDto } from './dto/user-message-page.dto';

@UseGuards(JwtAuthGuard)
@Controller('v1/user-messages')
@ApiTags('Message')
export class MessageController {
  constructor(
    private readonly queryBus: QueryBus,
    private readonly commandBus: CommandBus,
  ) {}

  @Get('')
  @ApiOperation({ operationId: 'listMessages', summary: 'List user messages' })
  @ApiOkResponse({ type: UserMessagePageDto, description: 'Success' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing authentication token', type: ErrorDto })
  async findUnread(@Request() req: AuthenticatedRequest, @Query() dto: PagedQueryDto): Promise<UserMessagePageDto> {
    const userId = req.user.id;
    const roles = req.user.roles;
    const query = new GetUserMessagesQuery(dto.q, dto.page, dto.size, userId, roles);
    const page = await this.queryBus.execute<GetUserMessagesQuery, Page<UserMessage>>(query);
    return UserMessagePageDto.fromPage(page);
  }

  @Post('')
  @ApiOperation({ operationId: 'createMessage', summary: 'Create user message' })
  @ApiCreatedResponse({ type: UserMessageDto, description: 'Created' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing authentication token', type: ErrorDto })
  async create(@Request() req: AuthenticatedRequest, @Body() body: CreateUserMessageDto): Promise<UserMessageDto> {
    const userId = req.user.id;
    const roles = req.user.roles;
    const command = new CreateUserMessageCommand(body.message, body.type, body.recipientId, userId, roles);
    const message = await this.commandBus.execute<CreateUserMessageCommand, UserMessage>(command);
    return UserMessageDto.fromEntity(message);
  }

  @Patch(':id/read')
  @ApiOperation({ operationId: 'markMessageAsRead', summary: 'Mark user message as read' })
  @ApiOkResponse({ type: UserMessageDto, description: 'Success' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing authentication token', type: ErrorDto })
  @ApiNotFoundResponse({ description: 'Message not found', type: ErrorDto })
  async markAsRead(@Request() req: AuthenticatedRequest, @Param('id') id: string): Promise<UserMessageDto> {
    const userId = req.user.id;
    const roles = req.user.roles;
    const message = await this.commandBus.execute<MarkUserMessageReadCommand, UserMessage>(
      new MarkUserMessageReadCommand(id, userId, roles),
    );
    return UserMessageDto.fromEntity(message);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ operationId: 'deleteMessage', summary: 'Delete user message' })
  @ApiNoContentResponse({ description: 'Deleted' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing authentication token', type: ErrorDto })
  @ApiNotFoundResponse({ description: 'Message not found', type: ErrorDto })
  async delete(@Request() req: AuthenticatedRequest, @Param('id') id: string): Promise<void> {
    const userId = req.user.id;
    const roles = req.user.roles;
    await this.commandBus.execute<DeleteUserMessageCommand, UserMessage>(new DeleteUserMessageCommand(id, userId, roles));
  }
}
