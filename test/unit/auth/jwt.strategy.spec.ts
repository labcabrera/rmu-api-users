import { describe, expect, it } from '@jest/globals';
import { ConfigService } from '@nestjs/config';
import { mapJwtPayload } from 'src/modules/auth/authenticated-user';
import { buildJwtStrategyOptions } from 'src/modules/auth/jwt.strategy';

describe('JwtStrategy', () => {
  const config = new ConfigService({
    RMU_IAM_JWK_URI: 'http://localhost:8090/sso/realms/rmu/protocol/openid-connect/certs',
    RMU_IAM_ISSUER_URI: 'http://localhost/sso/realms/rmu',
    RMU_IAM_AUDIENCE: 'rmu-api',
  });

  it('validates RS256 signature, issuer and audience', () => {
    const options = buildJwtStrategyOptions(config);
    expect(options.issuer).toBe('http://localhost/sso/realms/rmu');
    expect(options.audience).toBe('rmu-api');
    expect(options.algorithms).toEqual(['RS256']);
    expect('secretOrKeyProvider' in options).toBe(true);
  });

  it('fails fast when the issuer or audience is not configured', () => {
    expect(() => buildJwtStrategyOptions(new ConfigService({ RMU_IAM_JWK_URI: 'http://localhost/certs' }))).toThrow();
  });

  it('maps the claims to the request user', () => {
    expect(
      mapJwtPayload({
        sub: 'abc',
        email: 'a@example.com',
        email_verified: true,
        preferred_username: 'alice',
        given_name: 'Alice',
        family_name: 'L',
        name: 'Alice L',
        groups: ['rmu-user'],
        identity_provider: 'google',
      }),
    ).toEqual({
      id: 'abc',
      email: 'a@example.com',
      emailVerified: true,
      username: 'alice',
      given_name: 'Alice',
      family_name: 'L',
      name: 'Alice L',
      roles: ['rmu-user'],
      identityProvider: 'google',
    });
    const local = mapJwtPayload({ sub: 'abc' });
    expect(local.roles).toEqual([]);
    expect(local.identityProvider).toBe('local');
    expect(local.emailVerified).toBe(false);
  });
});
