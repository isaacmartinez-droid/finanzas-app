import type { Metadata } from "next";
import { CashFlowView } from "@/features/cash-flow/CashFlowView";

export const metadata: Metadata = { title: "Hasta mi pago" };

export default function CashFlowPage() {
  return <CashFlowView />;
}
