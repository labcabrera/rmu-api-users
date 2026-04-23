/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { TokenService } from 'src/modules/auth/token.service';
import { UserApiResponse, UserSearchPort } from '../../application/ports/user-search.port';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class KeycloakUserSearchClient implements UserSearchPort {
  private readonly keycloakBaseUrl: string;

  constructor(
    private readonly tokenService: TokenService,
    configService: ConfigService,
  ) {
    this.keycloakBaseUrl = configService.get('RMU_IAM_BASE_URL') as string;
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
    const uri = `${this.keycloakBaseUrl}/users?email=${email}`;
    const response = await axios.get(uri, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (response.data.length === 0) {
      return null;
    }
    return {
      id: response.data[0].id as string,
      username: response.data[0].username as string,
      email: response.data[0].email as string,
    };
  }
}
