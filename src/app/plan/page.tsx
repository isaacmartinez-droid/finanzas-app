import type { Metadata } from "next";
import { PlanView } from "@/features/plan/PlanView";

export const metadata: Metadata = { title: "Plan" };

export default function PlanPage() {
  return <PlanView />;
}
