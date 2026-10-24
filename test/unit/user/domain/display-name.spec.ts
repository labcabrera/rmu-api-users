import {
  deriveBaseDisplayName,
  displayNameCandidate,
  sanitizeDisplayName,
} from '../../../../src/modules/user/domain/services/display-name';

describe('display name', () => {
  it('sanitizes raw values', () => {
    expect(sanitizeDisplayName('José María')).toBe('jose-maria');
    expect(sanitizeDisplayName('..a$$b..')).toBe('a-b');
    expect(sanitizeDisplayName('')).toBe('user');
    expect(sanitizeDisplayName('ab')).toBe('ab-user');
    expect(sanitizeDisplayName('x'.repeat(50))).toHaveLength(32);
  });

  it('uses the username for local accounts and the email local part otherwise', () => {
    expect(deriveBaseDisplayName('alice', 'a@example.com', 'local')).toBe('alice');
    expect(deriveBaseDisplayName('alice@example.com', 'alice@example.com', 'local')).toBe('alice');
    expect(deriveBaseDisplayName('someone@gmail.com', 'Some.One@gmail.com', 'google')).toBe('some.one');
    expect(deriveBaseDisplayName(undefined, undefined, 'local')).toBe('user');
  });

  it('builds suffixed candidates within the maximum length', () => {
    expect(displayNameCandidate('alice', 1)).toBe('alice');
    expect(displayNameCandidate('alice', 2)).toBe('alice-2');
    expect(displayNameCandidate('x'.repeat(32), 12)).toBe(`${'x'.repeat(29)}-12`);
  });
});
