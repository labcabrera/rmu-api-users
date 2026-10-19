/** Public projection of a profile, safe to show to any authenticated user. */
export interface UserSummary {
  id: string;
  name: string;
  imageUrl: string | null;
}
