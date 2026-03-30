/**
 * Canonical production URL.
 * Set VITE_SITE_URL in your environment (Vercel / Replit secrets) to override.
 * Auth emails (reset-password, signup verification) always use this URL so
 * the token redirect lands on the correct page regardless of where the code runs.
 */
export const SITE_URL: string =
  (import.meta.env.VITE_SITE_URL as string | undefined)?.replace(/\/$/, '') ||
  'https://nic.rw';

/**
 * Redirect URL sent to Supabase for auth emails.
 * Must match exactly one of the URLs in the Supabase "Redirect URLs" allowlist.
 * Supabase appends the token as a hash (#access_token=...&type=recovery|signup).
 * A global hash interceptor in App.tsx then routes the user to the correct page.
 */
export const RESET_PASSWORD_URL = SITE_URL;

/** Full URL for signup email-verification redirect. */
export const SIGNUP_REDIRECT_URL = SITE_URL;
