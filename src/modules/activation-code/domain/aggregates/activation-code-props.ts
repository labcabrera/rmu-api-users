export const ACTIVATION_FEATURES = ['core-law', 'creature-law-i', 'treasure-law', 'spell-law'] as const;
export type ActivationFeature = (typeof ACTIVATION_FEATURES)[number];

/** Keycloak group a feature grants: the realm groups carry the `rmu-` prefix (`core-law` → `rmu-core-law`). */
export const featureGroup = (feature: ActivationFeature): string => `rmu-${feature}`;

/** Most codes one request creates (F-users-15: the DTO and the handler share it). */
export const MAX_CODES_PER_REQUEST = 100;

export interface ActivationCodeProps {
  id: string;
  code: string;
  owner: string;
  features: ActivationFeature[];
  createdAt: Date;
  expiresAt?: Date;
  activatedAt?: Date | null;
  activatedBy?: string | null;
  /** Free text of the administrator: who the code was given to, or why. */
  note?: string | null;
  updatedAt?: Date | null;
}
