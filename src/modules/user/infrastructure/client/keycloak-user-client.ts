/* eslint-disable @typescript-eslint/no-unsafe-member-access */

import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { TokenService } from 'src/modules/auth/token.service';
import { UserApiResponse, UserSearchPort } from '../../application/ports/out/user-search.port';

@Injectable()
export class KeycloakUserSearchClient implements UserSearchPort {
  constructor(private readonly tokenService: TokenService) {}

  async findByEmail(email: string): Promise<UserApiResponse | null> {
    const token = await this.tokenService.getToken();
    //TODO READ FROM CONFIG
    const uri = `http://localhost:8090/admin/realms/rmu-local/users?email=${email}`;
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
