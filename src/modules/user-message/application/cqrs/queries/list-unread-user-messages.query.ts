export class ListUnreadUserMessagesQuery {
  constructor(
    public readonly userId: string,
    public readonly page: number,
    public readonly size: number,
  ) {}
}
