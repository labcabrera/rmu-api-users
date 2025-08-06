/* eslint-disable @typescript-eslint/no-unsafe-call */

import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { UnsetDeletedRealmUseCase } from '../../application/use-cases/unset-deleted-realm.usecase';

@Controller()
export class KafkaConsumerController {
  private readonly logger = new Logger(KafkaConsumerController.name);

  constructor(private unsetDeletedRealmUseCase: UnsetDeletedRealmUseCase) {}

  @MessagePattern('internal.rmu-core.realm.deleted.v1')
  async handleRealmDeleted(@Payload() message: any) {
    this.logger.debug('Received realm deleted event:', JSON.stringify(message, null, 2));
    await this.unsetDeletedRealmUseCase.execute(message.data.id);
  }
}
