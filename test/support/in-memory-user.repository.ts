import { Page } from '../../src/modules/shared/application/pagination/page.js';
import { ConflictError, NotFoundError } from '../../src/modules/shared/domain/errors/errors.js';
import type { UserSummary } from '../../src/modules/user/application/models/user-summary.js';
import { UserRepository } from '../../src/modules/user/application/ports/user-repository.port.js';
import { User } from '../../src/modules/user/domain/aggregates/user.js';
import type { UserProps } from '../../src/modules/user/domain/aggregates/user-props.js';

/**
 * UserRepository backed by a Map, with the same uniqueness rules as the Mongo one (id, case-insensitive name) and the
 * same versions (a stale update is a ConflictError `version-conflict`).
 */
export class InMemoryUserRepository extends UserRepository {
  readonly store = new Map<string, UserProps>();
  readonly versions = new Map<string, number>();
  writes = 0;

  private load(props: UserProps): User {
    return User.fromProps({ ...props }).restoreVersion(this.versions.get(props.id) ?? 0);
  }

  seed(user: User): void {
    this.store.set(user.id, { ...user.getProps() });
  }

  findById(id: string): Promise<User | null> {
    const props = this.store.get(id);
    return Promise.resolve(props ? this.load(props) : null);
  }

  findByName(name: string): Promise<User | null> {
    const props = [...this.store.values()].find(p => p.name.toLowerCase() === name.toLowerCase());
    return Promise.resolve(props ? this.load(props) : null);
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
    const all = [...this.store.values()].map(p => this.load(p));
    return Promise.resolve(new Page(all.slice(page * size, page * size + size), page, size, all.length));
  }

  save(entity: User): Promise<User> {
    const props = entity.getProps();
    if (this.store.has(props.id) || [...this.store.values()].some(p => p.name.toLowerCase() === props.name.toLowerCase())) {
      return Promise.reject(new ConflictError(`User ${props.id} or name ${props.name} already exists`, 'duplicate-key'));
    }
    this.writes++;
    this.store.set(props.id, { ...props });
    this.versions.set(props.id, 0);
    return Promise.resolve(this.load(props));
  }

  update(entity: User): Promise<User> {
    const id = entity.id;
    if (!this.store.has(id)) return Promise.reject(new NotFoundError('Entity', id));
    const version = this.versions.get(id) ?? 0;
    if (version !== entity.version) return Promise.reject(new ConflictError(`${id} changed`, 'version-conflict'));
    const props = entity.getProps();
    if ([...this.store.values()].some(p => p.id !== id && p.name.toLowerCase() === props.name.toLowerCase())) {
      return Promise.reject(new ConflictError(`User name ${props.name} is already in use`, 'duplicate-key'));
    }
    this.writes++;
    this.store.set(id, { ...props });
    this.versions.set(id, version + 1);
    entity.restoreVersion(version + 1);
    return Promise.resolve(this.load(props));
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
    return Promise.resolve(props ? this.load(props) : null);
  }
}
