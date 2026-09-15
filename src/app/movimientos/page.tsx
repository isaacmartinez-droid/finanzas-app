import type { Metadata } from "next";
import { TransactionsView } from "@/features/transactions/TransactionsView";

export const metadata: Metadata = { title: "Movimientos" };

export default function TransactionsPage() {
  return <TransactionsView />;
}
