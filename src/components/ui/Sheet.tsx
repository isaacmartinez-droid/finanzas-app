"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";
import { IconButton } from "./IconButton";

let openSheets = 0;
function lockScroll() {
  if (openSheets++ === 0) {
    const gap = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = "hidden";
    if (gap > 0) document.body.style.paddingRight = `${gap}px`;
  }
}
function unlockScroll() {
  if (--openSheets <= 0) {
    openSheets = 0;
    document.body.style.overflow = "";
    document.body.style.paddingRight = "";
  }
}

const FOCUSABLE =
  'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

export interface SheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  /** How the sheet adapts on ≥768px: centered dialog or right-side drawer. */
  desktop?: "dialog" | "drawer";
  size?: "sm" | "md" | "lg";
  initialFocusRef?: React.RefObject<HTMLElement | null>;
}

const DESKTOP_WIDTH = { sm: "md:w-[min(92vw,400px)]", md: "md:w-[min(92vw,480px)]", lg: "md:w-[min(92vw,560px)]" };

/**
 * Bottom sheet on phones; dialog or drawer on tablet/desktop (spec §65).
 * Focus is trapped, Escape and the scrim close it, focus returns to the trigger.
 */
export function Sheet({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  desktop = "dialog",
  size = "md",
  initialFocusRef,
}: SheetProps) {
  const [rendered, setRendered] = useState(open);
  const [shown, setShown] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const titleId = useId();
  const descId = useId();

  // Mount on open; animate out, then unmount.
  useEffect(() => {
    if (open) {
      setRendered(true);
      return;
    }
    setShown(false);
    const t = setTimeout(() => setRendered(false), 260);
    return () => clearTimeout(t);
  }, [open]);

  // Scroll lock; remembers the trigger (before focus moves) and restores it on close.
  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    lockScroll();
    return () => {
      unlockScroll();
      if (previous && document.contains(previous)) previous.focus({ preventScroll: true });
    };
  }, [open]);

  // Once the panel is in the DOM: flush its hidden styles so the transition
  // runs, then show it and move focus inside. No rAF — it can be throttled.
  useEffect(() => {
    if (!open || !rendered) return;
    const panel = panelRef.current;
    if (!panel) return;
    panel.getBoundingClientRect();
    setShown(true);
    (initialFocusRef?.current ?? panel).focus({ preventScroll: true });
  }, [open, rendered, initialFocusRef]);

  function onKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key === "Escape") {
      e.stopPropagation();
      onCloseRef.current();
      return;
    }
    if (e.key !== "Tab" || !panelRef.current) return;
    e.stopPropagation();
    const nodes = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
      (el) => el.getClientRects().length > 0,
    );
    if (nodes.length === 0) {
      e.preventDefault();
      return;
    }
    const first = nodes[0];
    const last = nodes[nodes.length - 1];
    const active = document.activeElement;
    if (e.shiftKey && (active === first || active === panelRef.current)) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && active === last) {
      e.preventDefault();
      first.focus();
    }
  }

  if (!rendered || typeof document === "undefined") return null;

  const isDrawer = desktop === "drawer";

  return createPortal(
    <div className="fixed inset-0 z-[60]">
      <div
        aria-hidden
        onClick={onClose}
        className={cn(
          "absolute inset-0 bg-scrim transition-opacity duration-[250ms] ease-[var(--ease-standard)]",
          shown ? "opacity-100" : "opacity-0",
        )}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descId : undefined}
        tabIndex={-1}
        onKeyDown={onKeyDown}
        className={cn(
          "absolute inset-x-0 bottom-0 flex max-h-[92dvh] flex-col rounded-t-[20px] bg-elevated shadow-overlay outline-none",
          "pb-[env(safe-area-inset-bottom)] transition-[translate,opacity,scale] duration-[250ms] ease-[var(--ease-standard)]",
          DESKTOP_WIDTH[size],
          isDrawer
            ? "md:inset-y-0 md:left-auto md:right-0 md:max-h-none md:rounded-none md:rounded-l-card md:pb-0"
            : "md:inset-auto md:left-1/2 md:top-1/2 md:max-h-[85dvh] md:-translate-x-1/2 md:rounded-card md:pb-0",
          shown
            ? cn("translate-y-0", isDrawer ? "md:translate-x-0" : "md:-translate-y-1/2 md:scale-100 md:opacity-100")
            : cn(
                "translate-y-full",
                isDrawer ? "md:translate-x-full md:translate-y-0" : "md:-translate-y-1/2 md:scale-[0.97] md:opacity-0",
              ),
        )}
      >
        <div aria-hidden className="mx-auto mt-2 h-1 w-9 shrink-0 rounded-full bg-line-strong md:hidden" />
        <div className="flex shrink-0 items-start gap-3 px-4 pb-2 pt-3 md:px-5 md:pt-4">
          <div className="min-w-0 flex-1 pt-2">
            <h2 id={titleId} className="text-[17px] font-bold leading-6 text-ink">
              {title}
            </h2>
            {description && (
              <div id={descId} className="mt-0.5 text-[14px] leading-5 text-ink-2">
                {description}
              </div>
            )}
          </div>
          <IconButton icon={X} label="Cerrar" onClick={onClose} className="-mr-2" />
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-4 md:px-5 md:pb-5">{children}</div>
        {footer && <div className="shrink-0 border-t border-line px-4 py-3 md:px-5">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}

/** Aliases that document intent at call sites. */
export const BottomSheet = Sheet;
export function Drawer(props: Omit<SheetProps, "desktop">) {
  return <Sheet {...props} desktop="drawer" />;
}
export function Modal(props: Omit<SheetProps, "desktop">) {
  return <Sheet {...props} desktop="dialog" />;
}
