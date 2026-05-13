export interface ActivationCodeProps {
  id: string;
  code: string;
  owner: string;
  features: string[];
  createdAt: Date;
  expiresAt: Date;
  activatedAt: Date | null;
  updatedAt: Date | null;
}
