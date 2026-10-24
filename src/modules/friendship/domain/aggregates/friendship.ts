import { BaseAggregateRoot } from '../../../shared/domain/aggregates/base-aggregate.js';
import { FRIENDSHIP_TRANSITIONS, type FriendshipStatus } from '../value-objects/friendship-status.vo.js';
import { randomUUID } from 'crypto';
import { ValidationError } from '../../../shared/domain/errors/errors.js';
import type { FriendshipProps } from './friendship-props.js';

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
    if (props.requesterId === props.addresseeId) {
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

  /** Participants are compared by id only (F-users-20): names change and are not unique over time. */
  public hasParticipant(userId: string): boolean {
    return this.requesterId === userId || this.addresseeId === userId;
  }

  /**
   * Changes the status along FRIENDSHIP_TRANSITIONS (F-users-16). The same status again is no change; any other move is
   * a ValidationError (`invalid-status-transition`).
   */
  public update(props: { status?: FriendshipStatus; message?: string | null }): void {
    if (props.status !== undefined && props.status !== this.status) {
      if (!FRIENDSHIP_TRANSITIONS[this.status].includes(props.status)) {
        throw new ValidationError(`A ${this.status} friendship cannot become ${props.status}`, 'invalid-status-transition');
      }
      this.status = props.status;
    }
    if (props.message !== undefined) {
      this.message = props.message;
    }
    this.updatedAt = new Date();
  }

  /**
   * A new request after a rejection reopens the friendship (F-users-17): pending again, from whoever asks now, with the
   * new message. Only a rejected friendship can be reopened.
   */
  public reopen(requester: { id: string; name: string }, addressee: { id: string; name: string }, message: string | null): void {
    if (this.status !== 'rejected') {
      throw new ValidationError(`A ${this.status} friendship cannot be reopened`, 'invalid-status-transition');
    }
    this.requesterId = requester.id;
    this.requesterName = requester.name;
    this.addresseeId = addressee.id;
    this.addresseeName = addressee.name;
    this.status = 'pending';
    this.message = message;
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
