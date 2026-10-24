import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { readBody, sendRequest, upstreamError } from '../http/http-client.js';

interface TokenResponse {
  access_token: string;
  expires_in: number;
}

/**
 * Service account token (client credentials) for the Keycloak admin API, cached until 10 s before it expires. The
 * request goes through the HttpClient helpers (spec 021, decision 7): a Keycloak that does not answer within
 * `RMU_HTTP_TIMEOUT_MS` is a GatewayTimeoutError (504), an unreachable one or a non-2xx answer a 502.
 */
@Injectable()
export class TokenService {
  private readonly logger = new Logger(TokenService.name);
  private readonly timeoutMs: number;

  constructor(private readonly configService: ConfigService) {
    this.timeoutMs = Number(configService.get<number>('RMU_HTTP_TIMEOUT_MS') ?? 10_000);
  }

  private token: string | null = null;
  private expiresAt = 0;

  async getToken(): Promise<string> {
    const now = Date.now();
    if (this.token && now < this.expiresAt) return this.token;

    const uri = this.configService.get<string>('RMU_IAM_TOKEN_URI')!;
    const clientId = this.configService.get<string>('RMU_IAM_CLIENT_ID')!;
    const clientSecret = this.configService.get<string>('RMU_IAM_CLIENT_SECRET')!;

    this.logger.debug(`Fetching new token from ${uri} with clientId ${clientId}`);
    const params = new URLSearchParams();
    params.append('grant_type', 'client_credentials');
    params.append('client_id', clientId);
    params.append('client_secret', clientSecret);
    const response = await sendRequest(
      uri,
      { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' }, body: params },
      this.timeoutMs,
    );
    const data = await readBody(response);
    if (!response.ok) throw upstreamError(uri, response.status, response.statusText, data);
    const token = data as TokenResponse;
    this.token = token.access_token;
    this.expiresAt = now + token.expires_in * 1000 - 10_000; // 10s offset
    return this.token;
  }
}
