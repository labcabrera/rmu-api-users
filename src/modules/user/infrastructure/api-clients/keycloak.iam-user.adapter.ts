import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpClient, isUpstreamHttpError } from '../../../shared/infrastructure/http/http-client.js';
import { TokenService } from '../../../shared/infrastructure/security/token.service.js';
import { type IamUserPort, type UserApiResponse, type UserGroup } from '../../application/ports/iam-user.port.js';

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
export class KeycloakIamUserAdapter implements IamUserPort {
  private readonly keycloakBaseUrl: string;

  constructor(
    private readonly tokenService: TokenService,
    private readonly http: HttpClient,
    configService: ConfigService,
  ) {
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

  async removeUserFromGroup(userId: string, groupId: string): Promise<void> {
    await this.request('DELETE', `/users/${encodeURIComponent(userId)}/groups/${encodeURIComponent(groupId)}`);
  }

  async findGroups(): Promise<UserGroup[]> {
    return (await this.request<UserGroup[]>('GET', '/groups')) ?? [];
  }

  async findUserGroups(userId: string): Promise<UserGroup[]> {
    const groups = await this.request<UserGroup[]>('GET', `/users/${encodeURIComponent(userId)}/groups`);
    return (groups ?? []).map(group => ({ id: group.id, name: group.name }));
  }

  async setEnabled(userId: string, enabled: boolean): Promise<void> {
    // Keycloak takes a partial representation: only `enabled` changes.
    await this.request('PUT', `/users/${encodeURIComponent(userId)}`, { body: { enabled } });
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
   * One admin API call with the service account token, through the shared HttpClient (spec 021, decision 7): it has the
   * `RMU_HTTP_TIMEOUT_MS` timeout (504 `upstream-timeout`), and a non-2xx answer is a 400 (400/422) or a 502, except a
   * 404 when `notFoundAsNull` is set. An empty body is undefined.
   */
  private async request<T>(
    method: 'GET' | 'PUT' | 'DELETE',
    path: string,
    options: { body?: unknown; notFoundAsNull?: boolean } = {},
  ): Promise<T | undefined> {
    const url = `${this.keycloakBaseUrl}${path}`;
    const token = await this.tokenService.getToken();
    try {
      if (method === 'GET') return await this.http.get<T>(url, { token });
      if (method === 'DELETE') return await this.http.delete<T>(url, { token });
      return await this.http.put<T>(url, options.body, { token });
    } catch (err) {
      if (options.notFoundAsNull && isUpstreamHttpError(err) && err.status === 404) return undefined;
      throw err;
    }
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
