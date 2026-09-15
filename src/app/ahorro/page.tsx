import type { Metadata } from "next";
import { SavingsView } from "@/features/savings/SavingsView";

export const metadata: Metadata = { title: "Ahorro" };

export default function SavingsPage() {
  return <SavingsView />;
}
