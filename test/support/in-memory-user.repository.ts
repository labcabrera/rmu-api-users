import { Page } from '../../src/modules/shared/application/pagination/page';
import { ConflictError, NotFoundError } from '../../src/modules/shared/domain/errors/errors';
import { UserSummary } from '../../src/modules/user/application/models/user-summary';
import { UserRepository } from '../../src/modules/user/application/ports/user-repository.port';
import { User } from '../../src/modules/user/domain/aggregates/user';
import { UserProps } from '../../src/modules/user/domain/aggregates/user-props';

/** UserRepository backed by a Map, with the same uniqueness rules as the Mongo one (id, case-insensitive name). */
export class InMemoryUserRepository extends UserRepository {
  readonly store = new Map<string, UserProps>();
  writes = 0;

  seed(user: User): void {
    this.store.set(user.id, { ...user.getProps() });
  }

  findById(id: string): Promise<User | null> {
    const props = this.store.get(id);
    return Promise.resolve(props ? User.fromProps({ ...props }) : null);
  }

  findByName(name: string): Promise<User | null> {
    const props = [...this.store.values()].find(p => p.name.toLowerCase() === name.toLowerCase());
    return Promise.resolve(props ? User.fromProps({ ...props }) : null);
  }

  existsByName(name: string, excludeId?: string): Promise<boolean> {
    return Promise.resolve([...this.store.values()].some(p => p.id !== excludeId && p.name.toLowerCase() === name.toLowerCase()));
  }

  searchByNamePrefix(prefix: string, page: number, size: number): Promise<Page<UserSummary>> {
    const matches = [...this.store.values()]
      .filter(p => p.enabled && p.name.toLowerCase().startsWith(prefix.toLowerCase()))
      .sort((a, b) => a.name.localeCompare(b.name));
    const content = matches.slice(page * size, page * size + size).map(p => ({ id: p.id, name: p.name, imageUrl: p.imageUrl }));
    return Promise.resolve(new Page(content, page, size, matches.length));
  }

  findByRsql(_rsql: string | undefined, page: number, size: number): Promise<Page<User>> {
    const all = [...this.store.values()].map(p => User.fromProps({ ...p }));
    return Promise.resolve(new Page(all.slice(page * size, page * size + size), page, size, all.length));
  }

  save(entity: User): Promise<User> {
    const props = entity.getProps();
    if (this.store.has(props.id) || [...this.store.values()].some(p => p.name.toLowerCase() === props.name.toLowerCase())) {
      return Promise.reject(new ConflictError(`User ${props.id} or name ${props.name} already exists`));
    }
    this.writes++;
    this.store.set(props.id, { ...props });
    return Promise.resolve(User.fromProps({ ...props }));
  }

  update(id: string, entity: User): Promise<User> {
    if (!this.store.has(id)) return Promise.reject(new NotFoundError('Entity', id));
    const props = entity.getProps();
    if ([...this.store.values()].some(p => p.id !== id && p.name.toLowerCase() === props.name.toLowerCase())) {
      return Promise.reject(new ConflictError(`User name ${props.name} is already in use`));
    }
    this.writes++;
    this.store.set(id, { ...props });
    return Promise.resolve(User.fromProps({ ...props }));
  }

  updateLastLoginAt(id: string, at: Date): Promise<void> {
    const props = this.store.get(id);
    if (props) {
      this.writes++;
      props.lastLoginAt = at;
    }
    return Promise.resolve();
  }

  deleteById(id: string): Promise<User | null> {
    const props = this.store.get(id);
    this.store.delete(id);
    return Promise.resolve(props ? User.fromProps(props) : null);
  }
}
