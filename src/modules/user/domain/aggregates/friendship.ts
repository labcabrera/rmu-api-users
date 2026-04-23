import { BaseAggregateRoot } from 'src/modules/shared/domain/aggregates/base-aggregate';
import { FriendshipStatus } from '../value-objects/friendship-status.vo';
import { randomUUID } from 'crypto';

export interface FriendshipProps {
  id: string;
  requesterId: string;
  addresseeId: string;
  status: FriendshipStatus;
  message: string | null;
  createdAt: Date;
  updatedAt: Date | null;
}

export class Friendship extends BaseAggregateRoot<FriendshipProps> {
  constructor(
    public readonly id: string,
    public requesterId: string,
    public addresseeId: string,
    public status: FriendshipStatus,
    public message: string | null,
    public createdAt: Date,
    public updatedAt: Date | null,
  ) {
    super(id);
  }

  static create(props: Omit<FriendshipProps, 'id' | 'status' | 'createdAt' | 'updatedAt'>): Friendship {
    return Friendship.fromProps({
      id: randomUUID(),
      requesterId: props.requesterId,
      addresseeId: props.addresseeId,
      status: 'pending',
      message: props.message,
      createdAt: new Date(),
      updatedAt: null,
    });
  }

  static fromProps(props: FriendshipProps): Friendship {
    return new Friendship(props.id, props.requesterId, props.addresseeId, props.status, props.message, props.createdAt, props.updatedAt);
  }

  public getProps(): FriendshipProps {
    return {
      id: this.id,
      requesterId: this.requesterId,
      addresseeId: this.addresseeId,
      status: this.status,
      message: this.message,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
