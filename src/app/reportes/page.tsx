import type { Metadata } from "next";
import { ChartColumn } from "lucide-react";
import { ComingSoon } from "@/features/placeholder/ComingSoon";

export const metadata: Metadata = { title: "Reportes" };

export default function ReportsPage() {
  return (
    <ComingSoon
      icon={ChartColumn}
      title="Reportes, en la siguiente fase"
      description="Resúmenes del mes para entender en qué se fue tu dinero, sin tablas interminables."
    />
  );
}
