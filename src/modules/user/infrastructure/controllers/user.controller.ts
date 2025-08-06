/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */

import { Controller, Get, Patch, Post, Request, UseGuards } from '@nestjs/common';

import { ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/modules/auth/jwt.auth.guard';
import { GetUserUserSettingsUseCase } from '../../application/use-cases/get-user-settings.usecase';
import { UpdateUserUserSettingsUseCase } from '../../application/use-cases/update-settings.usecase';
import { UpdateUserSettingsCommand } from '../../application/commands/update-settings.command';
import { RequestFriendUseCase } from '../../application/use-cases/request-friend.usecase';
import { RequestFriendCommand } from '../../application/commands/friend-request.command';

@UseGuards(JwtAuthGuard)
@Controller('user')
@ApiTags('User')
export class UserController {
  constructor(
    private readonly getUserSettingsUseCase: GetUserUserSettingsUseCase,
    private readonly updateUserSettingsUseCase: UpdateUserUserSettingsUseCase,
    private readonly requestFriendUseCase: RequestFriendUseCase,
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

  @Post('friends')
  requestFriend(@Request() req) {
    const userId = req.user!.id as string;
    const command = new RequestFriendCommand(userId, req.body.friendEmail, req.body.message);
    this.requestFriendUseCase.execute(command);
    return { message: 'Friend request sent successfully' };
  }
}
