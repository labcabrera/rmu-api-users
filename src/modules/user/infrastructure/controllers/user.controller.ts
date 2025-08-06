/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import {
  Controller,
  Post,
  Body,
  Get,
  Inject,
  Delete,
  Param,
  Patch,
  UseGuards,
  Request,
} from '@nestjs/common';

import { CreateUserUseCase } from '../../application/use-cases/create-user.usecase';
import { CreateUserDto } from './dto/create-user.dto';
import { CreateUserCommand } from '../../application/commands/create-user.command';
import * as userRepositoryPort from '../../application/ports/out/user-repository.port';
import { DeleteUserCommand } from '../../application/commands/delete-user.command';
import { DeleteUserUseCase } from '../../application/use-cases/delete-user.usecase';
import { RsqlParser } from './rsql-parser';
import { UpdateUserCommand } from '../../application/commands/update-user.command';
import { UpdateUserUseCase } from '../../application/use-cases/update-user.usecase';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from 'src/auth/jwt.auth.guard';

@Controller('users')
export class UserController {
  constructor(
    private readonly createUserUseCase: CreateUserUseCase,
    private readonly updateUserUseCase: UpdateUserUseCase,
    private readonly deleteUserUseCase: DeleteUserUseCase,
    private readonly rsqlParser: RsqlParser,
    @Inject('UserRepositoryPort')
    private readonly userRepository: userRepositoryPort.UserRepositoryPort,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getProfile(@Request() req) {
    return req.user;
  }

  @Get()
  async findAll(
    @Param('q') query: string = '',
    @Param('page') page: number = 0,
    @Param('size') size: number = 10,
  ) {
    const mongoQuery = this.rsqlParser.parseToMongoQuery(query);
    return this.userRepository.findAll(mongoQuery, page, size);
  }

  @Post()
  async create(@Body() createUser: CreateUserDto) {
    const command: CreateUserCommand = {
      username: createUser.username,
      email: createUser.email,
    };
    const user = await this.createUserUseCase.execute(command);
    return user;
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateUser: UpdateUserDto) {
    const command: UpdateUserCommand = {
      id: id,
      username: updateUser.username,
    };
    const user = await this.updateUserUseCase.execute(command);
    return user;
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    const command: DeleteUserCommand = {
      id: id,
    };
    await this.deleteUserUseCase.execute(command);
  }
}
