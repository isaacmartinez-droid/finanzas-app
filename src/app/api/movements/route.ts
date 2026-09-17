import { NextResponse } from "next/server";
import { and, desc, eq, ne } from "drizzle-orm";
import { AccountNotFoundError, AccountRepository } from "@/db/repositories/account-repository";
import { getDatabase } from "@/db/client";
import { LedgerAccountReferenceError, LedgerRepository } from "@/db/repositories/ledger-repository";
import { accounts, ledgerEntries, ledgerTransactions } from "@/db/schema";
import {
  AuthenticationRequiredError,
  AuthenticationUnavailableError,
  getCurrentUser,
  VerifiedEmailRequiredError,
} from "@/lib/current-user";
import { FinanceApiInputError, parsePostMovementInput } from "@/lib/finance-api-request";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getCurrentUser();
    const rows = await getDatabase()
      .select({
        id: ledgerTransactions.id,
        occurredOn: ledgerTransactions.occurredOn,
        metadata: ledgerTransactions.metadata,
        accountId: accounts.id,
        accountName: accounts.name,
        amount: ledgerEntries.amountOriginal,
        currency: ledgerEntries.currency,
      })
      .from(ledgerTransactions)
      .innerJoin(ledgerEntries, eq(ledgerEntries.transactionId, ledgerTransactions.id))
      .innerJoin(accounts, eq(accounts.id, ledgerEntries.accountId))
      .where(and(eq(ledgerTransactions.userId, user.id), ne(accounts.kind, "external")))
      .orderBy(desc(ledgerTransactions.occurredOn), desc(ledgerTransactions.createdAt));
    const movements = new Map<string, (typeof rows)[number]>();
    for (const row of rows) {
      const type = row.metadata?.type;
      const prior = movements.get(row.id);
      if (!prior || (type === "transfer" && row.amount.startsWith("-"))) movements.set(row.id, row);
    }
    return NextResponse.json({ movements: [...movements.values()] });
  } catch (error) {
    if (error instanceof AuthenticationUnavailableError) return NextResponse.json({ error: "Authentication is not configured" }, { status: 503 });
    if (error instanceof AuthenticationRequiredError) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (error instanceof VerifiedEmailRequiredError) return NextResponse.json({ error: "A verified email address is required" }, { status: 403 });
    throw error;
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    const input = parsePostMovementInput(await request.json());
    const accountRepository = new AccountRepository(getDatabase());
    const account = await accountRepository.getPublicAccount(user.id, input.accountId);
    if (account.currency !== input.amount.currency) throw new FinanceApiInputError("Movement currency must match the selected account");

    const entries = [];
    if (input.type === "transfer") {
      const destination = await accountRepository.getPublicAccount(user.id, input.toAccountId!);
      if (destination.currency !== account.currency) throw new FinanceApiInputError("Transfers require accounts in the same currency");
      entries.push(
        { accountId: account.id, amount: { ...input.amount, minor: -input.amount.minor }, amountBase: { ...input.amountBase, minor: -input.amountBase.minor }, exchangeRateToBase: input.exchangeRateToBase },
        { accountId: destination.id, amount: input.amount, amountBase: input.amountBase, exchangeRateToBase: input.exchangeRateToBase },
      );
    } else {
      const counterpart = await accountRepository.getSystemAccount({ userId: user.id, purpose: input.type, currency: input.amount.currency });
      const direction = input.type === "income" ? 1n : -1n;
      entries.push(
        { accountId: account.id, amount: { ...input.amount, minor: input.amount.minor * direction }, amountBase: { ...input.amountBase, minor: input.amountBase.minor * direction }, exchangeRateToBase: input.exchangeRateToBase },
        { accountId: counterpart.id, amount: { ...input.amount, minor: -input.amount.minor * direction }, amountBase: { ...input.amountBase, minor: -input.amountBase.minor * direction }, exchangeRateToBase: input.exchangeRateToBase },
      );
    }

    const result = await new LedgerRepository(getDatabase()).post({
      userId: user.id,
      operationId: input.operationId,
      transaction: { id: crypto.randomUUID(), occurredOn: input.occurredOn, status: "posted", entries },
      metadata: { type: input.type, title: input.title, categoryId: input.categoryId, accountId: input.accountId, toAccountId: input.toAccountId },
    });
    return NextResponse.json({ transactionId: result.id, created: result.created }, { status: result.created ? 201 : 200 });
  } catch (error) {
    if (error instanceof SyntaxError || error instanceof FinanceApiInputError || error instanceof AccountNotFoundError || error instanceof LedgerAccountReferenceError) {
      return NextResponse.json({ error: error instanceof Error ? error.message : "Invalid movement" }, { status: 422 });
    }
    if (error instanceof AuthenticationUnavailableError) return NextResponse.json({ error: "Authentication is not configured" }, { status: 503 });
    if (error instanceof AuthenticationRequiredError) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (error instanceof VerifiedEmailRequiredError) return NextResponse.json({ error: "A verified email address is required" }, { status: 403 });
    throw error;
  }
}
