import { NextResponse } from "next/server";
import {
  AccountNameConflictError,
  AccountNotFoundError,
  AccountRepository,
} from "@/db/repositories/account-repository";
import { getDatabase } from "@/db/client";
import {
  AuthenticationRequiredError,
  AuthenticationUnavailableError,
  getCurrentUser,
  VerifiedEmailRequiredError,
} from "@/lib/current-user";
import { FinanceApiInputError, parseAccountId, parseRenameAccountInput } from "@/lib/finance-api-request";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request, context: RouteContext<"/api/accounts/[accountId]">) {
  try {
    const user = await getCurrentUser();
    const { accountId } = await context.params;
    const input = parseRenameAccountInput(await request.json());
    const account = await new AccountRepository(getDatabase()).rename({
      userId: user.id,
      accountId: parseAccountId(accountId),
      ...input,
    });
    return NextResponse.json({ account });
  } catch (error) {
    if (error instanceof SyntaxError || error instanceof FinanceApiInputError) {
      return NextResponse.json({ error: error instanceof FinanceApiInputError ? error.message : "Malformed JSON" }, { status: 422 });
    }
    if (error instanceof AccountNameConflictError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    if (error instanceof AccountNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
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
}
