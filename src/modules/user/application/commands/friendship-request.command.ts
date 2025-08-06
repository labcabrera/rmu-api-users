export class FriendshipRequestCommand {
  constructor(
    public userId: string,
    public friendEmail: string,
    public message?: string,
  ) {}
}
