import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  date,
  foreignKey,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const currency = pgEnum("currency", ["NIO", "USD"]);
export const accountKind = pgEnum("account_kind", ["operational", "savings", "liability", "equity", "external"]);
export const ledgerTransactionStatus = pgEnum("ledger_transaction_status", ["posted", "voided"]);
export const reservationStatus = pgEnum("reservation_status", ["active", "released", "consumed"]);
export const obligationFundingStatus = pgEnum("obligation_funding_status", ["unfunded", "funded", "settled"]);
export const planEventKind = pgEnum("plan_event_kind", ["income", "expense"]);
export const planEventStatus = pgEnum("plan_event_status", ["expected", "scheduled", "omitted"]);
export const fundingPurpose = pgEnum("funding_purpose", ["PERSONAL_INCOME", "EARMARKED", "REFUND", "TRANSFER"]);

const money = (name: string) => numeric(name, { precision: 18, scale: 2 });
const baseMoney = (name: string) => numeric(name, { precision: 18, scale: 2 });
const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
};

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  auth0Subject: varchar("auth0_subject", { length: 255 }).notNull().unique(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  displayName: varchar("display_name", { length: 120 }).notNull(),
  baseCurrency: currency("base_currency").notNull().default("NIO"),
  timezone: varchar("timezone", { length: 64 }).notNull().default("America/Managua"),
  ...timestamps,
});

export const accounts = pgTable(
  "accounts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 120 }).notNull(),
    normalizedName: varchar("normalized_name", { length: 120 }).notNull(),
    kind: accountKind("kind").notNull(),
    currency: currency("currency").notNull(),
    openingBalance: money("opening_balance").notNull(),
    openingBalanceBase: baseMoney("opening_balance_base").notNull(),
    currentBalance: money("current_balance").notNull(),
    currentBalanceBase: baseMoney("current_balance_base").notNull(),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("accounts_user_normalized_name_active_unique")
      .on(table.userId, table.normalizedName)
      .where(sql`${table.archivedAt} is null`),
  ],
);

export const ledgerTransactions = pgTable(
  "ledger_transactions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    occurredOn: date("occurred_on").notNull(),
    status: ledgerTransactionStatus("status").notNull().default("posted"),
    operationId: uuid("operation_id").notNull(),
    reversalOfTransactionId: uuid("reversal_of_transaction_id"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("ledger_transactions_user_operation_unique").on(table.userId, table.operationId),
    index("ledger_transactions_user_occurred_posted_idx")
      .on(table.userId, table.occurredOn)
      .where(sql`${table.status} = 'posted'`),
    foreignKey({
      name: "ledger_transactions_reversal_of_transaction_id_ledger_transactions_id_fk",
      columns: [table.reversalOfTransactionId],
      foreignColumns: [table.id],
    }),
  ],
);

export const ledgerEntries = pgTable(
  "ledger_entries",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    transactionId: uuid("transaction_id").notNull().references(() => ledgerTransactions.id, { onDelete: "cascade" }),
    accountId: uuid("account_id").notNull().references(() => accounts.id),
    sequenceNo: integer("sequence_no").notNull(),
    amountOriginal: money("amount_original").notNull(),
    currency: currency("currency").notNull(),
    amountBase: baseMoney("amount_base").notNull(),
    exchangeRate: numeric("exchange_rate", { precision: 18, scale: 8 }).notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("ledger_entries_transaction_sequence_unique").on(table.transactionId, table.sequenceNo),
    index("ledger_entries_account_transaction_idx").on(table.accountId, table.transactionId),
    check("ledger_entries_amount_original_nonzero", sql`${table.amountOriginal} <> 0`),
    check("ledger_entries_exchange_rate_positive", sql`${table.exchangeRate} > 0`),
  ],
);

export const balanceAdjustments = pgTable("balance_adjustments", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  accountId: uuid("account_id").notNull().references(() => accounts.id),
  transactionId: uuid("transaction_id").notNull().references(() => ledgerTransactions.id),
  reason: text("reason").notNull(),
  ...timestamps,
});

export const reservations = pgTable(
  "reservations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    accountId: uuid("account_id").notNull().references(() => accounts.id),
    amountBase: baseMoney("amount_base").notNull(),
    purpose: varchar("purpose", { length: 120 }).notNull(),
    status: reservationStatus("status").notNull().default("active"),
    ...timestamps,
  },
  (table) => [index("reservations_user_status_account_idx").on(table.userId, table.status, table.accountId)],
);

