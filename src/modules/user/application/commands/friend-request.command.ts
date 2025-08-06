export class RequestFriendCommand {
  constructor(
    public userId: string,
    public friendEmail: string,
    public message?: string,
  ) {}
}
