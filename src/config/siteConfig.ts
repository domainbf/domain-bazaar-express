/**
 * Current deployment origin — dynamically follows wherever the app is hosted.
 * On Vercel (nic.rw) → "https://nic.rw"
 * On a preview/staging URL → that URL
 * On Replit dev → the Replit dev URL
 * Supabase is just the auth backend; the domain is fully controlled by the deployment.
 */
export const SITE_URL: string = window.location.origin;

/**
 * Password reset redirect URL — points directly to the reset-password page.
 * Supabase appends the recovery token hash and redirects here after validating the token.
 * This avoids the race condition where the SDK processes the hash before React mounts
 * and the interceptor in App.tsx never fires, logging the admin in silently instead.
 */
export const RESET_PASSWORD_URL = `${SITE_URL}/reset-password`;

/** Signup / OAuth redirect URL — same base origin. */
export const SIGNUP_REDIRECT_URL = SITE_URL;
