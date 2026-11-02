import { ForbiddenError } from '../../../../../../src/modules/shared/domain/errors/errors.js';
import { GetUsersHandler } from '../../../../../../src/modules/user/application/cqrs/handlers/get-users.handler.js';
import { GetUsersQuery } from '../../../../../../src/modules/user/application/cqrs/queries/get-users.query.js';
import { User } from '../../../../../../src/modules/user/domain/aggregates/user.js';
import { UserSettings } from '../../../../../../src/modules/user/domain/value-objects/user-settings.vo.js';
import { InMemoryUserRepository } from '../../../../../support/in-memory-user.repository.js';

const user = (id: string, name: string) =>
  User.create({
    id,
    name,
    email: `${id}@example.com`,
    emailVerified: true,
    enabled: true,
    features: [],
    imageUrl: `images/${id}.png`,
    settings: UserSettings.default(),
  });

describe('user queries', () => {
  let repository: InMemoryUserRepository;

  beforeEach(() => {
    repository = new InMemoryUserRepository();
    ['alice', 'Alicia', 'bob', 'malice'].forEach((name, i) => repository.seed(user(`u${i}`, name)));
  });

  it('listing users is reserved to rmu-admin', async () => {
    const handler = new GetUsersHandler(repository);
    await expect(handler.execute(new GetUsersQuery(undefined, 0, 10, 'u2', ['rmu-user']))).rejects.toBeInstanceOf(ForbiddenError);
    const page = await handler.execute(new GetUsersQuery(undefined, 0, 10, 'u0', ['rmu-admin']));
    expect(page.content).toHaveLength(4);
  });
});
