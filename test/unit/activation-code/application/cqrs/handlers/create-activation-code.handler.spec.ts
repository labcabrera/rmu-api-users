import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { vi } from 'vitest';
import { CreateActivationCodeCommand } from '../../../../../../src/modules/activation-code/application/cqrs/commands/create-activation-code.command.js';
import {
  CreateActivationCodeHandler,
  generateActivationCode,
} from '../../../../../../src/modules/activation-code/application/cqrs/handlers/create-activation-code.handler.js';
import type { ActivationCodeRepository } from '../../../../../../src/modules/activation-code/application/ports/activation-code-repository.port.js';
import type { ActivationCode } from '../../../../../../src/modules/activation-code/domain/aggregates/activation-code.js';
import { ActivationCodeGuardAdapter } from '../../../../../../src/modules/activation-code/infrastructure/security/activation-code-guard.adapter.js';
import { ConflictError } from '../../../../../../src/modules/shared/domain/errors/errors.js';

vi.mock('crypto', async importOriginal => {
  const actual = await importOriginal<typeof import('crypto')>();
  return { ...actual, randomInt: vi.fn(actual.randomInt) };
});

/** Stores codes and rejects a taken value with the duplicate-key ConflictError, as the unique index does. */
const repository = (taken: string[] = []) => {
  const values = new Set(taken);
  const save = vi.fn((code: ActivationCode) => {
    if (values.has(code.code)) return Promise.reject(new ConflictError(`${code.id} already exists`, 'duplicate-key'));
    values.add(code.code);
    return Promise.resolve(code);
  });
  return { repo: { save } as unknown as ActivationCodeRepository, save };
};

const handler = (repo: ActivationCodeRepository) =>
  new CreateActivationCodeHandler(repo, new ConfigService({ RMU_USERS_ACTIVATION_CODE_SIZE: 6 }), new ActivationCodeGuardAdapter());

const command = (count?: number) => new CreateActivationCodeCommand('admin', ['rmu-admin'], ['core-law'], undefined, count);

describe('CreateActivationCodeHandler', () => {
  it('generates the codes with crypto.randomInt [F-users-15]', () => {
    vi.mocked(crypto.randomInt).mockClear();
    expect(generateActivationCode(8)).toMatch(/^[A-Z0-9]{8}$/);
    expect(crypto.randomInt).toHaveBeenCalledTimes(8);
  });

  it('caps a direct call at the limit of the DTO, 100 codes [F-users-15]', async () => {
    expect(await handler(repository().repo).execute(command(1000))).toHaveLength(100);
  });

  it('retries a value that the unique index rejects', async () => {
    const randomInt = vi.mocked(crypto.randomInt) as unknown as { mockReturnValueOnce: (v: number) => unknown };
    for (let i = 0; i < 6; i++) randomInt.mockReturnValueOnce(0);
    const { repo, save } = repository(['AAAAAA']);
    const [code] = await handler(repo).execute(command());
    expect(save).toHaveBeenCalledTimes(2);
    expect(code.code).not.toBe('AAAAAA');
  });

  it('gives up after ten taken values', async () => {
    const { repo, save } = repository();
    save.mockRejectedValue(new ConflictError('taken', 'duplicate-key'));
    await expect(handler(repo).execute(command())).rejects.toThrow('Could not generate unique activation code after 10 attempts');
  });

  it('is forbidden without rmu-admin', async () => {
    const forbidden = new CreateActivationCodeCommand('u', ['rmu-user'], ['core-law']);
    await expect(handler(repository().repo).execute(forbidden)).rejects.toMatchObject({ statusCode: 403 });
  });
});
