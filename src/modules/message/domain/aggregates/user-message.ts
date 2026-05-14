import { randomUUID } from 'crypto';
import { BaseAggregateRoot } from 'src/modules/shared/domain/aggregates/base-aggregate';
import { MessageType } from '../value-objects/message-type.vo';
import { UserMessageProps } from './user-message-props';

export class UserMessage extends BaseAggregateRoot<UserMessageProps> {
  constructor(
    public readonly id: string,
    public userId: string,
    public message: string,
    public type: MessageType,
    public readed: Date | null,
    public createdAt: Date,
    public updatedAt: Date | null,
  ) {
    super(id);
  }

  static create(props: Omit<UserMessageProps, 'id' | 'readed' | 'createdAt' | 'updatedAt'>): UserMessage {
    return UserMessage.fromProps({
      id: randomUUID(),
      userId: props.userId,
      message: props.message,
      type: props.type,
      readed: null,
      createdAt: new Date(),
      updatedAt: null,
    });
  }

  static fromProps(props: UserMessageProps): UserMessage {
    return new UserMessage(props.id, props.userId, props.message, props.type, props.readed, props.createdAt, props.updatedAt);
  }

  markAsRead(readed: Date = new Date()): void {
    this.readed = readed;
    this.updatedAt = new Date();
  }

  getProps(): UserMessageProps {
    return {
      id: this.id,
      userId: this.userId,
      message: this.message,
      type: this.type,
      readed: this.readed,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
