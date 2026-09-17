import { NextResponse } from "next/server";
import {
  AuthenticationRequiredError,
  AuthenticationUnavailableError,
  getCurrentUser,
  VerifiedEmailRequiredError,
} from "@/lib/current-user";
import { UserIdentityConflictError } from "@/db/repositories/user-repository";

export const dynamic = "force-dynamic";

/** Returns the authenticated local owner; financial endpoints must derive userId this way. */
export async function GET() {
  try {
    const user = await getCurrentUser();
    return NextResponse.json({
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      baseCurrency: user.baseCurrency,
      timezone: user.timezone,
    });
  } catch (error) {
    if (error instanceof AuthenticationUnavailableError) {
      return NextResponse.json({ error: "Authentication is not configured" }, { status: 503 });
    }
    if (error instanceof AuthenticationRequiredError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof VerifiedEmailRequiredError) {
      return NextResponse.json({ error: "A verified email address is required" }, { status: 403 });
    }
    if (error instanceof UserIdentityConflictError) {
      return NextResponse.json({ error: "Identity conflict" }, { status: 409 });
    }
    throw error;
  }
}
