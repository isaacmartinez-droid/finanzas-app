import { NextResponse } from "next/server";
import { FinancialEngineError } from "@/domain/financial-engine/engine";
import { getDatabase } from "@/db/client";
import { LedgerAccountReferenceError, LedgerRepository } from "@/db/repositories/ledger-repository";
import {
  AuthenticationRequiredError,
  AuthenticationUnavailableError,
  getCurrentUser,
  VerifiedEmailRequiredError,
} from "@/lib/current-user";
import { FinanceApiInputError, parsePostLedgerTransactionInput } from "@/lib/finance-api-request";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    const input = parsePostLedgerTransactionInput(await request.json());
    const result = await new LedgerRepository(getDatabase()).post({
      userId: user.id,
      operationId: input.operationId,
      transaction: input.transaction,
    });
    return NextResponse.json({ transactionId: result.id, created: result.created }, { status: result.created ? 201 : 200 });
  } catch (error) {
    if (error instanceof SyntaxError || error instanceof FinanceApiInputError || error instanceof FinancialEngineError) {
      return NextResponse.json({ error: error instanceof Error ? error.message : "Invalid ledger transaction" }, { status: 422 });
    }
    if (error instanceof LedgerAccountReferenceError) {
      return NextResponse.json({ error: error.message }, { status: 422 });
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
