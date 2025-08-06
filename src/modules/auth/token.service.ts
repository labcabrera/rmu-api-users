/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class TokenService {
  private token: string | null = null;
  private expiresAt = 0;

  async getToken(): Promise<string> {
    const now = Date.now();
    if (this.token && now < this.expiresAt) return this.token;

    const uri = process.env.RMU_IAM_TOKEN_URL || '';
    const clientId = process.env.RMU_IAM_CLIENT_ID || '';
    const clientSecret = process.env.RMU_IAM_CLIENT_SECRET || '';

    const params = new URLSearchParams();
    params.append('grant_type', 'client_credentials');
    params.append('client_id', clientId);
    params.append('client_secret', clientSecret);

    const { data } = await axios.post(uri, params, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });

    this.token = data.access_token;
    this.expiresAt = now + data.expires_in * 1000 - 10_000; // 10s offset

    return this.token!;
  }
}
