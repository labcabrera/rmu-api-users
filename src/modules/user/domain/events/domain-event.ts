export interface DomainEvent {
  eventType: string;
  eventVersion: string;
  eventTime: string;
  producer: string;
}
