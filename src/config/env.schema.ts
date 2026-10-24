import Joi from 'joi';

export const envSchema = Joi.object({
  PORT: Joi.number().port().default(3010),
  LOG_LEVEL: Joi.string().default('info'),
  RMU_MONGO_USERS_URI: Joi.string().required(),
  // Public Keycloak URL and realm, for the OAuth2 flow of the Swagger UI.
  RMU_IAM_URI: Joi.string().uri().default('http://localhost/sso'),
  RMU_IAM_REALM: Joi.string().default('rmu'),
  RMU_IAM_JWK_URI: Joi.string().uri().required(),
  RMU_IAM_ISSUER_URI: Joi.string().uri().required(),
  RMU_IAM_AUDIENCE: Joi.string().required(),
  // Service account of the Keycloak admin API calls (profile fallback and group assignment).
  RMU_IAM_TOKEN_URI: Joi.string().uri().required(),
  RMU_IAM_ADMIN_URI: Joi.string().uri().required(),
  RMU_IAM_CLIENT_ID: Joi.string().required(),
  RMU_IAM_CLIENT_SECRET: Joi.string().required(),
  RMU_KAFKA_BROKERS: Joi.string().required(),
  RMU_KAFKA_CLIENT_ID: Joi.string().required(),
  RMU_KAFKA_DEFAULT_PARTITIONS: Joi.number().integer().min(1).default(1),
  // HTTP hardening, as in rmu-api-core. No origins: CORS stays off, as the browser comes through the gateway.
  RMU_CORS_ORIGINS: Joi.string().allow('').default(''),
  RMU_THROTTLE_LIMIT: Joi.number().integer().min(0).default(300),
  RMU_THROTTLE_TTL_MS: Joi.number().integer().min(1).default(60_000),
  RMU_TRUST_PROXY: Joi.string().default('loopback, linklocal, uniquelocal'),
  RMU_USERS_ACTIVATION_CODE_SIZE: Joi.number().integer().min(4).max(64).default(8),
});
