import { Controller, Logger } from '@nestjs/common';
import { Ctx, EventPattern, KafkaContext, Payload } from '@nestjs/microservices';
import { DomainEvent } from 'src/modules/shared/domain/events/domain-event';
import { UserProps } from '../../domain/aggregates/user';

@Controller()
export class KafkaUserEventConsumer {
  private readonly logger = new Logger(KafkaUserEventConsumer.name);

  // constructor(private readonly commandBus: CommandBus) {}

  @EventPattern('internal.rmu-core.realm.updated.v1')
  handleUserUpdated(@Payload() event: DomainEvent<UserProps>, @Ctx() context: KafkaContext) {
    this.logger.log(`Received user ${event.data.id} updated event from ${context.getTopic()}`);
  }

  @EventPattern('internal.rmu-core.realm.deleted.v1')
  handleUserDeleted(@Payload() event: DomainEvent<UserProps>, @Ctx() context: KafkaContext) {
    this.logger.log(`Received user ${event.data.id} deleted event from ${context.getTopic()}`);
  }
}
