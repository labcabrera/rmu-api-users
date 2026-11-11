export const DISPLAY_NAME_MIN_LENGTH = 3;
export const DISPLAY_NAME_MAX_LENGTH = 32;
/** Allowed characters in a display name chosen by the user (letters, digits, space, dot, dash, underscore). */
export const DISPLAY_NAME_PATTERN = /^[\p{L}\p{N}][\p{L}\p{N} ._-]*$/u;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+$/;
const FALLBACK_NAME = 'user';

export function looksLikeEmail(value: string | undefined | null): boolean {
  return !!value && EMAIL_PATTERN.test(value);
}

/**
 * Normalizes a raw value into a display name: lower case, ASCII letters/digits and `._-` only, dashes collapsed,
 * trimmed to the maximum length. Falls back to `user` when nothing usable remains.
 */
export function sanitizeDisplayName(raw: string | undefined | null): string {
  const cleaned = (raw ?? '')
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^[-._]+|[-._]+$/g, '')
    .slice(0, DISPLAY_NAME_MAX_LENGTH)
    .replace(/[-._]+$/g, '');
  if (cleaned.length === 0) return FALLBACK_NAME;
  return cleaned.length < DISPLAY_NAME_MIN_LENGTH ? `${cleaned}-${FALLBACK_NAME}` : cleaned;
}

/**
 * Base display name for a new profile. It starts from the username, except for brokered logins (e.g. Google, whose
 * Keycloak username is the email) or usernames that look like an email: then the email local part is used.
 */
export function deriveBaseDisplayName(username: string | undefined, email: string | undefined, identityProvider: string): string {
  const useEmail = identityProvider !== 'local' || !username || looksLikeEmail(username);
  const source = useEmail ? (email ?? username) : username;
  const localPart = source && looksLikeEmail(source) ? source.split('@')[0] : source;
  return sanitizeDisplayName(localPart);
}

/** Candidate for the given attempt: `base`, then `base-2`, `base-3`... always within the maximum length. */
export function displayNameCandidate(base: string, attempt: number): string {
  if (attempt <= 1) return base;
  const suffix = `-${attempt}`;
  return `${base.slice(0, DISPLAY_NAME_MAX_LENGTH - suffix.length)}${suffix}`;
}
