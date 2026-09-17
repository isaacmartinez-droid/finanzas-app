import "server-only";
import { getDatabase } from "@/db/client";
import { UserRepository, type Auth0Identity } from "@/db/repositories/user-repository";
import { auth0, getAuth0Client, isAuth0Configured } from "./auth0";

export class AuthenticationUnavailableError extends Error {
  constructor() {
    super("Authentication is not configured");
  }
}

export class AuthenticationRequiredError extends Error {
  constructor() {
    super("A valid Auth0 session is required");
  }
}

export class VerifiedEmailRequiredError extends Error {
  constructor() {
    super("The Auth0 identity must have a verified email address");
  }
}

export function extractVerifiedAuth0Identity(user: {
  sub: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
  nickname?: string;
}): Auth0Identity {
  const subject = user.sub.trim();
  const email = user.email?.trim().toLowerCase();
  if (!subject || subject.length > 255 || !email || email.length > 320 || user.email_verified !== true) {
    throw new VerifiedEmailRequiredError();
  }

  const displayName = (user.name ?? user.nickname ?? email).trim().replace(/\s+/g, " ").slice(0, 120) || email;
  return { subject, email, displayName };
}

/** Resolves the session identity to the local owner used by all financial repositories. */
export async function getCurrentUser() {
  if (!isAuth0Configured || !auth0) throw new AuthenticationUnavailableError();
  const session = await getAuth0Client().getSession();
  if (!session) throw new AuthenticationRequiredError();

  const identity = extractVerifiedAuth0Identity(session.user);
  return new UserRepository(getDatabase()).findOrCreateFromAuth0(identity);
}
