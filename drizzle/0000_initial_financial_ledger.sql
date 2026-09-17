CREATE TYPE "public"."account_kind" AS ENUM('operational', 'savings', 'liability', 'equity', 'external');--> statement-breakpoint
CREATE TYPE "public"."currency" AS ENUM('NIO', 'USD');--> statement-breakpoint
CREATE TYPE "public"."funding_purpose" AS ENUM('PERSONAL_INCOME', 'EARMARKED', 'REFUND', 'TRANSFER');--> statement-breakpoint
CREATE TYPE "public"."ledger_transaction_status" AS ENUM('posted', 'voided');--> statement-breakpoint
CREATE TYPE "public"."obligation_funding_status" AS ENUM('unfunded', 'funded', 'settled');--> statement-breakpoint
CREATE TYPE "public"."plan_event_kind" AS ENUM('income', 'expense');--> statement-breakpoint
CREATE TYPE "public"."plan_event_status" AS ENUM('expected', 'scheduled', 'omitted');--> statement-breakpoint
CREATE TYPE "public"."reservation_status" AS ENUM('active', 'released', 'consumed');--> statement-breakpoint
CREATE TABLE "accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" varchar(120) NOT NULL,
	"normalized_name" varchar(120) NOT NULL,
	"kind" "account_kind" NOT NULL,
	"currency" "currency" NOT NULL,
	"opening_balance" numeric(18, 2) NOT NULL,
	"opening_balance_base" numeric(18, 2) NOT NULL,
	"current_balance" numeric(18, 2) NOT NULL,
	"current_balance_base" numeric(18, 2) NOT NULL,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"operation_id" uuid NOT NULL,
	"entity_type" varchar(64) NOT NULL,
	"entity_id" uuid NOT NULL,
	"action" varchar(32) NOT NULL,
	"before" jsonb,
	"after" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "balance_adjustments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"account_id" uuid NOT NULL,
	"transaction_id" uuid NOT NULL,
	"reason" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "financial_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"occurred_on" date NOT NULL,
	"kind" varchar(64) NOT NULL,
	"operation_id" uuid NOT NULL,
	"payload" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "income_allocations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"income_transaction_id" uuid NOT NULL,
	"funding_purpose" "funding_purpose" NOT NULL,
	"gross_amount_base" numeric(18, 2) NOT NULL,
	"compensation_amount_base" numeric(18, 2) NOT NULL,
	"cash_received_base" numeric(18, 2) NOT NULL,
	"saving_reserved_base" numeric(18, 2) NOT NULL,
	"saving_shortfall_base" numeric(18, 2) NOT NULL,
	"earmark_purpose" varchar(120),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "income_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"fixed_saving_amount" numeric(18, 2) NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ledger_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"transaction_id" uuid NOT NULL,
	"account_id" uuid NOT NULL,
	"sequence_no" integer NOT NULL,
	"amount_original" numeric(18, 2) NOT NULL,
	"currency" "currency" NOT NULL,
	"amount_base" numeric(18, 2) NOT NULL,
	"exchange_rate" numeric(18, 8) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ledger_entries_amount_original_nonzero" CHECK ("ledger_entries"."amount_original" <> 0),
	CONSTRAINT "ledger_entries_exchange_rate_positive" CHECK ("ledger_entries"."exchange_rate" > 0)
);
--> statement-breakpoint
CREATE TABLE "ledger_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"occurred_on" date NOT NULL,
	"status" "ledger_transaction_status" DEFAULT 'posted' NOT NULL,
	"operation_id" uuid NOT NULL,
	"reversal_of_transaction_id" uuid,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "obligations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" varchar(120) NOT NULL,
	"amount_base" numeric(18, 2) NOT NULL,
	"due_date" date NOT NULL,
	"funding_status" "obligation_funding_status" DEFAULT 'unfunded' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "planned_financial_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"occurs_on" date NOT NULL,
	"kind" "plan_event_kind" NOT NULL,
	"title" varchar(160) NOT NULL,
	"amount_base" numeric(18, 2) NOT NULL,
	"status" "plan_event_status" DEFAULT 'expected' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recurring_occurrences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"rule_id" uuid NOT NULL,
	"occurs_on" date NOT NULL,
	"status" "plan_event_status" DEFAULT 'scheduled' NOT NULL,
	"amount_base" numeric(18, 2) NOT NULL,
	"ledger_transaction_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recurring_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"kind" "plan_event_kind" NOT NULL,
	"frequency" varchar(24) NOT NULL,
	"title" varchar(160) NOT NULL,
	"amount_base" numeric(18, 2) NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reservation_activities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reservation_id" uuid NOT NULL,
	"operation_id" uuid NOT NULL,
	"kind" varchar(32) NOT NULL,
	"amount_base" numeric(18, 2) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reservations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"account_id" uuid NOT NULL,
	"amount_base" numeric(18, 2) NOT NULL,
	"purpose" varchar(120) NOT NULL,
	"status" "reservation_status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(320) NOT NULL,
	"display_name" varchar(120) NOT NULL,
	"base_currency" "currency" DEFAULT 'NIO' NOT NULL,
	"timezone" varchar(64) DEFAULT 'America/Managua' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "balance_adjustments" ADD CONSTRAINT "balance_adjustments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "balance_adjustments" ADD CONSTRAINT "balance_adjustments_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "balance_adjustments" ADD CONSTRAINT "balance_adjustments_transaction_id_ledger_transactions_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "public"."ledger_transactions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "financial_events" ADD CONSTRAINT "financial_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "income_allocations" ADD CONSTRAINT "income_allocations_income_transaction_id_ledger_transactions_id_fk" FOREIGN KEY ("income_transaction_id") REFERENCES "public"."ledger_transactions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "income_rules" ADD CONSTRAINT "income_rules_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ledger_entries" ADD CONSTRAINT "ledger_entries_transaction_id_ledger_transactions_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "public"."ledger_transactions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ledger_entries" ADD CONSTRAINT "ledger_entries_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ledger_transactions" ADD CONSTRAINT "ledger_transactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ledger_transactions" ADD CONSTRAINT "ledger_transactions_reversal_of_transaction_id_ledger_transactions_id_fk" FOREIGN KEY ("reversal_of_transaction_id") REFERENCES "public"."ledger_transactions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "obligations" ADD CONSTRAINT "obligations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "planned_financial_events" ADD CONSTRAINT "planned_financial_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recurring_occurrences" ADD CONSTRAINT "recurring_occurrences_rule_id_recurring_rules_id_fk" FOREIGN KEY ("rule_id") REFERENCES "public"."recurring_rules"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recurring_occurrences" ADD CONSTRAINT "recurring_occurrences_ledger_transaction_id_ledger_transactions_id_fk" FOREIGN KEY ("ledger_transaction_id") REFERENCES "public"."ledger_transactions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recurring_rules" ADD CONSTRAINT "recurring_rules_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reservation_activities" ADD CONSTRAINT "reservation_activities_reservation_id_reservations_id_fk" FOREIGN KEY ("reservation_id") REFERENCES "public"."reservations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "accounts_user_normalized_name_active_unique" ON "accounts" USING btree ("user_id","normalized_name") WHERE "accounts"."archived_at" is null;--> statement-breakpoint
