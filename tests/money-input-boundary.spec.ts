import { expect, test } from "@playwright/test";
import { parseCreateAccountInput } from "@/lib/finance-api-request";
import { moneyInputToApiDecimal } from "@/lib/money-input-boundary";

test("converts grouped MoneyInput values to exact API decimals", () => {
  const openingBalance = moneyInputToApiDecimal("1,000.00");

  expect(openingBalance).toBe("1000.00");
  expect(
    parseCreateAccountInput({
      name: "Cuenta principal",
      kind: "operational",
      currency: "NIO",
      openingBalance,
    }).openingBalance.minor,
  ).toBe(100_000n);
});
