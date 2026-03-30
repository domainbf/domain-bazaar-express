/**
 * Current deployment origin — dynamically follows wherever the app is hosted.
 * On Vercel (nic.rw) → "https://nic.rw"
 * On a preview/staging URL → that URL
 * On Replit dev → the Replit dev URL
 * Supabase is just the auth backend; the domain is fully controlled by the deployment.
 */
export const SITE_URL: string = window.location.origin;

/**
 * Auth email redirect URL.
 * Always the base origin so it matches Supabase's redirect allowlist entry for this domain.
 * The global hash interceptor in App.tsx routes the user to /reset-password, /auth, etc.
 * based on the #type= hash param that Supabase appends.
 */
export const RESET_PASSWORD_URL = SITE_URL;

/** Signup / OAuth redirect URL — same base origin. */
export const SIGNUP_REDIRECT_URL = SITE_URL;
