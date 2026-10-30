import { Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { randomInt } from 'crypto';
import { ConflictError } from '../../../../shared/domain/errors/errors.js';
import { ActivationCode } from '../../../domain/aggregates/activation-code.js';
import { MAX_CODES_PER_REQUEST } from '../../../domain/aggregates/activation-code-props.js';
import { type ActivationCodeRepository, ACTIVATION_CODE_REPOSITORY } from '../../ports/activation-code-repository.port.js';
import { CreateActivationCodeCommand } from '../commands/create-activation-code.command.js';
import { ActivationCodeGuardAdapter } from '../../../infrastructure/security/activation-code-guard.adapter.js';

const CODE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const MAX_ATTEMPTS = 10;

/** A random code of `length` characters from a cryptographic source (F-users-15): codes grant access to content. */
export function generateActivationCode(length: number): string {
  let code = '';
  for (let i = 0; i < length; i++) code += CODE_CHARS.charAt(randomInt(CODE_CHARS.length));
  return code;
}

const isDuplicateKey = (err: unknown) => err instanceof ConflictError && err.code === 'duplicate-key';

@CommandHandler(CreateActivationCodeCommand)
export class CreateActivationCodeHandler implements ICommandHandler<CreateActivationCodeCommand, ActivationCode[]> {
  constructor(
    @Inject(ACTIVATION_CODE_REPOSITORY) private readonly activationCodeRepository: ActivationCodeRepository,
    private readonly configService: ConfigService,
    @Inject(ActivationCodeGuardAdapter) private readonly guard: ActivationCodeGuardAdapter,
  ) {}

  async execute(command: CreateActivationCodeCommand): Promise<ActivationCode[]> {
    this.guard.checkCreate(command.roles);
    const size = this.configService.get<number>('RMU_USERS_ACTIVATION_CODE_SIZE', 8);
    // The DTO already limits the count; the same constant keeps a direct caller within it.
    const count = Math.max(1, Math.min(MAX_CODES_PER_REQUEST, command.count ?? 1));
    const results: ActivationCode[] = [];
    for (let i = 0; i < count; i++) {
      results.push(await this.createOne(command, size));
    }
    return results;
  }

  /** Saves a code with a fresh value; the unique index decides, so a value taken meanwhile is retried. */
  private async createOne(command: CreateActivationCodeCommand, size: number): Promise<ActivationCode> {
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      const activationCode = ActivationCode.create({
        code: generateActivationCode(size),
        owner: command.owner,
        features: command.features,
        expiresAt: command.expiresAt,
        note: command.note,
      });
      try {
        return await this.activationCodeRepository.save(activationCode);
      } catch (err) {
        if (!isDuplicateKey(err)) throw err;
      }
    }
    throw new ConflictError(`Could not generate unique activation code after ${MAX_ATTEMPTS} attempts`);
  }
}
