export const ACTIVATION_FEATURES = ['core-law', 'creature-law-i', 'treasure-law', 'spell-law'] as const;
export type ActivationFeature = (typeof ACTIVATION_FEATURES)[number];

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
