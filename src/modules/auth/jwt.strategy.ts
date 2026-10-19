import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy, StrategyOptionsWithoutRequest } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import jwksRsa from 'jwks-rsa';
import { AuthenticatedUser, mapJwtPayload } from './authenticated-user';

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
