import type { FinanceState, FinancialSnapshot, FinancialStatus } from "@/types/finance";
import type { ProtectionRow } from "@/components/financial/ProtectionList";
import { computeStatus } from "@/lib/finance";
import { round2, toNio } from "@/lib/format";
import { spendKindKeywords, type SpendKind } from "@/mocks/simulator";

export type SimulationOutcome = "safe" | "tight" | "not-recommended";

export interface SimulationResultData {
  outcome: SimulationOutcome;
  amountNio: number;
  /** Free money left after the purchase — shown as "Margen libre después de comprar". */
  marginAfter: number;
  statusAfter: FinancialStatus;
  protections: ProtectionRow[];
  /** Set when the chosen account can't cover the purchase. */
  insufficientAccount?: { name: string; balance: number };
}

const OUTCOME_BY_STATUS: Record<FinancialStatus, SimulationOutcome> = {
  comfortable: "safe",
  tight: "tight",
  risk: "not-recommended",
  deficit: "not-recommended",
};

/**
 * Pure: evaluates a purchase against the same canonical rules the rest of
 * the app uses. Shortfalls eat the cushion first, then reserves, then
 * commitments — which is exactly what the protections list reports.
 */
export function simulatePurchase(
  state: FinanceState,
  snapshot: FinancialSnapshot,
  input: { amountNio: number; accountId: string },
): SimulationResultData {
  const amount = round2(input.amountNio);
  const marginAfter = round2(snapshot.free - amount);
  const statusAfter = computeStatus({
    operating: snapshot.operating - amount,
    reserved: snapshot.reserved,
    committed: snapshot.committed,
    free: marginAfter,
    comfortThreshold: snapshot.comfortThreshold,
  });

  let uncovered = Math.max(0, -marginAfter);
  const cushionUsed = Math.min(snapshot.cushion, uncovered);
  uncovered -= cushionUsed;

  const protections: ProtectionRow[] = [
    { id: "savings", label: "Ahorro protegido", detail: "No se toca", amount: snapshot.protectedSavings, state: "kept" },
  ];

  for (const r of state.reserves) {
    const used = Math.min(r.amount, uncovered);
    uncovered -= used;
    protections.push(
      used > 0
        ? { id: r.id, label: r.name, detail: "Tendrías que usar esta reserva", amount: round2(r.amount - used), state: "affected" }
        : { id: r.id, label: r.name, detail: "Cubierta", amount: r.amount, state: "kept" },
    );
  }

  for (const c of state.commitments) {
    const used = Math.min(c.amount, uncovered);
    uncovered -= used;
    protections.push(
      used > 0
        ? { id: c.id, label: c.name, detail: "Quedaría sin cubrir", amount: round2(c.amount - used), state: "affected" }
        : { id: c.id, label: c.name, detail: "Cubierto", amount: c.amount, state: "kept" },
    );
  }

  protections.push(
    cushionUsed > 0
      ? { id: "cushion", label: "Colchón operativo", detail: "Bajaría de su mínimo", amount: round2(snapshot.cushion - cushionUsed), state: "affected" }
      : { id: "cushion", label: "Colchón operativo", detail: "Se mantiene", state: "kept" },
  );

  protections.push({
    id: "margin",
    label: "Margen para imprevistos",
    detail: marginAfter < 0 ? "Sin margen" : statusAfter === "comfortable" ? "Suficiente" : "Reducido",
    amount: marginAfter,
    state: marginAfter < 0 ? "affected" : statusAfter === "comfortable" ? "kept" : "reduced",
  });

  const account = state.accounts.find((a) => a.id === input.accountId);
  const insufficientAccount = account && account.balance < amount ? { name: account.name, balance: account.balance } : undefined;

  return {
    outcome: insufficientAccount ? "not-recommended" : OUTCOME_BY_STATUS[statusAfter],
    amountNio: amount,
    marginAfter,
    statusAfter,
    protections,
    insufficientAccount,
  };
}

export function detectSpendKind(concept: string): SpendKind {
  const text = concept.toLowerCase();
  if (spendKindKeywords.shared.some((k) => text.includes(k))) return "shared";
  if (spendKindKeywords.maintenance.some((k) => text.includes(k))) return "maintenance";
  return "personal";
}

export type AlternativeAction = "select" | "edit" | "postpone" | "reserve";

export interface AlternativeOption {
  id: string;
  label: string;
  action: AlternativeAction;
  /** Effective amount (NIO) when this option is chosen. */
  amountNio?: number;
  marginAfter?: number;
  statusAfter?: FinancialStatus;
  /** Extra numeric context rendered by the component (kept numeric so privacy mode can mask it). */
  perDay?: number;
  afterPaydayMargin?: number;
}

/** Contextual alternatives — "Dividir 50/50" only makes sense for shared outings (spec §60). */
export function buildAlternatives(
  kind: SpendKind,
  amountNio: number,
  state: FinanceState,
  snapshot: FinancialSnapshot,
): AlternativeOption[] {
  const option = (id: string, label: string, amount: number): AlternativeOption => {
    const margin = round2(snapshot.free - amount);
    return {
      id,
      label,
      action: "select",
      amountNio: amount,
      marginAfter: margin,
      statusAfter: computeStatus({
        operating: snapshot.operating - amount,
        reserved: snapshot.reserved,
        committed: snapshot.committed,
        free: margin,
        comfortThreshold: snapshot.comfortThreshold,
      }),
    };
  };
  const salaryNio = toNio(state.payday.amount, state.payday.currency, state.exchangeRate);
  const postpone: AlternativeOption = {
    id: "postpone",
    label: "Posponer al salario",
    action: "postpone",
    afterPaydayMargin: round2(snapshot.projection.amount + salaryNio - amountNio),
  };

  switch (kind) {
    case "shared":
      return [
        option("full", "Yo pago todo", amountNio),
        option("split", "Dividir 50/50", round2(amountNio / 2)),
        { id: "mine", label: "Ingresar mi parte", action: "edit" },
      ];
    case "maintenance":
      return [
        option("full", "Pagar completo", amountNio),
        {
          id: "reserve",
          label: "Reservar primero",
          action: "reserve",
          perDay: Math.ceil(amountNio / snapshot.daysRemaining),
        },
        postpone,
      ];
    default:
      return [option("now", "Comprar ahora", amountNio), { id: "other", label: "Probar otro monto", action: "edit" }, postpone];
  }
}
