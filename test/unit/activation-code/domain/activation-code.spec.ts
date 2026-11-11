import { ActivationCode } from '../../../../src/modules/activation-code/domain/aggregates/activation-code.js';

const used = () => {
  const code = ActivationCode.create({ code: 'ABCD1234', owner: 'admin', features: ['core-law'] });
  code.activate('u-1', new Date('2026-01-01T00:00:00Z'));
  return code;
};

describe('ActivationCode.update', () => {
  it('releases the code when the activation date is cleared [F-users-12]', () => {
    const code = used();
    code.update({ activatedAt: null });
    expect(code).toMatchObject({ activatedAt: null, activatedBy: null });
    expect(code.isUsed()).toBe(false);
  });

  it('keeps the user when the activation date changes', () => {
    const code = used();
    code.update({ activatedAt: new Date('2026-02-01T00:00:00Z') });
    expect(code.activatedBy).toBe('u-1');
    code.update({ features: ['spell-law'] });
    expect(code).toMatchObject({ activatedBy: 'u-1', features: ['spell-law'] });
  });
});
