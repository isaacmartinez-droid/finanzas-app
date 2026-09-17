"use client";

import { createContext, useContext } from "react";

export interface AuthenticatedUser {
  displayName: string;
  email: string;
  initials: string;
}

const AuthenticatedUserContext = createContext<AuthenticatedUser | null>(null);

export function AuthenticatedUserProvider({
  user,
  children,
}: {
  user: AuthenticatedUser | null;
  children: React.ReactNode;
}) {
  return <AuthenticatedUserContext.Provider value={user}>{children}</AuthenticatedUserContext.Provider>;
}

/** Null means local demo mode; components can retain their explicit mock fallback. */
export function useAuthenticatedUser(): AuthenticatedUser | null {
  return useContext(AuthenticatedUserContext);
}
