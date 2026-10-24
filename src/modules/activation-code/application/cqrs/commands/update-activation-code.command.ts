import { AuthenticatedCommand } from '../../../../shared/application/cqrs/authenticated-command.js';
import type { ActivationFeature } from '../../../domain/aggregates/activation-code-props.js';

export class UpdateActivationCodeCommand extends AuthenticatedCommand {
  constructor(
    public readonly id: string,
    userId: string,
    roles: string[],
    public readonly code?: string,
    public readonly features?: ActivationFeature[],
    public readonly expiresAt?: Date,
    public readonly activatedAt?: Date | null,
    /** Version the client read; a different stored version is a ConflictError (`version-conflict`). */
    public readonly expectedVersion?: number,
  ) {
    super(userId, roles);
  }
}
