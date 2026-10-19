import { DomainEvent } from 'src/modules/shared/domain/events/domain-event';
import { UserProps } from '../aggregates/user-props';

export type UserEventData = Omit<UserProps, 'claimsFingerprint'>;

function toEventData(props: UserProps): UserEventData {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { claimsFingerprint, ...data } = props;
  return data;
}

export class UserCreatedEvent extends DomainEvent<UserEventData> {
  constructor(data: UserProps) {
    super('created', toEventData(data));
  }
}

export class UserUpdatedEvent extends DomainEvent<UserEventData> {
  constructor(data: UserProps) {
    super('updated', toEventData(data));
  }
}

export class UserDeletedEvent extends DomainEvent<UserEventData> {
  constructor(data: UserProps) {
    super('deleted', toEventData(data));
  }
}
