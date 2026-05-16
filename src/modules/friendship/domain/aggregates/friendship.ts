import { BaseAggregateRoot } from 'src/modules/shared/domain/aggregates/base-aggregate';
import { FriendshipStatus } from '../value-objects/friendship-status.vo';
import { randomUUID } from 'crypto';
import { ValidationError } from 'src/modules/shared/domain/errors/errors';
import { FriendshipProps } from './friendship-props';

export class Friendship extends BaseAggregateRoot<FriendshipProps> {
  constructor(
    public readonly id: string,
    public requesterId: string,
    public requesterName: string,
    public addresseeId: string,
    public addresseeName: string,
    public status: FriendshipStatus,
    public message: string | null,
    public createdAt: Date,
    public updatedAt: Date | null,
  ) {
    super(id);
  }

  static create(props: Omit<FriendshipProps, 'id' | 'status' | 'createdAt' | 'updatedAt'>): Friendship {
    if (props.requesterId === props.addresseeName || (props.addresseeId && props.requesterId === props.addresseeId)) {
      throw new ValidationError('Requester and addressee must be different users');
    }
    return Friendship.fromProps({
      id: randomUUID(),
      requesterId: props.requesterId,
      requesterName: props.requesterName,
      addresseeId: props.addresseeId,
      addresseeName: props.addresseeName,
      status: 'pending',
      message: props.message,
      createdAt: new Date(),
      updatedAt: null,
    });
  }

  static fromProps(props: FriendshipProps): Friendship {
    return new Friendship(
      props.id,
      props.requesterId,
      props.requesterName,
      props.addresseeId,
      props.addresseeName,
      props.status,
      props.message,
      props.createdAt,
      props.updatedAt,
    );
  }

  public hasParticipant(userId: string): boolean {
    return this.requesterId === userId || this.addresseeId === userId || this.addresseeName === userId;
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
      requesterName: this.requesterName,
      addresseeId: this.addresseeId,
      addresseeName: this.addresseeName,
      status: this.status,
      message: this.message,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
