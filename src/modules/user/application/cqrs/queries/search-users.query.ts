export class SearchUsersQuery {
  constructor(
    public readonly term: string | undefined,
    public readonly page: number,
    public readonly size: number,
  ) {}
}
