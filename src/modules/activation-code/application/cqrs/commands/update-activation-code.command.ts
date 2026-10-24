export class UpdateActivationCodeCommand {
  constructor(
    public readonly id: string,
    public readonly owner: string,
    public readonly code?: string,
    public readonly features?: import('../../../domain/aggregates/activation-code-props.js').ActivationFeature[],
    public readonly expiresAt?: Date,
    public readonly activatedAt?: Date | null,
    /** Version the client read; a different stored version is a ConflictError (`version-conflict`). */
    public readonly expectedVersion?: number,
  ) {}
}
