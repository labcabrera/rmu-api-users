export class ListActivationCodesQuery {
  constructor(
    public readonly owner: string,
    public readonly q: string | undefined,
    public readonly page: number,
    public readonly size: number,
  ) {}
}
