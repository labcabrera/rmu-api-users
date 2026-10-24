import type { Mock } from 'vitest';
import { ActivateActivationCodeHandler } from '../../../../../../src/modules/activation-code/application/cqrs/handlers/activate-activation-code.handler';
import { CheckActivationCodeHandler } from '../../../../../../src/modules/activation-code/application/cqrs/handlers/check-activation-code.handler';
import { ActivateActivationCodeCommand } from '../../../../../../src/modules/activation-code/application/cqrs/commands/activate-activation-code.command';
import { CheckActivationCodeQuery } from '../../../../../../src/modules/activation-code/application/cqrs/queries/check-activation-code.query';
import { ActivationCodeRepository } from '../../../../../../src/modules/activation-code/application/ports/activation-code.repository';
import { ActivationCode } from '../../../../../../src/modules/activation-code/domain/aggregates/activation-code';
import { ActivationCodeProps } from '../../../../../../src/modules/activation-code/domain/aggregates/activation-code-props';
import { ConflictError, NotFoundError, ValidationError } from '../../../../../../src/modules/shared/domain/errors/errors';
import { IamUserPort } from '../../../../../../src/modules/user/application/ports/iam-user.port';
import { User } from '../../../../../../src/modules/user/domain/aggregates/user';
import { UserSettings } from '../../../../../../src/modules/user/domain/value-objects/user-settings.vo';
import { InMemoryUserRepository } from '../../../../../support/in-memory-user.repository';

/** Minimal repository with the same atomic claim semantics as the Mongo one. */
class InMemoryActivationCodeRepository {
  readonly store = new Map<string, ActivationCodeProps>();

  add(code: ActivationCode) {
    this.store.set(code.id, code.getProps());
  }

  findByCode(code: string) {
    const props = [...this.store.values()].find(p => p.code === code);
    return Promise.resolve(props ? ActivationCode.fromProps({ ...props }) : null);
  }

  markActivated(id: string, userId: string, at: Date) {
    const props = this.store.get(id);
    if (!props || props.activatedAt || props.activatedBy) return Promise.resolve(null);
    props.activatedAt = at;
    props.activatedBy = userId;
    return Promise.resolve(ActivationCode.fromProps({ ...props }));
  }

  clearActivation(id: string, userId: string) {
    const props = this.store.get(id);
    if (props && props.activatedBy === userId) {
      props.activatedAt = null;
      props.activatedBy = null;
    }
    return Promise.resolve();
  }
}

describe('activation codes', () => {
  let codes: InMemoryActivationCodeRepository;
  let users: InMemoryUserRepository;
  let iam: { findGroups: Mock; addUserToGroup: Mock };
  let handler: ActivateActivationCodeHandler;
  let code: ActivationCode;

  beforeEach(() => {
    codes = new InMemoryActivationCodeRepository();
    users = new InMemoryUserRepository();
    for (const id of ['user-1', 'user-2']) {
      users.seed(
        User.create({
          id,
          name: id,
          email: `${id}@example.com`,
          emailVerified: true,
          enabled: true,
          features: [],
          imageUrl: null,
          settings: UserSettings.default(),
        }),
      );
    }
    code = ActivationCode.create({ code: 'ABCD1234', owner: 'admin', features: ['core-law', 'spell-law'] });
    codes.add(code);
    iam = {
      findGroups: vi.fn<() => Promise<{ id: string; name: string }[]>>().mockResolvedValue([
        { id: 'g1', name: 'core-law' },
        { id: 'g2', name: 'spell-law' },
      ]),
      addUserToGroup: vi.fn<() => Promise<void>>().mockResolvedValue(undefined),
    };
    handler = new ActivateActivationCodeHandler(codes as unknown as ActivationCodeRepository, users, iam as unknown as IamUserPort);
  });

  it('activates a code once and records who used it and when', async () => {
    const result = await handler.execute(new ActivateActivationCodeCommand('ABCD1234', 'user-1', []));

    expect(result.activatedBy).toBe('user-1');
    expect(result.activatedAt).toBeInstanceOf(Date);
    expect(codes.store.get(code.id)!.activatedBy).toBe('user-1');
    expect(iam.addUserToGroup).toHaveBeenCalledWith('user-1', 'g1');
    expect(iam.addUserToGroup).toHaveBeenCalledWith('user-1', 'g2');
  });

  it('rejects a code that was already used, by the same or another user', async () => {
    await handler.execute(new ActivateActivationCodeCommand('ABCD1234', 'user-1', []));
    iam.addUserToGroup.mockClear();

    await expect(handler.execute(new ActivateActivationCodeCommand('ABCD1234', 'user-2', []))).rejects.toBeInstanceOf(ConflictError);
    await expect(handler.execute(new ActivateActivationCodeCommand('ABCD1234', 'user-1', []))).rejects.toBeInstanceOf(ConflictError);
    expect(iam.addUserToGroup).not.toHaveBeenCalled();
    expect(codes.store.get(code.id)!.activatedBy).toBe('user-1');
  });

  it('lets only one of two concurrent activations win', async () => {
    const results = await Promise.allSettled([
      handler.execute(new ActivateActivationCodeCommand('ABCD1234', 'user-1', [])),
      handler.execute(new ActivateActivationCodeCommand('ABCD1234', 'user-2', [])),
    ]);
    expect(results.filter(r => r.status === 'fulfilled')).toHaveLength(1);
    expect(results.filter(r => r.status === 'rejected')).toHaveLength(1);
  });

  it('releases the code when the group assignment fails', async () => {
    iam.addUserToGroup.mockRejectedValueOnce(new Error('keycloak down'));

    await expect(handler.execute(new ActivateActivationCodeCommand('ABCD1234', 'user-1', []))).rejects.toThrow('keycloak down');
    expect(codes.store.get(code.id)!.activatedBy).toBeNull();
  });

  it('rejects unknown and expired codes', async () => {
    await expect(handler.execute(new ActivateActivationCodeCommand('NOPE', 'user-1', []))).rejects.toBeInstanceOf(NotFoundError);
    codes.add(ActivationCode.create({ code: 'OLD1', owner: 'admin', features: [], expiresAt: new Date(Date.now() - 1000) }));
    await expect(handler.execute(new ActivateActivationCodeCommand('OLD1', 'user-1', []))).rejects.toBeInstanceOf(ValidationError);
  });

  it('check uses an exact lookup and reports used codes', async () => {
    const findByCode = vi.spyOn(codes, 'findByCode');
    const check = new CheckActivationCodeHandler(codes as unknown as ActivationCodeRepository);

    await expect(check.execute(new CheckActivationCodeQuery('ABCD1234'))).resolves.toBeInstanceOf(ActivationCode);
    expect(findByCode).toHaveBeenCalledWith('ABCD1234');
    await expect(check.execute(new CheckActivationCodeQuery('ABCD1234;code!=x'))).rejects.toBeInstanceOf(ValidationError);

    await handler.execute(new ActivateActivationCodeCommand('ABCD1234', 'user-1', []));
    await expect(check.execute(new CheckActivationCodeQuery('ABCD1234'))).rejects.toBeInstanceOf(ConflictError);
  });
});
