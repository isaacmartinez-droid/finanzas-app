import type { ISODate } from "@/types/finance";

const MONTHS_SHORT = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
const MONTHS_LONG = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
];
const WEEKDAYS_SHORT = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const WEEKDAYS_LONG = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];

const DAY_MS = 86_400_000;

/** Parses `YYYY-MM-DD` as a local calendar date (no timezone drift). */
export function parseISODate(iso: ISODate): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function toISODate(date: Date): ISODate {
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${m}-${d}`;
}

export function addDays(iso: ISODate, days: number): ISODate {
  const date = parseISODate(iso);
  date.setDate(date.getDate() + days);
  return toISODate(date);
}

/** Whole days from `from` to `to` (positive when `to` is later). */
export function daysBetween(from: ISODate, to: ISODate): number {
  return Math.round((parseISODate(to).getTime() - parseISODate(from).getTime()) / DAY_MS);
}

/** "15 Sep" */
export function formatDayMonth(iso: ISODate): string {
  const d = parseISODate(iso);
  return `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`;
}

/** "Mar 15 Sep" */
export function formatWeekdayDayMonth(iso: ISODate): string {
  const d = parseISODate(iso);
  return `${WEEKDAYS_SHORT[d.getDay()]} ${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`;
}

/** "martes, 15 de septiembre de 2026" */
export function formatLongDate(iso: ISODate): string {
  const d = parseISODate(iso);
  return `${WEEKDAYS_LONG[d.getDay()]}, ${d.getDate()} de ${MONTHS_LONG[d.getMonth()]} de ${d.getFullYear()}`;
}

/** "Septiembre 2026" */
export function formatMonthYear(iso: ISODate): string {
  const d = parseISODate(iso);
  const month = MONTHS_LONG[d.getMonth()];
  return `${month[0].toUpperCase()}${month.slice(1)} ${d.getFullYear()}`;
}

export function relativeDayLabel(iso: ISODate, today: ISODate): "Hoy" | "Ayer" | "Mañana" | null {
  const diff = daysBetween(today, iso);
  if (diff === 0) return "Hoy";
  if (diff === -1) return "Ayer";
  if (diff === 1) return "Mañana";
  return null;
}

/** "Hoy", "Ayer", "Mañana" or "15 Sep". */
export function formatRelativeDay(iso: ISODate, today: ISODate): string {
  return relativeDayLabel(iso, today) ?? formatDayMonth(iso);
}

export function pluralDays(n: number): string {
  return n === 1 ? "1 día" : `${n} días`;
}
