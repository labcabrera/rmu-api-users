export class UpdateActivationCodeCommand {
  constructor(
    public readonly id: string,
    public readonly owner: string,
    public readonly code?: string,
    public readonly features?: string[],
    public readonly expiresAt?: Date,
    public readonly activatedAt?: Date | null,
  ) {}
}
