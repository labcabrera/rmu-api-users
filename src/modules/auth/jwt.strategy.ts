/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import jwksRsa from 'jwks-rsa';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKeyProvider: jwksRsa.passportJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
        jwksUri: configService.get<string>('RMU_IAM_JWKS_URI')!,
      }),
      algorithms: ['RS256'],
    });
  }

  validate(payload: any) {
    console.log(`JWT payload: ${JSON.stringify(payload)}`);
    return {
      id: payload.sub,
      email: payload.email,
      name: payload.name,
      username: payload.preferred_username,
      given_name: payload.given_name,
      family_name: payload.family_name,
      roles: payload.groups || [],
    };
  }
}
