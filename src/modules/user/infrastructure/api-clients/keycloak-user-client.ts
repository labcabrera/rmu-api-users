/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { TokenService } from 'src/modules/auth/token.service';
import { UserApiResponse, IamUserPort, UserGroup } from '../../application/ports/iam-user.port';
import { ConfigService } from '@nestjs/config';
import { Page } from 'src/modules/shared/domain/entities/page';

interface KeycloakRoleResponse {
  readonly id: string;
  readonly name: string;
  readonly description?: string;
  readonly composite?: boolean;
  readonly clientRole?: boolean;
  readonly containerId?: string;
}

@Injectable()
export class KeycloakIamUserAdapter extends IamUserPort {
  private readonly keycloakBaseUrl: string;

  constructor(
    private readonly tokenService: TokenService,
    configService: ConfigService,
  ) {
    super();
    this.keycloakBaseUrl = configService.get('RMU_IAM_ADMIN_BASE_URL') as string;
  }

  async findById(id: string): Promise<UserApiResponse | null> {
    const token = await this.tokenService.getToken();
    const uri = `${this.keycloakBaseUrl}/users/${id}`;
    try {
      const response = await axios.get(uri, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.data) {
        return null;
      }
      return {
        id: response.data.id as string,
        username: response.data.username as string,
        email: response.data.email as string,
        emailVerified: response.data.emailVerified as boolean,
        enabled: response.data.enabled as boolean,
      };
    } catch (err) {
      // Return null when the user is not found (404), rethrow otherwise
      if (axios.isAxiosError(err) && err.response && err.response.status === 404) {
        return null;
      }
      throw err;
    }
  }

  async findByEmail(email: string): Promise<UserApiResponse | null> {
    const token = await this.tokenService.getToken();
    const params = new URLSearchParams({ email });
    const uri = `${this.keycloakBaseUrl}/users?${params.toString()}`;
    const response = await axios.get<UserApiResponse[]>(uri, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (response.data.length === 0) {
      return null;
    }
    return {
      id: response.data[0].id,
      username: response.data[0].username,
      email: response.data[0].email,
      emailVerified: response.data[0].emailVerified,
      enabled: response.data[0].enabled,
    };
  }

  async search(term: string | undefined, page: number, size: number): Promise<Page<UserApiResponse>> {
    const token = await this.tokenService.getToken();
    const search = term?.trim() ?? '';
    const first = page * size;
    const usersParams = new URLSearchParams({
      first: first.toString(),
      max: size.toString(),
    });
    const countParams = new URLSearchParams();
    if (search) {
      usersParams.set('search', search);
      countParams.set('search', search);
    }
    const headers = {
      Authorization: `Bearer ${token}`,
    };
    const [usersResponse, countResponse] = await Promise.all([
      axios.get<UserApiResponse[]>(`${this.keycloakBaseUrl}/users?${usersParams.toString()}`, { headers }),
      axios.get<number>(`${this.keycloakBaseUrl}/users/count?${countParams.toString()}`, { headers }),
    ]);
    const users = usersResponse.data.map(user => ({
      id: user.id,
      username: user.username,
      email: user.email,
      emailVerified: user.emailVerified,
      enabled: user.enabled,
    }));
    return new Page(users, page, size, countResponse.data);
  }

  async addUserToGroup(userId: string, groupId: string): Promise<void> {
    const token = await this.tokenService.getToken();
    const uri = `${this.keycloakBaseUrl}/users/${encodeURIComponent(userId)}/groups/${encodeURIComponent(groupId)}`;
    await axios.put(
      uri,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );
  }

  async setUserRole(userId: string, roleName: string): Promise<void> {
    const token = await this.tokenService.getToken();
    const role = await this.findRealmRoleByName(token, roleName);
    const uri = `${this.keycloakBaseUrl}/users/${encodeURIComponent(userId)}/role-mappings/realm`;
    await axios.post(uri, [role], {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  private async findRealmRoleByName(token: string, roleName: string): Promise<KeycloakRoleResponse> {
    const uri = `${this.keycloakBaseUrl}/roles/${encodeURIComponent(roleName)}`;
    const response = await axios.get<KeycloakRoleResponse>(uri, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  }

  async findGroups(): Promise<UserGroup[]> {
    const token = await this.tokenService.getToken();
    const uri = `${this.keycloakBaseUrl}/groups`;
    const response = await axios.get<KeycloakRoleResponse>(uri, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response as unknown as UserGroup[];
  }
}
