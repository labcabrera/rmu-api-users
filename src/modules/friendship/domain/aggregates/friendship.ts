import { BaseAggregateRoot } from 'src/modules/shared/domain/aggregates/base-aggregate';
import { FriendshipStatus } from '../value-objects/friendship-status.vo';
import { randomUUID } from 'crypto';
import { ValidationError } from 'src/modules/shared/domain/errors/errors';

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
    if (props.requesterId === props.addresseeId) {
      throw new ValidationError('Requester and addressee must be different users');
    }
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

  public hasParticipant(userId: string): boolean {
    return this.requesterId === userId || this.addresseeId === userId;
  }

  public update(props: { status?: FriendshipStatus; message?: string | null }): void {
    if (props.status !== undefined) {
      this.status = props.status;
    }
    if (props.message !== undefined) {
      this.message = props.message;
    }
    this.updatedAt = new Date();
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
