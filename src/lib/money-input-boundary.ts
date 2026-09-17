/** Converts the grouped value shown by MoneyInput into the API's canonical decimal form. */
export function moneyInputToApiDecimal(value: string): string {
  return value.replace(/,/g, "").trim();
}