export const reservationActivities = pgTable("reservation_activities", {
  id: uuid("id").defaultRandom().primaryKey(),
  reservationId: uuid("reservation_id").notNull().references(() => reservations.id, { onDelete: "cascade" }),
  operationId: uuid("operation_id").notNull(),
  kind: varchar("kind", { length: 32 }).notNull(),
  amountBase: baseMoney("amount_base").notNull(),
  ...timestamps,
});

export const obligations = pgTable(
  "obligations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 120 }).notNull(),
    amountBase: baseMoney("amount_base").notNull(),
    dueDate: date("due_date").notNull(),
    fundingStatus: obligationFundingStatus("funding_status").notNull().default("unfunded"),
    ...timestamps,
  },
  (table) => [index("obligations_user_funding_due_idx").on(table.userId, table.fundingStatus, table.dueDate)],
);

export const recurringRules = pgTable("recurring_rules", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  kind: planEventKind("kind").notNull(),
  frequency: varchar("frequency", { length: 24 }).notNull(),
  title: varchar("title", { length: 160 }).notNull(),
  amountBase: baseMoney("amount_base").notNull(),
  active: boolean("active").notNull().default(true),
  ...timestamps,
});

export const recurringOccurrences = pgTable(
  "recurring_occurrences",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    ruleId: uuid("rule_id").notNull().references(() => recurringRules.id, { onDelete: "cascade" }),
    occursOn: date("occurs_on").notNull(),
    status: planEventStatus("status").notNull().default("scheduled"),
    amountBase: baseMoney("amount_base").notNull(),
    ledgerTransactionId: uuid("ledger_transaction_id").references(() => ledgerTransactions.id),
    ...timestamps,
  },
  (table) => [uniqueIndex("recurring_occurrences_rule_date_unique").on(table.ruleId, table.occursOn)],
);

export const plannedFinancialEvents = pgTable(
  "planned_financial_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    occursOn: date("occurs_on").notNull(),
    kind: planEventKind("kind").notNull(),
    title: varchar("title", { length: 160 }).notNull(),
    amountBase: baseMoney("amount_base").notNull(),
    status: planEventStatus("status").notNull().default("expected"),
    ...timestamps,
  },
  (table) => [index("planned_events_user_occurs_active_idx").on(table.userId, table.occursOn, table.status)],
);

export const incomeRules = pgTable("income_rules", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  fixedSavingAmount: baseMoney("fixed_saving_amount").notNull(),
  active: boolean("active").notNull().default(true),
  ...timestamps,
});

export const incomeAllocations = pgTable("income_allocations", {
  id: uuid("id").defaultRandom().primaryKey(),
  incomeTransactionId: uuid("income_transaction_id").notNull().references(() => ledgerTransactions.id),
  fundingPurpose: fundingPurpose("funding_purpose").notNull(),
  grossAmountBase: baseMoney("gross_amount_base").notNull(),
  compensationAmountBase: baseMoney("compensation_amount_base").notNull(),
  cashReceivedBase: baseMoney("cash_received_base").notNull(),
  savingReservedBase: baseMoney("saving_reserved_base").notNull(),
  savingShortfallBase: baseMoney("saving_shortfall_base").notNull(),
  earmarkPurpose: varchar("earmark_purpose", { length: 120 }),
  ...timestamps,
});

export const financialEvents = pgTable(
  "financial_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    occurredOn: date("occurred_on").notNull(),
    kind: varchar("kind", { length: 64 }).notNull(),
    operationId: uuid("operation_id").notNull(),
    payload: jsonb("payload").$type<Record<string, unknown>>().notNull(),
    ...timestamps,
  },
  (table) => [index("financial_events_user_occurred_idx").on(table.userId, table.occurredOn)],
);

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    operationId: uuid("operation_id").notNull(),
    entityType: varchar("entity_type", { length: 64 }).notNull(),
    entityId: uuid("entity_id").notNull(),
    action: varchar("action", { length: 32 }).notNull(),
    before: jsonb("before").$type<Record<string, unknown>>(),
    after: jsonb("after").$type<Record<string, unknown>>(),
    ...timestamps,
  },
  (table) => [index("audit_logs_operation_idx").on(table.operationId)],
);
