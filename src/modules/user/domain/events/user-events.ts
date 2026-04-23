import { DomainEvent } from 'src/modules/shared/domain/events/domain-event';
import { UserProps } from '../aggregates/user';

export class UserCreatedEvent extends DomainEvent<UserProps> {
  constructor(data: UserProps) {
    super('created', data);
  }
}

export class UserUpdatedEvent extends DomainEvent<UserProps> {
  constructor(data: UserProps) {
    super('updated', data);
  }
}

export class UserDeletedEvent extends DomainEvent<UserProps> {
  constructor(data: UserProps) {
    super('deleted', data);
  }
}
