import { expect, test } from "@playwright/test";
import { validateLedgerTransaction } from "../src/domain/financial-engine/engine";
import { isUniqueViolation } from "../src/db/repositories/account-repository";
import {
  FinanceApiInputError,
  parseAccountId,
  parseCreateAccountInput,
  parsePostMovementInput,
  parsePostLedgerTransactionInput,
  parseRenameAccountInput,
} from "../src/lib/finance-api-request";

test.describe("Finance API request contract", () => {
  test("recognizes a unique-constraint error wrapped by Drizzle", () => {
    expect(isUniqueViolation({ cause: { code: "23505" } })).toBe(true);
    expect(isUniqueViolation({ cause: { code: "22001" } })).toBe(false);
  });

  test("normalizes a renamed account and validates its identifier", () => {
    expect(parseRenameAccountInput({ name: "  Ahorro personal  " })).toEqual({
      name: "Ahorro personal",
      normalizedName: "ahorro personal",
    });
    expect(parseAccountId("7b1c1f2d-3894-4cfe-b922-79b6a60c0e11")).toBe("7b1c1f2d-3894-4cfe-b922-79b6a60c0e11");
    expect(() => parseAccountId("not-an-account")).toThrow(FinanceApiInputError);
  });

  test("parses an exact USD movement and rejects a transfer to itself", () => {
    const movement = parsePostMovementInput({
      operationId: "4a7b0044-3ad4-4a4f-a6fc-a4b60fc932fe",
      occurredOn: "2026-09-17",
      type: "income",
      title: "Venta",
      categoryId: "other",
      accountId: "7b1c1f2d-3894-4cfe-b922-79b6a60c0e11",
      currency: "USD",
      amount: "175.00",
      exchangeRate: "36.6243",
    });
    expect(movement.amountBase.minor).toBe(640_925n);

    expect(() => parsePostMovementInput({
      operationId: "4a7b0044-3ad4-4a4f-a6fc-a4b60fc932fe",
      occurredOn: "2026-09-17",
      type: "transfer",
      title: "Mover dinero",
      categoryId: "transfer",
      accountId: "7b1c1f2d-3894-4cfe-b922-79b6a60c0e11",
      toAccountId: "7b1c1f2d-3894-4cfe-b922-79b6a60c0e11",
      currency: "NIO",
      amount: "100.00",
    })).toThrow(FinanceApiInputError);
  });

  test("calculates an account opening balance in NIO exactly on the server", () => {
    const account = parseCreateAccountInput({
      name: "  Cuenta USD  ",
      kind: "operational",
      currency: "USD",
      openingBalance: "175.00",
      exchangeRate: "36.6243",
    });

    expect(account.name).toBe("Cuenta USD");
    expect(account.normalizedName).toBe("cuenta usd");
    expect(account.openingBalance.minor).toBe(17_500n);
    expect(account.openingBalanceBase.minor).toBe(640_925n);
  });

  test("rejects unsafe monetary and exchange-rate combinations", () => {
    expect(() => parseCreateAccountInput({
      name: "Caja",
      kind: "operational",
      currency: "NIO",
      openingBalance: "100.001",
    })).toThrow(FinanceApiInputError);

    expect(() => parseCreateAccountInput({
      name: "Caja",
      kind: "operational",
      currency: "NIO",
      openingBalance: "100.00",
      exchangeRate: "1",
    })).toThrow(FinanceApiInputError);
  });

  test("requires a balanced, dated ledger fact after parsing the HTTP body", () => {
    const parsed = parsePostLedgerTransactionInput({
      operationId: "ab7601cf-4107-4e8b-8b1c-8a4f9e3aa9d9",
      occurredOn: "2026-09-17",
      entries: [
        {
          accountId: "7b1c1f2d-3894-4cfe-b922-79b6a60c0e11",
          currency: "NIO",
          amount: "-100.00",
          amountBase: "-100.00",
        },
        {
          accountId: "f75a2f29-3636-4c97-b854-52c2024ea803",
          currency: "NIO",
          amount: "100.00",
          amountBase: "100.00",
        },
      ],
    });
    expect(parsed.transaction.id).toMatch(/^[0-9a-f-]{36}$/i);
    expect(() => validateLedgerTransaction(parsed.transaction)).not.toThrow();

    const unbalanced = parsePostLedgerTransactionInput({
      operationId: "d7e3bd5b-99cf-4dc5-a88d-88cb2f49a1dd",
      occurredOn: "2026-02-28",
      entries: [
        {
          accountId: "7b1c1f2d-3894-4cfe-b922-79b6a60c0e11",
          currency: "NIO",
          amount: "-100.00",
          amountBase: "-100.00",
        },
        {
          accountId: "f75a2f29-3636-4c97-b854-52c2024ea803",
          currency: "NIO",
          amount: "99.00",
          amountBase: "99.00",
        },
      ],
    });
    expect(() => validateLedgerTransaction(unbalanced.transaction)).toThrow("must balance");

    expect(() => parsePostLedgerTransactionInput({
      operationId: "d7e3bd5b-99cf-4dc5-a88d-88cb2f49a1dd",
      occurredOn: "2026-02-29",
      entries: [
        {
          accountId: "7b1c1f2d-3894-4cfe-b922-79b6a60c0e11",
          currency: "NIO",
          amount: "-100.00",
          amountBase: "-100.00",
        },
        {
          accountId: "f75a2f29-3636-4c97-b854-52c2024ea803",
          currency: "NIO",
          amount: "100.00",
          amountBase: "100.00",
        },
      ],
    })).toThrow(FinanceApiInputError);
  });
});
