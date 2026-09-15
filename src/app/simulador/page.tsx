import type { Metadata } from "next";
import { SimulatorView } from "@/features/simulator/SimulatorView";

export const metadata: Metadata = { title: "Simulador" };

export default function SimulatorPage() {
  return <SimulatorView />;
}
