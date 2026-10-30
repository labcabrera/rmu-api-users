import type { ActivationFeature } from '../../../domain/aggregates/activation-code-props.js';

export class CreateActivationCodeCommand {
  constructor(
    public readonly owner: string,
    public readonly roles: string[],
    public readonly features: ActivationFeature[],
    public readonly expiresAt?: Date,
    public readonly count: number = 1,
    public readonly note?: string,
  ) {}
}
