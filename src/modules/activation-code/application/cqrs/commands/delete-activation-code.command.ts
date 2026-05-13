export class DeleteActivationCodeCommand {
  constructor(
    public readonly id: string,
    public readonly owner: string,
  ) {}
}
