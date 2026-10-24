import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TokenService } from '../../../shared/infrastructure/security/token.service.js';
import { IamUserPort, type UserApiResponse, type UserGroup } from '../../application/ports/iam-user.port.js';

interface KeycloakUserRepresentation {
  readonly id: string;
  readonly username: string;
  readonly email?: string;
  readonly emailVerified?: boolean;
  readonly enabled?: boolean;
  readonly firstName?: string;
  readonly lastName?: string;
  readonly federatedIdentities?: { identityProvider?: string }[];
}

@Injectable()
export class KeycloakIamUserAdapter extends IamUserPort {
  private readonly keycloakBaseUrl: string;

  constructor(
    private readonly tokenService: TokenService,
    configService: ConfigService,
  ) {
    super();
    this.keycloakBaseUrl = configService.getOrThrow<string>('RMU_IAM_ADMIN_URI');
  }

  async findById(id: string): Promise<UserApiResponse | null> {
    const user = await this.request<KeycloakUserRepresentation>('GET', `/users/${encodeURIComponent(id)}`, { notFoundAsNull: true });
    return user ? this.map(user) : null;
  }

  findByUsername(username: string): Promise<UserApiResponse | null> {
    return this.findExact('username', username, user => user.username.toLowerCase() === username.toLowerCase());
  }

  findByEmail(email: string): Promise<UserApiResponse | null> {
    return this.findExact('email', email, user => (user.email ?? '').toLowerCase() === email.toLowerCase());
  }

  async addUserToGroup(userId: string, groupId: string): Promise<void> {
    await this.request('PUT', `/users/${encodeURIComponent(userId)}/groups/${encodeURIComponent(groupId)}`, { body: {} });
  }

  async findGroups(): Promise<UserGroup[]> {
    return (await this.request<UserGroup[]>('GET', '/groups')) ?? [];
  }

  private async findExact(
    param: 'username' | 'email',
    value: string,
    matches: (user: KeycloakUserRepresentation) => boolean,
  ): Promise<UserApiResponse | null> {
    const params = new URLSearchParams({ [param]: value, exact: 'true', briefRepresentation: 'false', max: '2' });
    const users = await this.request<KeycloakUserRepresentation[]>('GET', `/users?${params.toString()}`);
    const user = (users ?? []).find(matches);
    return user ? this.map(user) : null;
  }

  /**
   * One admin API call with the service account token. A status other than 2xx throws, as axios did before (spec
   * 020), except a 404 when `notFoundAsNull` is set. An empty body is undefined.
   */
  private async request<T>(
    method: 'GET' | 'PUT',
    path: string,
    options: { body?: unknown; notFoundAsNull?: boolean } = {},
  ): Promise<T | undefined> {
    const headers: Record<string, string> = { Authorization: `Bearer ${await this.tokenService.getToken()}` };
    if (options.body !== undefined) headers['Content-Type'] = 'application/json';
    const response = await fetch(`${this.keycloakBaseUrl}${path}`, {
      method,
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    });
    if (response.status === 404 && options.notFoundAsNull) return undefined;
    if (!response.ok) {
      throw new Error(`Keycloak admin API ${method} ${path.split('?')[0]} failed with status ${response.status}`);
    }
    const text = await response.text();
    return text ? (JSON.parse(text) as T) : undefined;
  }

  private map(user: KeycloakUserRepresentation): UserApiResponse {
    return {
      id: user.id,
      username: user.username,
      email: user.email ?? '',
      emailVerified: user.emailVerified ?? false,
      enabled: user.enabled ?? true,
      firstName: user.firstName,
      lastName: user.lastName,
      identityProvider: user.federatedIdentities?.find(f => !!f.identityProvider)?.identityProvider,
    };
  }
}
