import type { FinancialStatus, TransactionStatus } from "@/types/finance";
import { Badge } from "@/components/ui/Badge";
import { FINANCIAL_STATUS, TRANSACTION_STATUS } from "@/lib/status";

export function FinancialStatusBadge({
  status,
  size = "md",
  className,
}: {
  status: FinancialStatus;
  size?: "sm" | "md";
  className?: string;
}) {
  const meta = FINANCIAL_STATUS[status];
  return (
    <Badge tone={meta.tone} dot size={size} className={className}>
      <span className="sr-only">Estado: </span>
      {meta.label}
    </Badge>
  );
}

export function TransactionStatusBadge({
  status,
  short,
  className,
}: {
  status: TransactionStatus;
  /** "Omitido" instead of "Omitido esta semana" for narrow table cells. */
  short?: boolean;
  className?: string;
}) {
  const meta = TRANSACTION_STATUS[status];
  return (
    <Badge tone={meta.tone} className={className}>
      {short ? meta.label.split(" ")[0] : meta.label}
    </Badge>
  );
}
