import { NextResponse } from "next/server";
import { getDatabase } from "@/db/client";
import { AccountNameConflictError, AccountRepository } from "@/db/repositories/account-repository";
import {
  AuthenticationRequiredError,
  AuthenticationUnavailableError,
  getCurrentUser,
  VerifiedEmailRequiredError,
} from "@/lib/current-user";
import { FinanceApiInputError, parseCreateAccountInput } from "@/lib/finance-api-request";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getCurrentUser();
    const result = await new AccountRepository(getDatabase()).list(user.id);
    return NextResponse.json({ accounts: result });
  } catch (error) {
    return authenticationErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    const input = parseCreateAccountInput(await request.json());
    const account = await new AccountRepository(getDatabase()).create({ userId: user.id, ...input });
    return NextResponse.json({ account }, { status: 201 });
  } catch (error) {
    if (error instanceof SyntaxError || error instanceof FinanceApiInputError) {
      return NextResponse.json({ error: error instanceof FinanceApiInputError ? error.message : "Malformed JSON" }, { status: 422 });
    }
    if (error instanceof AccountNameConflictError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    return authenticationErrorResponse(error);
  }
}

function authenticationErrorResponse(error: unknown) {
  if (error instanceof AuthenticationUnavailableError) {
    return NextResponse.json({ error: "Authentication is not configured" }, { status: 503 });
  }
  if (error instanceof AuthenticationRequiredError) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (error instanceof VerifiedEmailRequiredError) {
    return NextResponse.json({ error: "A verified email address is required" }, { status: 403 });
  }
  throw error;
}
