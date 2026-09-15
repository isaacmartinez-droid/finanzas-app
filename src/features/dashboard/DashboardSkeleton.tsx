import { Card } from "@/components/ui/Card";
import { LoadingRegion, Skeleton } from "@/components/ui/Feedback";
import s from "./dashboard.module.css";

/** Same grid and approximate heights as the real dashboard → no layout shift. */
export function DashboardSkeleton() {
  return (
    <LoadingRegion label="Cargando tu resumen…" className={s.grid}>
      <Card padding="hero" className={s.hero}>
        <div className="flex justify-between">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
        <Skeleton className="mt-3 h-10 w-52" />
        <Skeleton className="mt-3 h-4 w-60" />
        <Skeleton className="mt-1.5 h-4 w-28" />
        <Skeleton className="mt-4 h-[116px] w-full rounded-inner" />
        <Skeleton className="mt-3 h-12 w-full rounded-inner" />
      </Card>
      <div className={`${s.actions} grid grid-cols-4 gap-2`}>
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-[70px] rounded-[14px]" />
        ))}
      </div>
      <Skeleton className={`${s.alert} h-[104px] rounded-card`} />
      <Card className={s.next}>
        <Skeleton className="h-4 w-32" />
        <Skeleton className="mt-3 h-5 w-40" />
        <Skeleton className="mt-4 h-24 w-full" />
      </Card>
      <Card className={s.timeline}>
        <Skeleton className="h-5 w-40" />
        {[0, 1, 2].map((i) => (
          <div key={i} className="mt-5 flex gap-3">
            <Skeleton className="size-[22px] rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3.5 w-24" />
              <Skeleton className="h-4 w-full" />
            </div>
          </div>
        ))}
      </Card>
      <Card className={s.savings}>
        <Skeleton className="h-4 w-32" />
        <Skeleton className="mt-2 h-7 w-28" />
        <Skeleton className="mt-4 h-2 w-full rounded-full" />
        <Skeleton className="mt-4 h-4 w-52" />
      </Card>
      <Card className={s.recent}>
        <Skeleton className="h-5 w-48" />
        {[0, 1, 2].map((i) => (
          <div key={i} className="mt-4 flex gap-3">
            <Skeleton className="size-[38px] rounded-[10px]" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-3.5 w-1/2" />
            </div>
          </div>
        ))}
      </Card>
    </LoadingRegion>
  );
}