CREATE INDEX "audit_logs_operation_idx" ON "audit_logs" USING btree ("operation_id");--> statement-breakpoint
CREATE INDEX "financial_events_user_occurred_idx" ON "financial_events" USING btree ("user_id","occurred_on");--> statement-breakpoint
CREATE UNIQUE INDEX "ledger_entries_transaction_sequence_unique" ON "ledger_entries" USING btree ("transaction_id","sequence_no");--> statement-breakpoint
CREATE INDEX "ledger_entries_account_transaction_idx" ON "ledger_entries" USING btree ("account_id","transaction_id");--> statement-breakpoint
CREATE UNIQUE INDEX "ledger_transactions_user_operation_unique" ON "ledger_transactions" USING btree ("user_id","operation_id");--> statement-breakpoint
CREATE INDEX "ledger_transactions_user_occurred_posted_idx" ON "ledger_transactions" USING btree ("user_id","occurred_on") WHERE "ledger_transactions"."status" = 'posted';--> statement-breakpoint
CREATE INDEX "obligations_user_funding_due_idx" ON "obligations" USING btree ("user_id","funding_status","due_date");--> statement-breakpoint
CREATE INDEX "planned_events_user_occurs_active_idx" ON "planned_financial_events" USING btree ("user_id","occurs_on","status");--> statement-breakpoint
CREATE UNIQUE INDEX "recurring_occurrences_rule_date_unique" ON "recurring_occurrences" USING btree ("rule_id","occurs_on");--> statement-breakpoint
CREATE INDEX "reservations_user_status_account_idx" ON "reservations" USING btree ("user_id","status","account_id");
--> statement-breakpoint
CREATE OR REPLACE FUNCTION ensure_ledger_entry_owner_match()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM ledger_transactions ledger_tx
    INNER JOIN accounts account ON account.id = NEW.account_id
    WHERE ledger_tx.id = NEW.transaction_id
      AND ledger_tx.user_id = account.user_id
  ) THEN
    RAISE EXCEPTION 'Ledger entry account and transaction must belong to the same user';
  END IF;

  RETURN NEW;
END;
$$;
--> statement-breakpoint
CREATE TRIGGER ledger_entries_require_matching_owner
BEFORE INSERT OR UPDATE OF transaction_id, account_id ON ledger_entries
FOR EACH ROW EXECUTE FUNCTION ensure_ledger_entry_owner_match();
--> statement-breakpoint
CREATE OR REPLACE FUNCTION ensure_posted_ledger_transaction_balances()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  checked_transaction_id uuid;
  entry_count integer;
  base_total numeric(18, 2);
BEGIN
  IF TG_TABLE_NAME = 'ledger_transactions' THEN
    checked_transaction_id := NEW.id;
  ELSIF TG_OP = 'DELETE' THEN
    checked_transaction_id := OLD.transaction_id;
  ELSE
    checked_transaction_id := NEW.transaction_id;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM ledger_transactions
    WHERE id = checked_transaction_id
      AND status = 'posted'
  ) THEN
    RETURN NULL;
  END IF;

  SELECT COUNT(*), COALESCE(SUM(amount_base), 0)
  INTO entry_count, base_total
  FROM ledger_entries
  WHERE transaction_id = checked_transaction_id;

  IF entry_count < 2 OR base_total <> 0 THEN
    RAISE EXCEPTION 'Posted ledger transaction % requires at least two entries with a zero NIO total', checked_transaction_id;
  END IF;

  RETURN NULL;
END;
$$;
--> statement-breakpoint
CREATE CONSTRAINT TRIGGER ledger_entries_must_balance_before_commit
AFTER INSERT OR UPDATE OR DELETE ON ledger_entries
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW EXECUTE FUNCTION ensure_posted_ledger_transaction_balances();
--> statement-breakpoint
CREATE CONSTRAINT TRIGGER posted_ledger_transactions_must_balance_before_commit
AFTER INSERT OR UPDATE OF status ON ledger_transactions
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW EXECUTE FUNCTION ensure_posted_ledger_transaction_balances();
