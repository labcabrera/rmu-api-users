export class GetFriendshipQuery {
  constructor(
    public readonly id: string,
    public readonly userId: string,
  ) {}
}
