import { InvalidSearchExpression } from '../../../src/modules/shared/domain/errors/errors.js';
import { RsqlParser } from '../../../src/modules/shared/infrastructure/db/rsql-parser.js';

describe('query hardening', () => {
  const parser = new RsqlParser();

  it('parses plain selectors', () => {
    expect(parser.parse('name==alice;id==x')).toEqual({ $and: [{ name: 'alice' }, { _id: 'x' }] });
    expect(parser.parse('settings.measurementSystem==metric')).toEqual({ 'settings.measurementSystem': 'metric' });
  });

  it('rejects operator selectors', () => {
    expect(() => parser.parse('$where==sleep(1000)')).toThrow(InvalidSearchExpression);
  });
});
