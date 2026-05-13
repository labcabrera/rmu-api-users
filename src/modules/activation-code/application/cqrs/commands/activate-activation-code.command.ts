export class ActivateActivationCodeCommand {
  constructor(
    public readonly code: string,
    public readonly owner: string,
  ) {}
}
