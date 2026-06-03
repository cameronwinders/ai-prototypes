"use client";

import { useEffect, useState, type ReactNode } from "react";

type MobileSheetProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  footer?: ReactNode;
};

/**
 * Bottom sheet primitive (design-system `.m-sheet`). Grabber, tap-outside or
 * close-button to dismiss, safe-area aware, slide-in/out animation. Stays
 * mounted briefly on close so the slide-out plays. Used for the rankings sort
 * sheet and the mobile share sheet.
 */
export function MobileSheet({ open, onClose, title, children, footer }: MobileSheetProps) {
  const [mounted, setMounted] = useState(open);

  useEffect(() => {
    if (open) {
      setMounted(true);
      return;
    }
    const timeout = setTimeout(() => setMounted(false), 280);
    return () => clearTimeout(timeout);
  }, [open]);

  // Lock body scroll while the sheet is open.
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  // Close on Escape.
  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!mounted && !open) return null;

  return (
    <div className="lg:hidden" role="dialog" aria-modal="true" aria-label={title}>
      <div
        className="m-sheet-backdrop"
        onClick={onClose}
        style={{
          opacity: open ? 1 : 0,
          transition: "opacity 240ms ease",
          pointerEvents: open ? "auto" : "none"
        }}
      />
      <div
        className="m-sheet"
        style={{
          transform: open ? "translateY(0)" : "translateY(100%)",
          transition: "transform 280ms cubic-bezier(0.32, 0.72, 0, 1)"
        }}
      >
        <div className="m-sheet-grabber" />
        {title ? (
          <div className="mb-3.5 flex items-center justify-between">
            <h3 className="m-0 text-[1.15rem] font-semibold tracking-[-0.02em] text-ink">{title}</h3>
            <button type="button" className="m-icon-btn" onClick={onClose} aria-label="Close" style={{ width: 36, height: 36 }}>
              <span className="text-lg leading-none">{"×"}</span>
            </button>
          </div>
        ) : null}
        <div>{children}</div>
        {footer ? <div className="mt-[18px] flex flex-col gap-2">{footer}</div> : null}
      </div>
    </div>
  );
}
