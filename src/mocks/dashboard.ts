import type { Account, Commitment, DailyChange, Payday, Reserve } from "@/types/finance";
import { MOCK_TODAY } from "./user";

/**
 * Base scenario — 15 Sep 2026.
 *
 *   Saldo operativo   3,082.21  (Banpro 2,582.21 + Efectivo 500)
 *   Reservado          −600.00  (ahorro por transferir)
 *   Comprometido          0.00
 *   Colchón          −1,000.00
 *   ─────────────────────────
 *   Dinero libre      1,482.21
 *
 * Ahorro protegido (2,100) lives in a separate savings account and is
 * never part of the operating balance.
 */

export const mockAccounts: Account[] = [
  { id: "acc-banpro", name: "Banpro Córdobas", shortName: "Banpro", kind: "operational", balance: 2582.21 },
  { id: "acc-cash", name: "Efectivo", shortName: "Efectivo", kind: "operational", balance: 500 },
  { id: "acc-savings", name: "Cuenta de ahorro", shortName: "Ahorro", kind: "savings", balance: 2100 },
];

export const mockReserves: Reserve[] = [
  {
    id: "res-savings-transfer",
    name: "Ahorro por transferir",
    amount: 600,
    purpose: "savings",
    accountId: "acc-banpro",
    targetDate: "2026-09-27",
    note: "Se mueve a tu cuenta de ahorro cuando llegue el salario.",
  },
];

export const mockCommitments: Commitment[] = [];

export const mockCushion = 1000;

/** ≈ C$150/día is considered comfortable → C$1,800 for 12 days. */
export const mockComfortDailyTarget = 150;

/** NIO per USD. US$175 × 36.6243 ≈ C$6,409. */
export const mockExchangeRate = 36.6243;

export const mockPayday: Payday = {
  date: "2026-09-27",
  label: "Salario",
  amount: 175,
  currency: "USD",
};

export const mockCycleStart = "2026-09-12";

/**
 * Why free money moved since yesterday (782.21 → 1,482.21):
 * this week's food reserve was released and the oil change was paid.
 */
export const mockChangesToday: DailyChange[] = [
  { id: "chg-food", label: "Comida omitida", delta: 1000 },
  { id: "chg-oil", label: "Cambio de aceite", delta: -300 },
];

export const mockToday = MOCK_TODAY;
