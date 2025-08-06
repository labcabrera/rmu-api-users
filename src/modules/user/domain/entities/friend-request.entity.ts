export class User {
  constructor(
    public readonly id: string,
    public sourceId: string,
    public targetId: string,
    public status: 'pending' | 'accepted' | 'rejected',
  ) {}
}
