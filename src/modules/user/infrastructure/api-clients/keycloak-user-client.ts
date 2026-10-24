import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { TokenService } from '../../../auth/token.service';
import { IamUserPort, UserApiResponse, UserGroup } from '../../application/ports/iam-user.port';

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
    try {
      const response = await axios.get<KeycloakUserRepresentation>(`${this.keycloakBaseUrl}/users/${encodeURIComponent(id)}`, {
        headers: await this.headers(),
      });
      return response.data ? this.map(response.data) : null;
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 404) {
        return null;
      }
      throw err;
    }
  }

  findByUsername(username: string): Promise<UserApiResponse | null> {
    return this.findExact('username', username, user => user.username.toLowerCase() === username.toLowerCase());
  }

  findByEmail(email: string): Promise<UserApiResponse | null> {
    return this.findExact('email', email, user => (user.email ?? '').toLowerCase() === email.toLowerCase());
  }

  async addUserToGroup(userId: string, groupId: string): Promise<void> {
    const uri = `${this.keycloakBaseUrl}/users/${encodeURIComponent(userId)}/groups/${encodeURIComponent(groupId)}`;
    await axios.put(uri, {}, { headers: await this.headers() });
  }

  async findGroups(): Promise<UserGroup[]> {
    const response = await axios.get<UserGroup[]>(`${this.keycloakBaseUrl}/groups`, { headers: await this.headers() });
    return response.data;
  }

  private async findExact(
    param: 'username' | 'email',
    value: string,
    matches: (user: KeycloakUserRepresentation) => boolean,
  ): Promise<UserApiResponse | null> {
    const params = new URLSearchParams({ [param]: value, exact: 'true', briefRepresentation: 'false', max: '2' });
    const response = await axios.get<KeycloakUserRepresentation[]>(`${this.keycloakBaseUrl}/users?${params.toString()}`, {
      headers: await this.headers(),
    });
    const user = (response.data ?? []).find(matches);
    return user ? this.map(user) : null;
  }

  private async headers(): Promise<Record<string, string>> {
    return { Authorization: `Bearer ${await this.tokenService.getToken()}` };
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
