export interface ActivationCodeProps {
  id: string;
  code: string;
  owner: string;
  features: string[];
  createdAt: Date;
  expiresAt?: Date;
  activatedAt?: Date | null;
  activatedBy?: string | null;
  updatedAt?: Date | null;
}
