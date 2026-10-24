import { ForbiddenError } from '../../../../../../src/modules/shared/domain/errors/errors';
import { GetUsersHandler } from '../../../../../../src/modules/user/application/cqrs/handlers/list-users.handler';
import {
  SEARCH_USERS_MAX_SIZE,
  SearchUsersHandler,
} from '../../../../../../src/modules/user/application/cqrs/handlers/search-users.handler';
import { GetUsersQuery } from '../../../../../../src/modules/user/application/cqrs/queries/get-users-query';
import { SearchUsersQuery } from '../../../../../../src/modules/user/application/cqrs/queries/search-users-query';
import { User } from '../../../../../../src/modules/user/domain/aggregates/user';
import { UserSettings } from '../../../../../../src/modules/user/domain/value-objects/user-settings.vo';
import { InMemoryUserRepository } from '../../../../../support/in-memory-user.repository';

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

  it('search returns only the public projection, matching the prefix case-insensitively', async () => {
    const page = await new SearchUsersHandler(repository).execute(new SearchUsersQuery('ali', 0, 10, 'u2', []));

    expect(page.content.map(u => u.name)).toEqual(['alice', 'Alicia']);
    expect(page.pagination.totalElements).toBe(2);
    for (const summary of page.content) {
      expect(Object.keys(summary).sort()).toEqual(['id', 'imageUrl', 'name']);
    }
  });

  it('search caps the page size', async () => {
    const page = await new SearchUsersHandler(repository).execute(new SearchUsersQuery('a', 0, 500, 'u2', []));
    expect(page.pagination.size).toBe(SEARCH_USERS_MAX_SIZE);
  });

  it('listing users is reserved to rmu-admin', async () => {
    const handler = new GetUsersHandler(repository);
    await expect(handler.execute(new GetUsersQuery(undefined, 0, 10, 'u2', ['rmu-user']))).rejects.toBeInstanceOf(ForbiddenError);
    const page = await handler.execute(new GetUsersQuery(undefined, 0, 10, 'u0', ['rmu-admin']));
    expect(page.content).toHaveLength(4);
  });
});
