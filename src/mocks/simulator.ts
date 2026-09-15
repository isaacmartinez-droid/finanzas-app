import type { Currency } from "@/types/finance";

export type SpendKind = "personal" | "shared" | "maintenance";

export interface SimulationDraft {
  amount: string;
  currency: Currency;
  concept: string;
  accountId: string;
  kind: SpendKind;
}

/** C$1,100 → margin C$382.21 → "Posible, pero ajustado" in the base scenario. */
export const mockSimulationDraft: SimulationDraft = {
  amount: "1,100.00",
  currency: "NIO",
  concept: "",
  accountId: "acc-banpro",
  kind: "personal",
};

export const spendKindLabels: Record<SpendKind, string> = {
  personal: "Compra personal",
  shared: "Salida compartida",
  maintenance: "Mantenimiento",
};

/** Lightweight keyword hints to pick contextual alternatives from the concept. */
export const spendKindKeywords: Record<Exclude<SpendKind, "personal">, string[]> = {
  shared: ["salida", "cena", "cine", "amigos", "fiesta", "bar", "compartid", "almuerzo", "viaje", "paseo"],
  maintenance: ["repuesto", "aceite", "llanta", "mantenimiento", "moto", "taller", "freno", "reparación", "reparacion"],
};

/** Simulated latency so the loading state is visible. */
export const SIMULATION_LATENCY_MS = 450;
