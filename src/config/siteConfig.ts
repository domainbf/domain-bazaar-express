/**
 * Canonical production URL.
 * Set VITE_SITE_URL in your environment (Vercel / Replit secrets) to override.
 * Auth emails (reset-password, signup verification) always use this URL so
 * the token redirect lands on the correct page regardless of where the code runs.
 */
export const SITE_URL: string =
  (import.meta.env.VITE_SITE_URL as string | undefined)?.replace(/\/$/, '') ||
  'https://nic.rw';

/** Full URL for password-reset redirect (used in Supabase auth emails). */
export const RESET_PASSWORD_URL = `${SITE_URL}/reset-password`;

/** Full URL for signup email-verification redirect. */
export const SIGNUP_REDIRECT_URL = `${SITE_URL}/`;
