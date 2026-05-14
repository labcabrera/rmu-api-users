import { Page } from 'src/modules/shared/domain/entities/page';

export interface UserApiResponse {
  readonly id: string;
  readonly username: string;
  readonly email: string;
  readonly emailVerified: boolean;
  readonly enabled: boolean;
}

/**
 * Interface to search for users from email in an external system (Keycloak).
 */
export interface UserSearchPort {
  findById(email: string): Promise<UserApiResponse | null>;
  findByEmail(email: string): Promise<UserApiResponse | null>;
  search(term: string | undefined, page: number, size: number): Promise<Page<UserApiResponse>>;
}
