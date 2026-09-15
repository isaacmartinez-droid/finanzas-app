import type { Transaction } from "@/types/finance";

/**
 * Upcoming events until (and including) payday. Expected income is
 * part of the projection only — it never adds to today's free money.
 */
export const mockUpcomingEvents: Transaction[] = [
  {
    id: "evt-dad",
    date: "2026-09-20",
    title: "Ingreso papá",
    categoryId: "family",
    accountId: "acc-banpro",
    type: "income",
    status: "expected",
    amount: 2600,
    currency: "NIO",
    recurrence: { frequency: "Mensual" },
    breakdown: [
      { label: "Bruto", amount: 3000 },
      { label: "Compensación", amount: -400 },
    ],
    note: "La compensación descuenta lo que te adelantó en agosto.",
  },
  {
    id: "evt-food",
    date: "2026-09-22",
    title: "Comida",
    categoryId: "food",
    accountId: "acc-banpro",
    type: "expense",
    status: "scheduled",
    amount: 1000,
    currency: "NIO",
    recurrence: { frequency: "Semanal" },
  },
  {
    id: "evt-salary",
    date: "2026-09-27",
    title: "Salario",
    categoryId: "salary",
    accountId: "acc-banpro",
    type: "income",
    status: "expected",
    amount: 175,
    currency: "USD",
    recurrence: { frequency: "Quincenal" },
  },
  {
    id: "evt-savings-transfer",
    date: "2026-09-27",
    title: "Transferencia a ahorro",
    categoryId: "savings",
    accountId: "acc-banpro",
    toAccountId: "acc-savings",
    type: "transfer",
    status: "scheduled",
    amount: 600,
    currency: "NIO",
    note: "Sale de tu reserva «Ahorro por transferir»; no cambia tu dinero libre.",
  },
];
