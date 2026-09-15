import type { FinancialStatus, TransactionStatus } from "@/types/finance";

export type Tone = "neutral" | "positive" | "warning" | "risk" | "deficit" | "saving" | "info" | "outline";

export const FINANCIAL_STATUS: Record<FinancialStatus, { label: string; tone: Tone; description: string }> = {
  comfortable: {
    label: "Cómodo",
    tone: "positive",
    description: "Existe margen suficiente hasta tu próximo pago.",
  },
  tight: {
    label: "Ajustado",
    tone: "warning",
    description: "Todavía tienes dinero libre, pero queda poco margen.",
  },
  risk: {
    label: "En riesgo",
    tone: "risk",
    description: "Alguna protección podría comprometerse.",
  },
  deficit: {
    label: "Déficit",
    tone: "deficit",
    description: "Tus obligaciones superan el dinero disponible.",
  },
};

export const TRANSACTION_STATUS: Record<TransactionStatus, { label: string; tone: Tone }> = {
  paid: { label: "Pagado", tone: "neutral" },
  received: { label: "Recibido", tone: "positive" },
  expected: { label: "Esperado", tone: "info" },
  scheduled: { label: "Programado", tone: "outline" },
  omitted: { label: "Omitido esta semana", tone: "neutral" },
  reserved: { label: "Reservado", tone: "saving" },
  transferred: { label: "Transferido", tone: "info" },
};
