import { Injectable, Logger } from '@nestjs/common';
import { DomainEvent } from 'src/modules/shared/domain/events/domain-event';
import { KafkaProducerService } from 'src/modules/shared/infrastructure/messaging/kafka-producer.service';
import { UserEventBusPort } from '../../application/ports/user-event-bus.port';
import { UserEventData } from '../../domain/events/user-events';

@Injectable()
export class KafkaUserEventBusAdapter extends UserEventBusPort {
  private readonly logger = new Logger(KafkaUserEventBusAdapter.name);

  constructor(private readonly kafkaProducerService: KafkaProducerService) {
    super();
  }

  publish(event: DomainEvent<UserEventData>): void {
    const topic = `internal.rmu-users.user.${event.eventType}.v1`;
    this.kafkaProducerService.emit(topic, event).catch(err => {
      this.logger.error(`Error publishing ${event.eventType} event for user ${event.data.id} to ${topic}`, err);
    });
  }
}
