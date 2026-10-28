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
    public blockedBy: string | null,
    public message: string | null,
    public createdAt: Date,
    public updatedAt: Date | null,
  ) {
    super(id);
  }

  static create(props: Omit<FriendshipProps, 'id' | 'status' | 'blockedBy' | 'createdAt' | 'updatedAt'>): Friendship {
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
      blockedBy: null,
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
      props.blockedBy ?? null,
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
   * a ValidationError (`invalid-status-transition`). Moving to blocked records `by` as `blockedBy` (spec 044, decision 9).
   */
  public update(props: { status?: FriendshipStatus; message?: string | null }, by?: string): void {
    if (props.status !== undefined && props.status !== this.status) {
      if (!FRIENDSHIP_TRANSITIONS[this.status].includes(props.status)) {
        throw new ValidationError(`A ${this.status} friendship cannot become ${props.status}`, 'invalid-status-transition');
      }
      if (props.status === 'blocked') {
        if (!by || !this.hasParticipant(by)) throw new ValidationError('A friendship is blocked by one of its participants');
        this.blockedBy = by;
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
    this.blockedBy = null;
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
      blockedBy: this.blockedBy,
      message: this.message,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
