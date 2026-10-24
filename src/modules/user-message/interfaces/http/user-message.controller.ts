import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiCreatedResponse, ApiNoContentResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiErrors } from '../../../shared/interfaces/http/api-errors.decorator.js';
import type { AuthenticatedUser } from '../../../shared/interfaces/http/authenticated-request.js';
import { CurrentUser } from '../../../shared/interfaces/http/current-user.decorator.js';
import { JwtAuthGuard } from '../../../shared/infrastructure/security/jwt-auth.guard.js';
import { Page } from '../../../shared/application/pagination/page.js';
import { PagedQueryDto } from '../../../shared/interfaces/http/dto/paged-rsql-query.js';
import { CreateUserMessageCommand } from '../../application/cqrs/commands/create-user-message.command.js';
import { DeleteUserMessageCommand } from '../../application/cqrs/commands/delete-user-message.command.js';
import { MarkUserMessageReadCommand } from '../../application/cqrs/commands/mark-user-message-read.command.js';
import { GetUserMessagesQuery } from '../../application/cqrs/queries/get-user-messages.query.js';
import { UserMessage } from '../../domain/aggregates/user-message.js';
import { CreateUserMessageDto } from './dto/create-user-message.dto.js';
import { UserMessageDto } from './dto/user-message.dto.js';
import { UserMessagePageDto } from './dto/user-message-page.dto.js';

@UseGuards(JwtAuthGuard)
@Controller('v1/user-messages')
@ApiTags('Message')
export class MessageController {
  constructor(
    private readonly queryBus: QueryBus,
    private readonly commandBus: CommandBus,
  ) {}

  @Get('')
  @ApiOperation({
    operationId: 'listMessages',
    summary: 'List the messages of the caller, newest first',
    description: 'q filters with RSQL inside the messages of the caller: `readed==null` gives the unread ones.',
  })
  @ApiOkResponse({ type: UserMessagePageDto, description: 'Success' })
  @ApiErrors()
  async findUnread(@CurrentUser() user: AuthenticatedUser, @Query() dto: PagedQueryDto): Promise<UserMessagePageDto> {
    const userId = user.id;
    const roles = user.roles;
    const query = new GetUserMessagesQuery(dto.q, dto.page, dto.size, userId, roles);
    const page = await this.queryBus.execute<GetUserMessagesQuery, Page<UserMessage>>(query);
    return UserMessagePageDto.fromPage(page);
  }

  @Post('')
  @ApiOperation({ operationId: 'createMessage', summary: 'Create user message' })
  @ApiCreatedResponse({ type: UserMessageDto, description: 'Created' })
  @ApiErrors({
    403: 'Caller is not in the rmu-user or rmu-admin group, or the recipient is not an accepted friend (not-friends)',
    404: 'Recipient not found',
  })
  async create(@CurrentUser() user: AuthenticatedUser, @Body() body: CreateUserMessageDto): Promise<UserMessageDto> {
    const userId = user.id;
    const roles = user.roles;
    const command = new CreateUserMessageCommand(body.message, body.type, body.recipientId, userId, roles);
    const message = await this.commandBus.execute<CreateUserMessageCommand, UserMessage>(command);
    return UserMessageDto.fromEntity(message);
  }

  @Patch(':id/read')
  @ApiOperation({ operationId: 'markMessageAsRead', summary: 'Mark user message as read' })
  @ApiOkResponse({ type: UserMessageDto, description: 'Success' })
  @ApiErrors({ 404: 'Message not found' })
  async markAsRead(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string): Promise<UserMessageDto> {
    const userId = user.id;
    const roles = user.roles;
    const message = await this.commandBus.execute<MarkUserMessageReadCommand, UserMessage>(
      new MarkUserMessageReadCommand(id, userId, roles),
    );
    return UserMessageDto.fromEntity(message);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ operationId: 'deleteMessage', summary: 'Delete user message' })
  @ApiNoContentResponse({ description: 'Deleted' })
  @ApiErrors({ 404: 'Message not found' })
  async delete(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string): Promise<void> {
    const userId = user.id;
    const roles = user.roles;
    await this.commandBus.execute<DeleteUserMessageCommand, UserMessage>(new DeleteUserMessageCommand(id, userId, roles));
  }
}
