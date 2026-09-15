import type { Metadata } from "next";
import { Landmark } from "lucide-react";
import { ComingSoon } from "@/features/placeholder/ComingSoon";

export const metadata: Metadata = { title: "Deudas" };

export default function DebtsPage() {
  return (
    <ComingSoon
      icon={Landmark}
      title="Deudas, en la siguiente fase"
      description="Verás cuotas, saldos pendientes y cómo cada pago afecta tu dinero libre. Por ahora, los compromisos cercanos ya se descuentan en «Hasta mi pago»."
    />
  );
}
