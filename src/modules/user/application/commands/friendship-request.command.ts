export class FriendshipRequestCommand {
  constructor(
    public userId: string,
    public addresseeEmail: string,
    public message?: string,
  ) {}
}
