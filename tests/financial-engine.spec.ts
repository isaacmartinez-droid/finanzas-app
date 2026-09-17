import { expect, test } from "@playwright/test";
import {
  allocateIncome,
  calculateFinancialPosition,
  projectFreeMoney,
  reconcileAccounts,
  validateLedgerTransaction,
} from "../src/domain/financial-engine/engine";
import { exchangeRate, money, toBase } from "../src/domain/financial-engine/money";
import type { LedgerAccount, LedgerTransaction } from "../src/domain/financial-engine/types";

const nio = (value: string) => money("NIO", value);

test.describe("FinancialEngine v1", () => {
  test("a transfer moves balances without becoming an expense or changing total wealth", () => {
    const accounts: LedgerAccount[] = [
      { id: "banpro", kind: "operational", currency: "NIO", openingBalance: nio("3082.21"), openingBalanceBase: nio("3082.21") },
      { id: "savings", kind: "savings", currency: "NIO", openingBalance: nio("2100"), openingBalanceBase: nio("2100") },
    ];
    const transfer: LedgerTransaction = {
      id: "transfer-1",
      occurredOn: "2026-09-15",
      status: "posted",
      entries: [
        { accountId: "banpro", amount: nio("-1000"), amountBase: nio("-1000") },
        { accountId: "savings", amount: nio("1000"), amountBase: nio("1000") },
      ],
    };

    const position = calculateFinancialPosition({
      accounts,
      transactions: [transfer],
      reservations: [],
      obligations: [],
      operatingCushion: nio("1000"),
    });

    expect(position.operatingBalance.minor).toBe(208_221n);
    expect(position.freeMoney.minor).toBe(108_221n);
    expect(position.accounts.find((account) => account.accountId === "savings")?.balance.minor).toBe(310_000n);
  });

  test("calculates the current free money from facts, protections and cushion", () => {
    const accounts: LedgerAccount[] = [
      { id: "banpro", kind: "operational", currency: "NIO", openingBalance: nio("2582.21"), openingBalanceBase: nio("2582.21") },
      { id: "cash", kind: "operational", currency: "NIO", openingBalance: nio("500"), openingBalanceBase: nio("500") },
    ];

    const position = calculateFinancialPosition({
      accounts,
      transactions: [],
      reservations: [{ id: "reserve", accountId: "banpro", amount: nio("600"), status: "active", purpose: "savings" }],
      obligations: [],
      operatingCushion: nio("1000"),
    });

    expect(position.operatingBalance.minor).toBe(308_221n);
    expect(position.protectedCurrentFunds.minor).toBe(60_000n);
    expect(position.freeMoney.minor).toBe(148_221n);
  });

  test("detects cache drift and rejects an unbalanced ledger transaction", () => {
    const account: LedgerAccount = {
      id: "banpro",
      kind: "operational",
      currency: "NIO",
      openingBalance: nio("100"),
      openingBalanceBase: nio("100"),
      currentBalanceCache: nio("99"),
      currentBalanceCacheBase: nio("99"),
    };
    expect(reconcileAccounts([account], []).at(0)?.drift?.native?.minor).toBe(-100n);
    expect(() =>
      validateLedgerTransaction({
        id: "broken",
        occurredOn: "2026-09-15",
        status: "posted",
        entries: [
          { accountId: "banpro", amount: nio("-10"), amountBase: nio("-10") },
          { accountId: "expense", amount: nio("9"), amountBase: nio("9") },
        ],
      }),
    ).toThrow("must balance");
  });

  test("rounds USD conversion after applying the eight-decimal exchange rate", () => {
    expect(toBase(money("USD", "175"), exchangeRate("36.6243"))).toEqual(nio("6409.25"));
  });

  test("requires a captured rate when a ledger entry is in a foreign currency", () => {
    expect(() =>
      validateLedgerTransaction({
        id: "usd-without-rate",
        occurredOn: "2026-09-15",
        status: "posted",
        entries: [
          { accountId: "usd-account", amount: money("USD", "175"), amountBase: nio("6409.25") },
          { accountId: "income", amount: nio("-6409.25"), amountBase: nio("-6409.25") },
        ],
      }),
    ).toThrow("exchange rate");
  });

  test("caps a personal-income saving reservation at net cash after compensation", () => {
    const allocation = allocateIncome(
      {
        id: "income-1",
        fundingPurpose: "PERSONAL_INCOME",
        grossAmount: nio("900"),
        compensationAmount: nio("400"),
      },
      { amount: nio("1000") },
    );
    expect(allocation.cashReceived.minor).toBe(50_000n);
    expect(allocation.savingReserved.minor).toBe(50_000n);
    expect(allocation.savingShortfall.minor).toBe(50_000n);
  });

  test("earmarked income is reserved and does not activate the saving rule", () => {
    const allocation = allocateIncome(
      {
        id: "insurance",
        fundingPurpose: "EARMARKED",
        grossAmount: nio("2197.46"),
        compensationAmount: nio("0"),
        earmarkPurpose: "Seguro",
      },
      { amount: nio("1000") },
    );
    expect(allocation.savingReserved.minor).toBe(0n);
    expect(allocation.earmarkedReserved?.minor).toBe(219_746n);
  });

  test("projects only future planned events before payday", () => {
    const projected = projectFreeMoney({
      currentFreeMoney: nio("1482.21"),
      today: "2026-09-15",
      untilExclusive: "2026-09-27",
      events: [
        { id: "today", occursOn: "2026-09-15", kind: "expense", amount: nio("100"), status: "scheduled" },
        { id: "rent", occursOn: "2026-09-20", kind: "expense", amount: nio("300"), status: "scheduled" },
        { id: "salary", occursOn: "2026-09-27", kind: "income", amount: nio("6409.25"), status: "expected" },
      ],
    });
    expect(projected.minor).toBe(118_221n);
  });
});
