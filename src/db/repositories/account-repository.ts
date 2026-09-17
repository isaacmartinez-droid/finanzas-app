import { and, asc, eq, ne, sql } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { moneyToDecimal, type Money } from "@/domain/financial-engine/money";
import type { AccountKind } from "@/domain/financial-engine/types";
import { accounts } from "../schema";
import type * as schema from "../schema";

type Database = NodePgDatabase<typeof schema>;

export interface CreateAccountCommand {
  userId: string;
  name: string;
  normalizedName: string;
  kind: AccountKind;
  currency: "NIO" | "USD";
  openingBalance: Money;
  openingBalanceBase: Money;
}

export interface RenameAccountCommand {
  userId: string;
  accountId: string;
  name: string;
  normalizedName: string;
}

export interface SystemAccountCommand {
  userId: string;
  purpose: "income" | "expense";
  currency: "NIO" | "USD";
}

export class AccountNameConflictError extends Error {
  constructor() {
    super("An active account with this name already exists");
  }
}

export class AccountNotFoundError extends Error {
  constructor() {
    super("Account not found");
  }
}

/** All account reads and writes are scoped by the authenticated local owner. */
export class AccountRepository {
  constructor(private readonly db: Database) {}

  async list(userId: string) {
    return this.db
      .select()
      .from(accounts)
      .where(and(eq(accounts.userId, userId), ne(accounts.kind, "external")))
      .orderBy(asc(accounts.createdAt));
  }

  async getPublicAccount(userId: string, accountId: string) {
    const [account] = await this.db
      .select()
      .from(accounts)
      .where(and(eq(accounts.id, accountId), eq(accounts.userId, userId), ne(accounts.kind, "external")))
      .limit(1);
    if (!account) throw new AccountNotFoundError();
    return account;
  }

  async getSystemAccount(command: SystemAccountCommand) {
    const normalizedName = `__system_${command.purpose}_${command.currency.toLowerCase()}`;
    const [existing] = await this.db
      .select()
      .from(accounts)
      .where(and(eq(accounts.userId, command.userId), eq(accounts.normalizedName, normalizedName)))
      .limit(1);
    if (existing) return existing;

    try {
      const [created] = await this.db.insert(accounts).values({
        userId: command.userId,
        name: normalizedName,
        normalizedName,
        kind: "external",
        currency: command.currency,
        openingBalance: "0.00",
        openingBalanceBase: "0.00",
        currentBalance: "0.00",
        currentBalanceBase: "0.00",
      }).returning();
      if (!created) throw new Error("Failed to create system account");
      return created;
    } catch (error) {
      if (!isUniqueViolation(error)) throw error;
      const [createdByAnotherRequest] = await this.db
        .select()
        .from(accounts)
        .where(and(eq(accounts.userId, command.userId), eq(accounts.normalizedName, normalizedName)))
        .limit(1);
      if (!createdByAnotherRequest) throw error;
      return createdByAnotherRequest;
    }
  }

  async create(command: CreateAccountCommand) {
    try {
      const [created] = await this.db.insert(accounts).values({
        userId: command.userId,
        name: command.name,
        normalizedName: command.normalizedName,
        kind: command.kind,
        currency: command.currency,
        openingBalance: moneyToDecimal(command.openingBalance),
        openingBalanceBase: moneyToDecimal(command.openingBalanceBase),
        currentBalance: moneyToDecimal(command.openingBalance),
        currentBalanceBase: moneyToDecimal(command.openingBalanceBase),
      }).returning();
      if (!created) throw new Error("Failed to create account");
      return created;
    } catch (error) {
      if (isUniqueViolation(error)) throw new AccountNameConflictError();
      throw error;
    }
  }

  async rename(command: RenameAccountCommand) {
    try {
      const [updated] = await this.db
        .update(accounts)
        .set({
          name: command.name,
          normalizedName: command.normalizedName,
          updatedAt: sql`now()`,
        })
        .where(and(eq(accounts.id, command.accountId), eq(accounts.userId, command.userId), ne(accounts.kind, "external")))
        .returning();
      if (!updated) throw new AccountNotFoundError();
      return updated;
    } catch (error) {
      if (isUniqueViolation(error)) throw new AccountNameConflictError();
      throw error;
    }
  }
}

export function isUniqueViolation(error: unknown): boolean {
  if (typeof error !== "object" || error === null) return false;
  if ("code" in error && error.code === "23505") return true;
  return "cause" in error && isUniqueViolation(error.cause);
}
