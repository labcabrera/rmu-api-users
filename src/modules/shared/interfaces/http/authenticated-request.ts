import type { Request } from 'express';
import type { AuthenticatedUser } from '../../../auth/authenticated-user';

/** A request that went through JwtAuthGuard: JwtStrategy.validate() put the user on it. */
export type AuthenticatedRequest = Request & { user: AuthenticatedUser };
