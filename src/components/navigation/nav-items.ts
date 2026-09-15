import {
  ArrowLeftRight,
  CalendarClock,
  ChartColumn,
  House,
  Landmark,
  ListChecks,
  PiggyBank,
  Settings,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  /** Shorter label for the 72px rail. */
  shortLabel?: string;
  icon: LucideIcon;
}

/** Mobile bottom nav (the + sits between the 2nd and 3rd item). */
export const PRIMARY_NAV: NavItem[] = [
  { href: "/", label: "Inicio", icon: House },
  { href: "/hasta-mi-pago", label: "Hasta mi pago", shortLabel: "Mi pago", icon: CalendarClock },
  { href: "/movimientos", label: "Movimientos", icon: ArrowLeftRight },
  { href: "/plan", label: "Plan", icon: ListChecks },
];

/** Desktop sidebar (spec §73). */
export const SIDEBAR_NAV: NavItem[] = [
  ...PRIMARY_NAV,
  { href: "/ahorro", label: "Ahorro", icon: PiggyBank },
  { href: "/deudas", label: "Deudas", icon: Landmark },
  { href: "/reportes", label: "Reportes", icon: ChartColumn },
  { href: "/configuracion", label: "Configuración", shortLabel: "Ajustes", icon: Settings },
];

/** Titles for routes; the simulator is intentionally not a nav item (spec §24). */
export const PAGE_TITLES: Record<string, string> = {
  "/": "Inicio",
  "/hasta-mi-pago": "Hasta mi pago",
  "/movimientos": "Movimientos",
  "/simulador": "Simulador",
  "/plan": "Plan",
  "/ahorro": "Ahorro",
  "/deudas": "Deudas",
  "/reportes": "Reportes",
  "/configuracion": "Configuración",
};

export function isActive(pathname: string, href: string): boolean {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}
