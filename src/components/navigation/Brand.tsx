import { cn } from "@/lib/cn";

/**
 * Isotipo: a single stroke that dips and rises into a dot — money
 * flowing forward. 34×34, radius 10, primary blue (spec §20).
 */
export function Logo({ className, size = 34 }: { className?: string; size?: number }) {
  return (
    <svg
      viewBox="0 0 34 34"
      width={size}
      height={size}
      aria-hidden
      className={cn("shrink-0", className)}
    >
      <rect width="34" height="34" rx="10" fill="var(--primary-solid)" />
      <path
        d="M8 20.5c2.6 0 3.6-7 7.2-7s3.3 5.5 6.3 5.5c1.9 0 2.9-2.2 3.9-4.2"
        fill="none"
        stroke="#fff"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="25.6" cy="12.4" r="2.1" fill="#fff" />
      <path d="M8 25h18" stroke="#fff" strokeOpacity=".45" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export function Avatar({ initials, className }: { initials: string; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "grid size-[34px] shrink-0 place-items-center rounded-full bg-saving-bg text-[13px] font-bold text-saving ring-1 ring-line",
        className,
      )}
    >
      {initials}
    </span>
  );
}
