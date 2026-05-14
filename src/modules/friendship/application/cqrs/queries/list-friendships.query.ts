export class ListFriendshipsQuery {
  constructor(
    public readonly userId: string,
    public readonly q: string | undefined,
    public readonly page: number,
    public readonly size: number,
  ) {}
}
