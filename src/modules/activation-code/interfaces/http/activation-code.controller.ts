/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Request, UseGuards } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/modules/auth/jwt.auth.guard';
import { Page } from 'src/modules/shared/domain/entities/page';
import { ErrorDto } from 'src/modules/shared/interfaces/http/dto/error-dto';
import { PagedQueryDto } from 'src/modules/shared/interfaces/http/dto/paged-rsql-query';
import { ActivateActivationCodeCommand } from '../../application/cqrs/commands/activate-activation-code.command';
import { CreateActivationCodeCommand } from '../../application/cqrs/commands/create-activation-code.command';
import { DeleteActivationCodeCommand } from '../../application/cqrs/commands/delete-activation-code.command';
import { UpdateActivationCodeCommand } from '../../application/cqrs/commands/update-activation-code.command';
import { GetActivationCodeQuery } from '../../application/cqrs/queries/get-activation-code.query';
import { ListActivationCodesQuery } from '../../application/cqrs/queries/list-activation-codes.query';
import { ActivationCode } from '../../domain/aggregates/activation-code';
import { ActivateActivationCodeDto } from './dto/activate-activation-code.dto';
import { ActivationCodeDto } from './dto/activation-code.dto';
import { ActivationCodePageDto } from './dto/activation-code-page.dto';
import { CreateActivationCodeDto } from './dto/create-activation-code.dto';
import { UpdateActivationCodeDto } from './dto/update-activation-code.dto';
import { CheckActivationCodeQuery } from '../../application/cqrs/queries/check-activation-code.query';

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
  @ApiUnauthorizedResponse({ description: 'Invalid or missing authentication token', type: ErrorDto })
  @ApiForbiddenResponse({ description: 'Caller is not in the rmu-admin group', type: ErrorDto })
  async create(@Request() req, @Body() body: CreateActivationCodeDto): Promise<ActivationCodeDto[]> {
    const owner = req.user!.id as string;
    const roles = req.user!.roles as string[];
    const expiresAt = body.expiresAt ? new Date(body.expiresAt) : undefined;
    const count = body.count ?? 1;
    const command = new CreateActivationCodeCommand(owner, roles, body.features, expiresAt, count);
    const activationCodes = await this.commandBus.execute<CreateActivationCodeCommand, ActivationCode[]>(command);
    return activationCodes.map(ac => ActivationCodeDto.fromEntity(ac));
  }

  @Get('')
  @ApiOperation({ operationId: 'listActivationCodes', summary: 'List activation codes' })
  @ApiOkResponse({ type: ActivationCodePageDto, description: 'Success' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing authentication token', type: ErrorDto })
  async find(@Request() req, @Query() dto: PagedQueryDto): Promise<ActivationCodePageDto> {
    const userId = req.user!.id as string;
    const roles = req.user!.roles as string[];
    const query = new ListActivationCodesQuery(dto.q, dto.page, dto.size, userId, roles);
    const page = await this.queryBus.execute<ListActivationCodesQuery, Page<ActivationCode>>(query);
    return ActivationCodePageDto.fromPage(page);
  }

  @Get(':id')
  @ApiOperation({ operationId: 'getActivationCode', summary: 'Get activation code by id' })
  @ApiOkResponse({ type: ActivationCodeDto, description: 'Success' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing authentication token', type: ErrorDto })
  @ApiNotFoundResponse({ description: 'Activation code not found', type: ErrorDto })
  async findById(@Request() req, @Param('id') id: string): Promise<ActivationCodeDto> {
    const owner = req.user!.id as string;
    const query = new GetActivationCodeQuery(id, owner);
    const activationCode = await this.queryBus.execute<GetActivationCodeQuery, ActivationCode>(query);
    return ActivationCodeDto.fromEntity(activationCode);
  }

  @Post('check')
  @ApiOperation({ operationId: 'checkActivationCode', summary: 'Check that an activation code can be redeemed' })
  @ApiOkResponse({ type: ActivationCodeDto, description: 'Success' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing authentication token', type: ErrorDto })
  @ApiBadRequestResponse({ description: 'Unknown or expired activation code', type: ErrorDto })
  @ApiConflictResponse({ description: 'Activation code already used', type: ErrorDto })
  async check(@Body() body: ActivateActivationCodeDto): Promise<ActivationCodeDto> {
    const activationCode = await this.queryBus.execute<CheckActivationCodeQuery, ActivationCode>(new CheckActivationCodeQuery(body.code));
    return ActivationCodeDto.fromEntity(activationCode);
  }

  @Patch(':id')
  @ApiOperation({ operationId: 'updateActivationCode', summary: 'Update activation code' })
  @ApiOkResponse({ type: ActivationCodeDto, description: 'Success' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing authentication token', type: ErrorDto })
  @ApiNotFoundResponse({ description: 'Activation code not found', type: ErrorDto })
  async update(@Request() req, @Param('id') id: string, @Body() body: UpdateActivationCodeDto): Promise<ActivationCodeDto> {
    const owner = req.user!.id as string;
    const command = new UpdateActivationCodeCommand(
      id,
      owner,
      body.code,
      body.features,
      body.expiresAt ? new Date(body.expiresAt) : undefined,
      body.activatedAt === undefined ? undefined : body.activatedAt === null ? null : new Date(body.activatedAt),
    );
    const activationCode = await this.commandBus.execute<UpdateActivationCodeCommand, ActivationCode>(command);
    return ActivationCodeDto.fromEntity(activationCode);
  }

  @Post('activate')
  @ApiOperation({ operationId: 'activateActivationCode', summary: 'Redeem a single-use activation code' })
  @ApiConflictResponse({ description: 'Activation code already used', type: ErrorDto })
  @ApiOkResponse({ type: ActivationCodeDto, description: 'Success' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing authentication token', type: ErrorDto })
  @ApiNotFoundResponse({ description: 'Activation code not found', type: ErrorDto })
  async activate(@Request() req, @Body() body: ActivateActivationCodeDto): Promise<ActivationCodeDto> {
    const userId = req.user!.id as string;
    const roles = req.user!.roles as string[];
    const command = new ActivateActivationCodeCommand(body.code, userId, roles);
    const activationCode = await this.commandBus.execute<ActivateActivationCodeCommand, ActivationCode>(command);
    return ActivationCodeDto.fromEntity(activationCode);
  }

  @Delete(':id')
  @ApiOperation({ operationId: 'deleteActivationCode', summary: 'Delete activation code' })
  @ApiNoContentResponse({ description: 'Deleted' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing authentication token', type: ErrorDto })
  @ApiNotFoundResponse({ description: 'Activation code not found', type: ErrorDto })
  async delete(@Request() req, @Param('id') id: string): Promise<void> {
    const owner = req.user!.id as string;
    await this.commandBus.execute<DeleteActivationCodeCommand, ActivationCode>(new DeleteActivationCodeCommand(id, owner));
  }
}
