export class GetActivationCodeQuery {
  constructor(
    public readonly id: string,
    public readonly owner: string,
  ) {}
}
