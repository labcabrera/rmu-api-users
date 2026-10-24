import { Inject, Injectable, Logger } from '@nestjs/common';
import { createHash, randomBytes } from 'crypto';
import { ConflictError } from '../../../shared/domain/errors/errors';
import { User } from '../../domain/aggregates/user';
import { UserCreatedEvent, UserUpdatedEvent } from '../../domain/events/user-events';
import { deriveBaseDisplayName, displayNameCandidate, looksLikeEmail } from '../../domain/services/display-name';
import { UserSettings } from '../../domain/value-objects/user-settings.vo';
import { UserClaims } from '../models/user-claims';
import { IamUserPort, UserApiResponse } from '../ports/iam-user.port';
import { DOMAIN_EVENT_PUBLISHER, type DomainEventPublisher } from '../../../shared/application/ports/domain-event-publisher.port';
import { UserRepository } from '../ports/user-repository.port';

/** `lastLoginAt` is written at most once per this interval when the claims did not change. */
export const LAST_LOGIN_REFRESH_MS = 60 * 60 * 1000;
const MAX_NAME_ATTEMPTS = 100;
const MAX_SAVE_ATTEMPTS = 3;

/**
 * Keeps the RMU profiles in step with Keycloak: from the token claims on GET /me (no admin call), and from the admin
 * representation only for users that never logged into RMU.
 */
@Injectable()
export class UserProvisioningService {
  private readonly logger = new Logger(UserProvisioningService.name);

  constructor(
    @Inject(UserRepository) private readonly userRepository: UserRepository,
    @Inject(IamUserPort) private readonly iamUserPort: IamUserPort,
    @Inject(DOMAIN_EVENT_PUBLISHER) private readonly events: DomainEventPublisher,
  ) {}

  static fingerprint(claims: UserClaims): string {
    const relevant = [
      claims.email ?? null,
      claims.emailVerified,
      claims.username ?? null,
      claims.givenName ?? null,
      claims.familyName ?? null,
      [...claims.groups].sort(),
      claims.identityProvider,
    ];
    return createHash('sha256').update(JSON.stringify(relevant)).digest('hex');
  }

  /** GET /me: one read by id; a write only when the claims changed or `lastLoginAt` is older than one hour. */
  async provisionFromClaims(claims: UserClaims, now: Date = new Date()): Promise<User> {
    const existing = await this.userRepository.findById(claims.id);
    if (!existing) {
      return this.createFromClaims(claims, now);
    }
    const fingerprint = UserProvisioningService.fingerprint(claims);
    if (existing.claimsFingerprint !== fingerprint) {
      existing.update({
        email: claims.email ?? existing.email,
        emailVerified: claims.emailVerified,
        features: claims.groups,
        identityProvider: claims.identityProvider,
        firstName: claims.givenName ?? null,
        lastName: claims.familyName ?? null,
        claimsFingerprint: fingerprint,
        lastLoginAt: now,
      });
      const updated = await this.userRepository.update(existing.id, existing);
      this.logger.log(`Profile ${existing.id} updated from token claims`);
      void this.events.publish('user', new UserUpdatedEvent(updated.getProps()));
      return updated;
    }
    if (!existing.lastLoginAt || now.getTime() - existing.lastLoginAt.getTime() >= LAST_LOGIN_REFRESH_MS) {
      await this.userRepository.updateLastLoginAt(existing.id, now);
      existing.touchLogin(now);
    }
    return existing;
  }

  /**
   * Resolves a user referenced by display name. When no profile has that name, falls back to the Keycloak admin API
   * (exact username, or exact email when the input looks like one) and provisions the profile.
   */
  async findOrProvisionByName(name: string): Promise<User | null> {
    const local = await this.userRepository.findByName(name);
    if (local) return local;

    let iamUser = await this.iamUserPort.findByUsername(name);
    if (!iamUser && looksLikeEmail(name)) {
      iamUser = await this.iamUserPort.findByEmail(name);
    }
    if (!iamUser || !iamUser.enabled) {
      return null;
    }
    const existing = await this.userRepository.findById(iamUser.id);
    if (existing) return existing;
    this.logger.log(`Provisioning profile ${iamUser.id} from the Keycloak admin API`);
    return this.createFromIam(iamUser);
  }

  /** Unique display name starting at `base`, with `-2`, `-3`... on collision. */
  async resolveUniqueName(base: string, excludeId?: string): Promise<string> {
    for (let attempt = 1; attempt <= MAX_NAME_ATTEMPTS; attempt++) {
      const candidate = displayNameCandidate(base, attempt);
      if (!(await this.userRepository.existsByName(candidate, excludeId))) {
        return candidate;
      }
    }
    return displayNameCandidate(base, Number.parseInt(randomBytes(3).toString('hex'), 16));
  }

  private async createFromClaims(claims: UserClaims, now: Date): Promise<User> {
    const base = deriveBaseDisplayName(claims.username, claims.email, claims.identityProvider);
    return this.saveNew(base, claims.id, name =>
      User.create({
        id: claims.id,
        name,
        email: claims.email ?? '',
        emailVerified: claims.emailVerified,
        enabled: true,
        features: claims.groups,
        settings: UserSettings.default(),
        imageUrl: null,
        identityProvider: claims.identityProvider,
        firstName: claims.givenName ?? null,
        lastName: claims.familyName ?? null,
        lastLoginAt: now,
        claimsFingerprint: UserProvisioningService.fingerprint(claims),
      }),
    );
  }

  private async createFromIam(iamUser: UserApiResponse): Promise<User> {
    const identityProvider = iamUser.identityProvider ?? 'local';
    const base = deriveBaseDisplayName(iamUser.username, iamUser.email, identityProvider);
    return this.saveNew(base, iamUser.id, name =>
      User.create({
        id: iamUser.id,
        name,
        email: iamUser.email ?? '',
        emailVerified: iamUser.emailVerified ?? false,
        enabled: iamUser.enabled,
        // Groups are not part of the user representation; they are synced on the user's first GET /me.
        features: [],
        settings: UserSettings.default(),
        imageUrl: null,
        identityProvider,
        firstName: iamUser.firstName ?? null,
        lastName: iamUser.lastName ?? null,
        lastLoginAt: null,
        claimsFingerprint: null,
      }),
    );
  }

  /** Saves a new profile, retrying with another name on a name race and returning the winner on an id race. */
  private async saveNew(base: string, id: string, build: (name: string) => User): Promise<User> {
    for (let attempt = 1; ; attempt++) {
      const name = await this.resolveUniqueName(base);
      try {
        const saved = await this.userRepository.save(build(name));
        this.logger.log(`Profile ${saved.id} created with name ${saved.name}`);
        void this.events.publish('user', new UserCreatedEvent(saved.getProps()));
        return saved;
      } catch (err) {
        if (!(err instanceof ConflictError) || attempt >= MAX_SAVE_ATTEMPTS) throw err;
        const concurrent = await this.userRepository.findById(id);
        if (concurrent) return concurrent;
      }
    }
  }
}
