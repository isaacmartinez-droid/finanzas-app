import "server-only";
import { Auth0Client } from "@auth0/nextjs-auth0/server";

const requiredEnvironmentVariables = [
  "AUTH0_DOMAIN",
  "AUTH0_CLIENT_ID",
  "AUTH0_CLIENT_SECRET",
  "AUTH0_SECRET",
] as const;

export const isAuth0Configured = requiredEnvironmentVariables.every((name) => Boolean(process.env[name]));

/**
 * The SDK owns encrypted, HTTP-only session cookies. It is intentionally absent
 * in local mock mode so the existing frontend can run without tenant secrets.
 */
export const auth0 = isAuth0Configured
  ? new Auth0Client({ authorizationParameters: { scope: "openid profile email" } })
  : undefined;

export function getAuth0Client(): Auth0Client {
  if (!auth0) throw new Error("Auth0 is not configured");
  return auth0;
}
