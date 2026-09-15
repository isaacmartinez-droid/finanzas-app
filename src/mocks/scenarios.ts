import type { FinanceState, ScenarioId, Transaction } from "@/types/finance";
import {
  mockAccounts,
  mockChangesToday,
  mockComfortDailyTarget,
  mockCommitments,
  mockCushion,
  mockCycleStart,
  mockExchangeRate,
  mockPayday,
  mockReserves,
  mockToday,
} from "./dashboard";
import { mockSavingsGoal } from "./savings";
import { mockUpcomingEvents } from "./timeline";
import { mockTransactions } from "./transactions";

export interface ScenarioMeta {
  id: ScenarioId;
  label: string;
  description: string;
}

export const scenarioList: ScenarioMeta[] = [
  { id: "comfortable", label: "Cómodo", description: "Papá adelantó su ingreso; hay margen de sobra." },
  { id: "tight", label: "Ajustado", description: "Escenario base del 15 Sep: todo cubierto, poco margen." },
  { id: "risk", label: "En riesgo", description: "Una reparación imprevista obliga a tocar el colchón." },
  { id: "deficit", label: "Déficit", description: "Las obligaciones superan el saldo operativo." },
  { id: "extreme", label: "Montos grandes", description: "Cifras de millones para revisar la interfaz." },
];

export const DEFAULT_SCENARIO: ScenarioId = "tight";

function base(): FinanceState {
  return structuredClone({
    today: mockToday,
    cycleStart: mockCycleStart,
    payday: mockPayday,
    exchangeRate: mockExchangeRate,
    cushion: mockCushion,
    comfortDailyTarget: mockComfortDailyTarget,
    accounts: mockAccounts,
    reserves: mockReserves,
    commitments: mockCommitments,
    transactions: [...mockTransactions, ...mockUpcomingEvents],
    changesToday: mockChangesToday,
    savingsGoal: mockSavingsGoal,
  });
}

function setBalance(state: FinanceState, accountId: string, balance: number) {
  const account = state.accounts.find((a) => a.id === accountId);
  if (account) account.balance = balance;
}

const brakeRepair: Transaction = {
  id: "tx-brakes",
  date: mockToday,
  title: "Reparación de frenos",
  categoryId: "maintenance",
  accountId: "acc-banpro",
  type: "expense",
  status: "paid",
  amount: 1000,
  currency: "NIO",
  note: "Imprevisto en el taller.",
};

/** Builds a fresh, internally consistent state for each demo scenario. */
export function buildScenario(id: ScenarioId): FinanceState {
  const state = base();

  switch (id) {
    case "tight":
      return state;

    case "comfortable": {
      // Dad's income arrived five days early: 2,582.21 + 2,600 in Banpro.
      setBalance(state, "acc-banpro", 5182.21);
      const dad = state.transactions.find((t) => t.id === "evt-dad");
      if (dad) {
        dad.date = mockToday;
        dad.status = "received";
        dad.note = "Llegó cinco días antes de lo esperado.";
      }
      state.changesToday.push({ id: "chg-dad", label: "Ingreso papá (adelantado)", delta: 2600 });
      return state;
    }

    case "risk": {
      // Brake repair paid today + a card installment due before payday.
      setBalance(state, "acc-banpro", 1582.21);
      state.transactions.unshift(brakeRepair);
      state.commitments = [{ id: "com-card", name: "Cuota tarjeta", amount: 700, dueDate: "2026-09-25" }];
      state.changesToday.push({ id: "chg-brakes", label: "Reparación de frenos", delta: -1000 });
      return state;
    }

    case "deficit": {
      setBalance(state, "acc-banpro", 650);
      state.transactions.unshift(brakeRepair, {
        id: "tx-late-fee",
        date: mockToday,
        title: "Pago atrasado de tarjeta",
        categoryId: "services",
        accountId: "acc-banpro",
        type: "expense",
        status: "paid",
        amount: 932.21,
        currency: "NIO",
      });
      state.commitments = [
        { id: "com-card", name: "Cuota tarjeta", amount: 700, dueDate: "2026-09-25" },
        { id: "com-moto", name: "Préstamo moto", amount: 800, dueDate: "2026-09-26" },
      ];
      state.changesToday.push(
        { id: "chg-brakes", label: "Reparación de frenos", delta: -1000 },
        { id: "chg-late", label: "Pago atrasado de tarjeta", delta: -932.21 },
      );
      return state;
    }

    case "extreme": {
      setBalance(state, "acc-banpro", 9_502_582.21);
      setBalance(state, "acc-savings", 950_000);
      state.savingsGoal = { name: "Casa propia", target: 9_500_000 };
      state.payday = { ...state.payday, amount: 999_999.99 };
      const salary = state.transactions.find((t) => t.id === "evt-salary");
      if (salary) salary.amount = 999_999.99;
      state.transactions.unshift({
        id: "tx-land",
        date: mockToday,
        title: "Venta de terreno familiar",
        categoryId: "family",
        accountId: "acc-banpro",
        type: "income",
        status: "received",
        amount: 9_500_000,
        currency: "NIO",
      });
      state.changesToday.push({ id: "chg-land", label: "Venta de terreno familiar", delta: 9_500_000 });
      return state;
    }
  }
}
