import { DomainEvent } from './domain-event';

export interface RealmDeletedEvent extends DomainEvent {
  data: {
    realmId: string;
    name: string;
  };
}
