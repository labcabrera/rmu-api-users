import { BaseAggregateRoot } from 'src/modules/shared/domain/aggregates/base-aggregate';

export interface FriendshipProps {
  id: string;
  requesterId: string;
  addresseeId: string;
  status: 'pending' | 'accepted' | 'rejected' | 'blocked';
  createdAt: Date;
  updatedAt: Date | null;
}

export class Friendship extends BaseAggregateRoot<FriendshipProps> {
  constructor(
    public readonly id: string,
    public requesterId: string,
    public addresseeId: string,
    public status: 'pending' | 'accepted' | 'rejected' | 'blocked',
    public createdAt: Date,
    public updatedAt: Date | null,
  ) {
    super(id);
  }

  static fromProps(props: FriendshipProps): Friendship {
    return new Friendship(props.id, props.requesterId, props.addresseeId, props.status, props.createdAt, props.updatedAt);
  }

  public getProps(): FriendshipProps {
    return {
      id: this.id,
      requesterId: this.requesterId,
      addresseeId: this.addresseeId,
      status: this.status,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
