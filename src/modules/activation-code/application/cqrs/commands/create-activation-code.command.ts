export class CreateActivationCodeCommand {
  constructor(
    public readonly code: string,
    public readonly owner: string,
    public readonly features: string[],
    public readonly expiresAt: Date,
  ) {}
}
