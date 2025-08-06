/* eslint-disable @typescript-eslint/no-unsafe-call */

import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';

@Controller()
export class KafkaConsumerController {
  @MessagePattern('internal.rmu-users.user.created.v1')
  handleUserCreated(@Payload() message: any) {
    console.log(
      'Received user created event:',
      JSON.stringify(message, null, 2),
    );
  }

  @MessagePattern('internal.rmu-users.user.updated.v1')
  handleUserUpdated(@Payload() message: any) {
    console.log(
      'Received user updated event:',
      JSON.stringify(message, null, 2),
    );
  }

  @MessagePattern('internal.rmu-users.user.deleted.v1')
  handleUserDeleted(@Payload() message: any) {
    console.log(
      'Received user deleted event:',
      JSON.stringify(message, null, 2),
    );
  }
}
