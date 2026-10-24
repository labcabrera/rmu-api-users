export const ACTIVATION_FEATURES = ['core-law', 'creature-law-i', 'treasure-law', 'spell-law'] as const;
export type ActivationFeature = (typeof ACTIVATION_FEATURES)[number];

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
  updatedAt?: Date | null;
}
