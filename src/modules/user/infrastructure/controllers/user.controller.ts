/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Controller, Get, Request, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/modules/auth/jwt.auth.guard';
// import { FriendshipRequestUseCase } from '../../application/cqrs/handlers/friendship-request.usecase';
// import { FriendshipRequestCommand } from '../../application/cqrs/commands/create-friendship-request.command';

@UseGuards(JwtAuthGuard)
@Controller('user')
@ApiTags('User')
export class UserController {
  // constructor(private readonly requestFriendUseCase: FriendshipRequestUseCase) {}

  @Get('')
  getUser(@Request() req) {
    return req.user;
  }

  // @Get('settings')
  // getSettings(@Request() req) {
  //   const userId = req.user!.id as string;
  //   if (!userId) {
  //     throw new Error('User not authenticated');
  //   }
  //   return this.getUserSettingsUseCase.execute(userId);
  // }

  // @Patch('settings')
  // updateSettings(@Request() req) {
  //   const userId = req.user!.id as string;
  //   if (!userId) {
  //     throw new Error('User not authenticated');
  //   }
  //   const command: UpdateUserSettingsCommand = {
  //     ...req.body,
  //     id: userId,
  //   };
  //   return this.updateUserSettingsUseCase.execute(command);
  // }

  // @Post('friends')
  // requestFriend(@Request() req) {
  //   const userId = req.user!.id as string;
  //   const roles = req.user!.roles as string[];
  //   const command = new FriendshipRequestCommand(req.body.friendEmail, req.body.message, userId, roles);
  //   this.requestFriendUseCase.execute(command);
  //   return { message: 'Friend request sent successfully' };
  // }
}
