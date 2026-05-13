import { Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ConflictError } from 'src/modules/shared/domain/errors/errors';
import { ActivationCode } from '../../../domain/aggregates/activation-code';
import type { ActivationCodeRepository } from '../../ports/activation-code.repository';
import { CreateActivationCodeCommand } from '../commands/create-activation-code.command';

@CommandHandler(CreateActivationCodeCommand)
export class CreateActivationCodeHandler implements ICommandHandler<CreateActivationCodeCommand, ActivationCode[]> {
  constructor(
    @Inject('ActivationCodeRepository') private readonly activationCodeRepository: ActivationCodeRepository,
    private readonly configService: ConfigService,
  ) {}

  async execute(command: CreateActivationCodeCommand): Promise<ActivationCode[]> {
    const size = this.configService.get<number>('RMU_ACTIVATION_CODE_SIZE', 8);
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const generateCode = (len: number) => {
      let s = '';
      for (let i = 0; i < len; i++) {
        s += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return s;
    };
    const results: ActivationCode[] = [];
    const used = new Set<string>();
    const maxAttempts = 10;
    const count = Math.max(1, Math.min(1000, command.count ?? 1));

    for (let i = 0; i < count; i++) {
      let code: string | undefined;
      let existing;
      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        code = generateCode(size);
        if (used.has(code)) continue;
        existing = await this.activationCodeRepository.findByCode(code, command.owner);
        if (!existing) break;
      }
      if (existing) {
        throw new ConflictError(`Could not generate unique activation code after ${maxAttempts} attempts`);
      }
      used.add(code!);
      const activationCode = ActivationCode.create({
        code: code!,
        owner: command.owner,
        features: command.features,
        expiresAt: command.expiresAt,
      });
      const saved = await this.activationCodeRepository.save(activationCode);
      results.push(saved);
    }

    return results;
  }
}
