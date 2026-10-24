import { DomainEvent } from '../../../shared/domain/events/domain-event';
import { UserEventData } from '../../domain/events/user-events';

export abstract class UserEventBusPort {
  /** Fire and forget: a publishing failure is logged and never fails the request. */
  abstract publish(event: DomainEvent<UserEventData>): void;
}
