import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy, StrategyOptionsWithoutRequest } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import jwksRsa from 'jwks-rsa';
import type { AuthenticatedUser } from '../../interfaces/http/authenticated-request';

export const LOCAL_IDENTITY_PROVIDER = 'local';

export function mapJwtPayload(payload: Record<string, unknown>): AuthenticatedUser {
  const str = (value: unknown): string | undefined => (typeof value === 'string' && value.length > 0 ? value : undefined);
  const groups = Array.isArray(payload.groups) ? payload.groups.filter((g): g is string => typeof g === 'string') : [];
  return {
    id: payload.sub as string,
    email: str(payload.email),
    emailVerified: payload.email_verified === true,
    username: str(payload.preferred_username),
    given_name: str(payload.given_name),
    family_name: str(payload.family_name),
    name: str(payload.name),
    roles: groups,
    identityProvider: str(payload.identity_provider) ?? LOCAL_IDENTITY_PROVIDER,
  };
}

export function buildJwtStrategyOptions(configService: ConfigService): StrategyOptionsWithoutRequest {
  return {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKeyProvider: jwksRsa.passportJwtSecret({
      cache: true,
      rateLimit: true,
      jwksRequestsPerMinute: 5,
      jwksUri: configService.getOrThrow<string>('RMU_IAM_JWK_URI'),
    }),
    issuer: configService.getOrThrow<string>('RMU_IAM_ISSUER_URI'),
    audience: configService.getOrThrow<string>('RMU_IAM_AUDIENCE'),
    algorithms: ['RS256'],
  };
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    super(buildJwtStrategyOptions(configService));
  }

  validate(payload: Record<string, unknown>): AuthenticatedUser {
    return mapJwtPayload(payload);
  }
}
