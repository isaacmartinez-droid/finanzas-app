import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { FinancialSnapshot, ISODate } from "@/types/finance";
import { Alert, type AlertTone } from "@/components/ui/Feedback";
import { formatDayMonth } from "@/lib/dates";
import { MoneyValue } from "./MoneyValue";

export interface FinancialAlertProps {
  snapshot: FinancialSnapshot;
  paydayDate: ISODate;
  comfortDailyTarget: number;
  detailHref?: string;
  className?: string;
}

/** The single most important message for the current state (spec §29: max one alert). */
export function FinancialAlert({ snapshot, paydayDate, comfortDailyTarget, detailHref, className }: FinancialAlertProps) {
  const date = formatDayMonth(paydayDate);
  const perDay = Math.floor(Math.max(0, snapshot.free) / snapshot.daysRemaining);

  let tone: AlertTone;
  let title: string;
  let body: React.ReactNode;

  switch (snapshot.status) {
    case "comfortable":
      tone = "positive";
      title = `Todo está cubierto hasta el ${date}`;
      body = (
        <>
          Reservas, compromisos y colchón están protegidos. Tu dinero libre cubre ≈
          <MoneyValue amount={perDay} tone="inherit" className="font-semibold text-ink" /> por día.
        </>
      );
      break;
    case "tight":
      tone = "warning";
      title = "Poco margen tras reservas";
      body = (
        <>
          Después de reservas y colchón te quedan ≈
          <MoneyValue amount={perDay} tone="inherit" className="font-semibold text-ink" /> por día hasta el {date}. Lo
          cómodo sería <MoneyValue amount={comfortDailyTarget} tone="inherit" className="font-semibold text-ink" /> por día.
        </>
      );
      break;
    case "risk":
      tone = "risk";
      title = "Tu colchón está en juego";
      body = (
        <>
          Para cubrir reservas y compromisos te faltan{" "}
          <MoneyValue amount={snapshot.shortfall} tone="inherit" className="font-semibold text-ink" />. Evita gastos no
          esenciales hasta el {date}.
        </>
      );
      break;
    case "deficit":
      tone = "deficit";
      title = "Tus obligaciones superan tu saldo";
      body = (
        <>
          Reservas y compromisos suman{" "}
          <MoneyValue amount={snapshot.reserved + snapshot.committed} tone="inherit" className="font-semibold text-ink" />,
          pero tu saldo operativo es <MoneyValue amount={snapshot.operating} tone="inherit" className="font-semibold text-ink" />.
        </>
      );
      break;
  }

  return (
    <Alert
      tone={tone}
      title={title}
      className={className}
      action={
        detailHref && snapshot.status !== "comfortable" ? (
          <Link
            href={detailHref}
            className="-ml-2 inline-flex min-h-11 items-center gap-0.5 rounded-lg px-2 text-[14px] font-semibold text-primary hover:bg-surface/60"
          >
            Ver detalle
            <ChevronRight aria-hidden size={16} strokeWidth={1.8} />
          </Link>
        ) : undefined
      }
    >
      {body}
    </Alert>
  );
}
