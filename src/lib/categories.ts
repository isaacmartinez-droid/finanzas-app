import {
  ArrowLeftRight,
  Banknote,
  Fuel,
  HandCoins,
  PiggyBank,
  Pill,
  ShoppingCart,
  Tag,
  Users,
  Utensils,
  Wifi,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import type { CategoryId, TransactionType } from "@/types/finance";

export interface CategoryMeta {
  id: CategoryId;
  label: string;
  icon: LucideIcon;
}

export const CATEGORIES: Record<CategoryId, CategoryMeta> = {
  food: { id: "food", label: "Alimentación", icon: Utensils },
  groceries: { id: "groceries", label: "Alimentación", icon: ShoppingCart },
  maintenance: { id: "maintenance", label: "Mantenimiento", icon: Wrench },
  transport: { id: "transport", label: "Transporte", icon: Fuel },
  health: { id: "health", label: "Salud", icon: Pill },
  services: { id: "services", label: "Servicios", icon: Wifi },
  leisure: { id: "leisure", label: "Ocio", icon: Users },
  salary: { id: "salary", label: "Salario", icon: Banknote },
  family: { id: "family", label: "Familia", icon: HandCoins },
  savings: { id: "savings", label: "Ahorro", icon: PiggyBank },
  transfer: { id: "transfer", label: "Transferencia", icon: ArrowLeftRight },
  other: { id: "other", label: "Otros", icon: Tag },
};

/** Categories offered when registering, by movement type. */
export const CATEGORY_OPTIONS: Record<"expense" | "income", CategoryId[]> = {
  expense: ["food", "maintenance", "transport", "health", "services", "leisure", "other"],
  income: ["salary", "family", "other"],
};

export const TYPE_LABEL: Record<TransactionType, string> = {
  expense: "Gasto",
  income: "Ingreso",
  reserve: "Reserva",
  transfer: "Transferencia",
};
