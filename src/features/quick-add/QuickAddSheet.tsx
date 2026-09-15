"use client";

import { useRouter } from "next/navigation";
import { ArrowDownLeft, ArrowLeftRight, ArrowUpRight, Calculator, ChevronRight, Lock, type LucideIcon } from "lucide-react";
import { Sheet } from "@/components/ui/Sheet";
import { cn } from "@/lib/cn";
import { useShell, type FormMode } from "@/hooks/use-shell";

interface Option {
  id: FormMode | "simulate";
  label: string;
  description: string;
  icon: LucideIcon;
  iconClass: string;
}

const OPTIONS: Option[] = [
  { id: "expense", label: "Registrar gasto", description: "Algo que ya pagaste", icon: ArrowUpRight, iconClass: "bg-neutral-bg text-neutral" },
  { id: "income", label: "Registrar ingreso", description: "Dinero que ya recibiste", icon: ArrowDownLeft, iconClass: "bg-positive-bg text-positive" },
  { id: "reserve", label: "Reservar dinero", description: "Apártalo sin moverlo de tu cuenta", icon: Lock, iconClass: "bg-saving-bg text-saving" },
  { id: "transfer", label: "Transferir", description: "Entre tus cuentas o hacia tu ahorro", icon: ArrowLeftRight, iconClass: "bg-info-bg text-info" },
  { id: "simulate", label: "Simular compra", description: "¿Puedo gastar esto? Antes de comprar", icon: Calculator, iconClass: "bg-primary-soft text-primary" },
];

/** The "+" menu (spec §23). Bottom sheet on phones, dialog on larger screens. */
export function QuickAddSheet() {
  const { quickAddOpen, closeQuickAdd, openForm } = useShell();
  const router = useRouter();

  return (
    <Sheet open={quickAddOpen} onClose={closeQuickAdd} title="¿Qué quieres hacer?" size="sm">
      <ul className="-mx-1 space-y-1">
        {OPTIONS.map((o) => {
          const Icon = o.icon;
          return (
            <li key={o.id}>
              <button
                type="button"
                onClick={() => {
                  if (o.id === "simulate") {
                    closeQuickAdd();
                    router.push("/simulador");
                  } else {
                    openForm(o.id);
                  }
                }}
                className={cn(
                  "flex min-h-[60px] w-full items-center gap-3 rounded-[12px] px-2 py-2 text-left transition-colors duration-150 hover:bg-subtle",
                  o.id === "simulate" && "mt-2 border-t border-line pt-3",
                )}
              >
                <span className={cn("grid size-10 shrink-0 place-items-center rounded-[10px]", o.iconClass)}>
                  <Icon aria-hidden size={18} strokeWidth={1.8} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[15px] font-semibold leading-5 text-ink">{o.label}</span>
                  <span className="block text-[13px] leading-5 text-ink-2">{o.description}</span>
                </span>
                <ChevronRight aria-hidden size={16} strokeWidth={1.8} className="shrink-0 text-ink-3" />
              </button>
            </li>
          );
        })}
      </ul>
    </Sheet>
  );
}
