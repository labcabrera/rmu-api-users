import { InvalidSearchExpression } from '../../../src/modules/shared/domain/errors/errors';
import { RsqlParser } from '../../../src/modules/shared/infrastructure/persistence/repositories/rsql-parser';
import { escapeRegex } from '../../../src/modules/user/infrastructure/db/mongo-user.repository';

describe('query hardening', () => {
  const parser = new RsqlParser();

  it('parses plain selectors', () => {
    expect(parser.parse('name==alice;id==x')).toEqual({ $and: [{ name: 'alice' }, { _id: 'x' }] });
    expect(parser.parse('settings.measurementSystem==metric')).toEqual({ 'settings.measurementSystem': 'metric' });
  });

  it('rejects operator selectors', () => {
    expect(() => parser.parse('$where==sleep(1000)')).toThrow(InvalidSearchExpression);
  });

  it('escapes regex metacharacters for the name search', () => {
    const pattern = new RegExp(`^${escapeRegex('a.*(b')}`, 'i');
    expect(pattern.test('a.*(bc')).toBe(true);
    expect(pattern.test('axxb')).toBe(false);
  });
});
