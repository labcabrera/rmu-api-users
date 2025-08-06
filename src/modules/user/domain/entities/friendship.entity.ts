export class Friendship {
  constructor(
    public readonly id: string,
    public requesterId: string,
    public addresseeId: string,
    public status: 'pending' | 'accepted' | 'rejected' | 'blocked',
    public createdAt: Date,
    public updatedAt?: Date,
  ) {}
}
