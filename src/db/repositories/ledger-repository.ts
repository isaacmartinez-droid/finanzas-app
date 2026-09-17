import { and, eq, inArray, sql } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { validateLedgerTransaction } from "@/domain/financial-engine/engine";
import { BASE_CURRENCY, EXCHANGE_RATE_SCALE, moneyToDecimal, type Money } from "@/domain/financial-engine/money";
import type { LedgerTransaction } from "@/domain/financial-engine/types";
import { accounts, auditLogs, financialEvents, ledgerEntries, ledgerTransactions } from "../schema";
import type * as schema from "../schema";

type Database = NodePgDatabase<typeof schema>;

export interface PostLedgerTransactionCommand {
  userId: string;
  operationId: string;
  transaction: LedgerTransaction;
  metadata?: Record<string, unknown>;
}

export interface PostedLedgerTransaction {
  id: string;
  created: boolean;
}

export class LedgerAccountReferenceError extends Error {
  constructor(message = "Every ledger entry must reference an account owned by the user") {
    super(message);
  }
}

/**
 * Persists an already-validated financial fact atomically. Idempotency is
 * enforced by (user_id, operation_id), so client retries cannot duplicate cash.
 */
export class LedgerRepository {
  constructor(private readonly db: Database) {}

  async post(command: PostLedgerTransactionCommand): Promise<PostedLedgerTransaction> {
    validateLedgerTransaction(command.transaction);
    if (command.transaction.status !== "posted") {
      throw new Error("Only posted ledger transactions can be persisted through this repository");
    }

    return this.db.transaction(async (tx) => {
      const [existing] = await tx
        .select({ id: ledgerTransactions.id })
        .from(ledgerTransactions)
        .where(and(eq(ledgerTransactions.userId, command.userId), eq(ledgerTransactions.operationId, command.operationId)))
        .limit(1);
      if (existing) return { id: existing.id, created: false };

      const accountIds = [...new Set(command.transaction.entries.map((entry) => entry.accountId))];
      const ownedAccounts = await tx
        .select({ id: accounts.id, currency: accounts.currency })
        .from(accounts)
        .where(and(eq(accounts.userId, command.userId), inArray(accounts.id, accountIds)));
      if (ownedAccounts.length !== accountIds.length) {
        throw new LedgerAccountReferenceError();
      }
      const currencyByAccount = new Map(ownedAccounts.map((account) => [account.id, account.currency]));
      for (const entry of command.transaction.entries) {
        if (currencyByAccount.get(entry.accountId) !== entry.amount.currency) {
          throw new LedgerAccountReferenceError("Ledger entry currency must match its account currency");
        }
      }

      const [created] = await tx
        .insert(ledgerTransactions)
        .values({
          id: command.transaction.id,
          userId: command.userId,
          occurredOn: command.transaction.occurredOn,
          status: command.transaction.status,
          operationId: command.operationId,
          reversalOfTransactionId: command.transaction.reversalOf,
          metadata: command.metadata,
        })
        .returning({ id: ledgerTransactions.id });
      if (!created) throw new Error("Failed to create ledger transaction");

      await tx.insert(ledgerEntries).values(
        command.transaction.entries.map((entry, index) => ({
          transactionId: created.id,
          accountId: entry.accountId,
          sequenceNo: index + 1,
          amountOriginal: moneyToDecimal(entry.amount),
          currency: entry.amount.currency,
          amountBase: moneyToDecimal(entry.amountBase),
          exchangeRate: exchangeRateToDatabase(entry.amount.currency, entry.exchangeRateToBase),
        })),
      );

      for (const entry of command.transaction.entries) {
        await tx
          .update(accounts)
          .set({
            currentBalance: sql`${accounts.currentBalance} + ${moneyToDecimal(entry.amount)}`,
            currentBalanceBase: sql`${accounts.currentBalanceBase} + ${moneyToDecimal(entry.amountBase)}`,
            updatedAt: sql`now()`,
          })
          .where(and(eq(accounts.id, entry.accountId), eq(accounts.userId, command.userId)));
      }

      await tx.insert(financialEvents).values({
        userId: command.userId,
        occurredOn: command.transaction.occurredOn,
        kind: "ledger_transaction_posted",
        operationId: command.operationId,
        payload: { transactionId: created.id, metadata: command.metadata ?? {} },
      });
      await tx.insert(auditLogs).values({
        userId: command.userId,
        operationId: command.operationId,
        entityType: "ledger_transaction",
        entityId: created.id,
        action: "posted",
        after: { status: "posted" },
      });

      return { id: created.id, created: true };
    });
  }
}

function exchangeRateToDatabase(currency: Money["currency"], rate: bigint | undefined): string {
  if (currency === BASE_CURRENCY) return "1.00000000";
  if (!rate || rate <= 0n) throw new Error("Foreign-currency ledger entries require an exchange rate");
  return `${rate / EXCHANGE_RATE_SCALE}.${(rate % EXCHANGE_RATE_SCALE).toString().padStart(8, "0")}`;
}
