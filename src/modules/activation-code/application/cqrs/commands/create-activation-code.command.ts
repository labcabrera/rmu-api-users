export class CreateActivationCodeCommand {
  constructor(
    public readonly owner: string,
    public readonly features: import('../../../domain/aggregates/activation-code-props').ActivationFeature[],
    public readonly expiresAt?: Date,
    public readonly count: number = 1,
  ) {}
}
