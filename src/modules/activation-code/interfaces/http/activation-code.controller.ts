import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiCreatedResponse, ApiNoContentResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiErrors } from '../../../shared/interfaces/http/api-errors.decorator.js';
import type { AuthenticatedUser } from '../../../shared/interfaces/http/authenticated-request.js';
import { CurrentUser } from '../../../shared/interfaces/http/current-user.decorator.js';
import { JwtAuthGuard } from '../../../shared/infrastructure/security/jwt-auth.guard.js';
import { Page } from '../../../shared/application/pagination/page.js';
import { PagedQueryDto } from '../../../shared/interfaces/http/dto/paged-rsql-query.js';
import { ActivateActivationCodeCommand } from '../../application/cqrs/commands/activate-activation-code.command.js';
import { CreateActivationCodeCommand } from '../../application/cqrs/commands/create-activation-code.command.js';
import { DeleteActivationCodeCommand } from '../../application/cqrs/commands/delete-activation-code.command.js';
import { UpdateActivationCodeCommand } from '../../application/cqrs/commands/update-activation-code.command.js';
import { GetActivationCodeQuery } from '../../application/cqrs/queries/get-activation-code.query.js';
import { ListActivationCodesQuery } from '../../application/cqrs/queries/list-activation-codes.query.js';
import { ActivationCode } from '../../domain/aggregates/activation-code.js';
import { ActivateActivationCodeDto } from './dto/activate-activation-code.dto.js';
import { ActivationCodeDto } from './dto/activation-code.dto.js';
import { ActivationCodePageDto } from './dto/activation-code-page.dto.js';
import { CreateActivationCodeDto } from './dto/create-activation-code.dto.js';
import { UpdateActivationCodeDto } from './dto/update-activation-code.dto.js';
import { CheckActivationCodeQuery } from '../../application/cqrs/queries/check-activation-code.query.js';

@UseGuards(JwtAuthGuard)
@Controller('v1/activation-codes')
@ApiTags('ActivationCode')
export class ActivationCodeController {
  constructor(
    private readonly queryBus: QueryBus,
    private readonly commandBus: CommandBus,
  ) {}

  @Post('')
  @ApiOperation({ operationId: 'createActivationCodes', summary: 'Create activation codes' })
  @ApiCreatedResponse({ type: ActivationCodeDto, isArray: true, description: 'Created' })
  @ApiErrors({ 403: 'Caller is not in the rmu-admin group' })
  async create(@CurrentUser() user: AuthenticatedUser, @Body() body: CreateActivationCodeDto): Promise<ActivationCodeDto[]> {
    const owner = user.id;
    const roles = user.roles;
    const expiresAt = body.expiresAt ? new Date(body.expiresAt) : undefined;
    const count = body.count ?? 1;
    const command = new CreateActivationCodeCommand(owner, roles, body.features, expiresAt, count);
    const activationCodes = await this.commandBus.execute<CreateActivationCodeCommand, ActivationCode[]>(command);
    return activationCodes.map(ac => ActivationCodeDto.fromEntity(ac));
  }

  @Get('')
  @ApiOperation({ operationId: 'listActivationCodes', summary: 'List activation codes' })
  @ApiOkResponse({ type: ActivationCodePageDto, description: 'Success' })
  @ApiErrors()
  async find(@CurrentUser() user: AuthenticatedUser, @Query() dto: PagedQueryDto): Promise<ActivationCodePageDto> {
    const userId = user.id;
    const roles = user.roles;
    const query = new ListActivationCodesQuery(dto.q, dto.page, dto.size, userId, roles);
    const page = await this.queryBus.execute<ListActivationCodesQuery, Page<ActivationCode>>(query);
    return ActivationCodePageDto.fromPage(page);
  }

  @Get(':id')
  @ApiOperation({ operationId: 'getActivationCode', summary: 'Get activation code by id' })
  @ApiOkResponse({ type: ActivationCodeDto, description: 'Success' })
  @ApiErrors({ 404: 'Activation code not found' })
  async findById(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string): Promise<ActivationCodeDto> {
    const owner = user.id;
    const query = new GetActivationCodeQuery(id, owner);
    const activationCode = await this.queryBus.execute<GetActivationCodeQuery, ActivationCode>(query);
    return ActivationCodeDto.fromEntity(activationCode);
  }

  @Post('check')
  @ApiOperation({ operationId: 'checkActivationCode', summary: 'Check that an activation code can be redeemed' })
  @ApiOkResponse({ type: ActivationCodeDto, description: 'Success' })
  @ApiErrors({ 400: 'Unknown or expired activation code', 409: 'Activation code already used' })
  async check(@Body() body: ActivateActivationCodeDto): Promise<ActivationCodeDto> {
    const activationCode = await this.queryBus.execute<CheckActivationCodeQuery, ActivationCode>(new CheckActivationCodeQuery(body.code));
    return ActivationCodeDto.fromEntity(activationCode);
  }

  @Patch(':id')
  @ApiOperation({ operationId: 'updateActivationCode', summary: 'Update activation code' })
  @ApiOkResponse({ type: ActivationCodeDto, description: 'Success' })
  @ApiErrors({ 404: 'Activation code not found', 409: 'Stale version (version-conflict) or code already in use (duplicate-key)' })
  async update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() body: UpdateActivationCodeDto,
  ): Promise<ActivationCodeDto> {
    const owner = user.id;
    const command = new UpdateActivationCodeCommand(
      id,
      owner,
      body.code,
      body.features,
      body.expiresAt ? new Date(body.expiresAt) : undefined,
      body.activatedAt === undefined ? undefined : body.activatedAt === null ? null : new Date(body.activatedAt),
      body.version,
    );
    const activationCode = await this.commandBus.execute<UpdateActivationCodeCommand, ActivationCode>(command);
    return ActivationCodeDto.fromEntity(activationCode);
  }

  @Post('activate')
  @ApiOperation({ operationId: 'activateActivationCode', summary: 'Redeem a single-use activation code' })
  @ApiOkResponse({ type: ActivationCodeDto, description: 'Success' })
  @ApiErrors({ 404: 'Activation code not found', 409: 'Activation code already used' })
  async activate(@CurrentUser() user: AuthenticatedUser, @Body() body: ActivateActivationCodeDto): Promise<ActivationCodeDto> {
    const userId = user.id;
    const roles = user.roles;
    const command = new ActivateActivationCodeCommand(body.code, userId, roles);
    const activationCode = await this.commandBus.execute<ActivateActivationCodeCommand, ActivationCode>(command);
    return ActivationCodeDto.fromEntity(activationCode);
  }

  @Delete(':id')
  @ApiOperation({ operationId: 'deleteActivationCode', summary: 'Delete activation code' })
  @ApiNoContentResponse({ description: 'Deleted' })
  @ApiErrors({ 404: 'Activation code not found' })
  async delete(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string): Promise<void> {
    const owner = user.id;
    await this.commandBus.execute<DeleteActivationCodeCommand, ActivationCode>(new DeleteActivationCodeCommand(id, owner));
  }
}
