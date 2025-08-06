/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */

import { Controller, Get, Patch, Request, UseGuards } from '@nestjs/common';

import { ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/jwt.auth.guard';
import { GetUserUserSettingsUseCase } from '../../application/use-cases/get-user-settings.usecase';
import { UpdateUserUserSettingsUseCase } from '../../application/use-cases/update-settings.usecase';
import { UpdateUserSettingsCommand } from '../../application/commands/update-settings.command';

@UseGuards(JwtAuthGuard)
@Controller('user')
@ApiTags('User')
export class UserController {
  constructor(
    private readonly getUserSettingsUseCase: GetUserUserSettingsUseCase,
    private readonly updateUserSettingsUseCase: UpdateUserUserSettingsUseCase,
  ) {}

  @Get('')
  getUser(@Request() req) {
    return req.user;
  }

  @Get('settings')
  getSettings(@Request() req) {
    const userId = req.user!.id as string;
    if (!userId) {
      throw new Error('User not authenticated');
    }
    return this.getUserSettingsUseCase.execute(userId);
  }

  @Patch('settings')
  updateSettings(@Request() req) {
    const userId = req.user!.id as string;
    if (!userId) {
      throw new Error('User not authenticated');
    }
    const command: UpdateUserSettingsCommand = {
      ...req.body,
      id: userId,
    };
    return this.updateUserSettingsUseCase.execute(command);
  }
}
