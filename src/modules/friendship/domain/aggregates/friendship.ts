import { BaseAggregateRoot } from '../../../shared/domain/aggregates/base-aggregate.js';
import { FRIENDSHIP_TRANSITIONS, type FriendshipStatus } from '../value-objects/friendship-status.vo.js';
import { randomUUID } from 'crypto';
import { ConflictError, ValidationError } from '../../../shared/domain/errors/errors.js';
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
    public requestedAt: Date | null = null,
  ) {
    super(id);
  }

  static create(props: Omit<FriendshipProps, 'id' | 'status' | 'blockedBy' | 'createdAt' | 'updatedAt' | 'requestedAt'>): Friendship {
    if (props.requesterId === props.addresseeId) {
      throw new ValidationError('Requester and addressee must be different users', 'friendship-self');
    }
    const now = new Date();
    return Friendship.fromProps({
      id: randomUUID(),
      requesterId: props.requesterId,
      requesterName: props.requesterName,
      addresseeId: props.addresseeId,
      addresseeName: props.addresseeName,
      status: 'pending',
      blockedBy: null,
      message: props.message,
      createdAt: now,
      updatedAt: null,
      requestedAt: now,
    });
  }

  /**
   * An accepted friendship made from an invite (spec 070, decision 5): the inviter consented when creating the link and
   * the invitee when accepting it. The inviter is the requester.
   */
  static fromInvite(inviter: { id: string; name: string }, invitee: { id: string; name: string }): Friendship {
    if (inviter.id === invitee.id) {
      throw new ValidationError('An invite cannot be accepted by its own inviter', 'friend-invite-self');
    }
    return Friendship.fromProps({
      id: randomUUID(),
      requesterId: inviter.id,
      requesterName: inviter.name,
      addresseeId: invitee.id,
      addresseeName: invitee.name,
      status: 'accepted',
      blockedBy: null,
      message: null,
      createdAt: new Date(),
      updatedAt: null,
      requestedAt: null,
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
      props.requestedAt ?? null,
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
    this.requestedAt = this.updatedAt;
  }

  /**
   * Accepts a pending or rejected friendship from an invite (spec 070, decision 5), with the inviter as the requester.
   * An accepted one is a ConflictError (`already-friends`), and a blocked one too (`friendship-blocked`).
   */
  public acceptInvite(inviter: { id: string; name: string }, invitee: { id: string; name: string }): void {
    if (this.status === 'accepted') throw new ConflictError('Users are already friends', 'already-friends');
    if (this.status === 'blocked') throw new ConflictError('Friendship is blocked', 'friendship-blocked');
    this.requesterId = inviter.id;
    this.requesterName = inviter.name;
    this.addresseeId = invitee.id;
    this.addresseeName = invitee.name;
    this.status = 'accepted';
    this.blockedBy = null;
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
      requestedAt: this.requestedAt,
    };
  }
}
