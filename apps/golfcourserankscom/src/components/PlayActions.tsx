"use client";

import type { ReactNode } from "react";

import { PlayedMarkIcon } from "@/components/PlayedMarkIcon";
import { WishlistIcon } from "@/components/WishlistIcon";

export function PlayedButton({
  children = "Played",
  className = "",
  iconClassName = "h-3.5 w-3.5"
}: {
  children?: ReactNode;
  className?: string;
  iconClassName?: string;
}) {
  return (
    <span className={`inline-flex min-h-8 items-center justify-center gap-2 rounded-xs border border-ink bg-ink px-3 py-1.5 text-[13px] font-semibold text-[var(--linen)] shadow-[0_1px_0_rgba(255,255,255,0.08)_inset,0_1px_2px_rgba(18,28,25,0.08)] ${className}`}>
      <PlayedMarkIcon className={iconClassName} />
      <span>{children}</span>
    </span>
  );
}

export function WantToPlayButton({
  saved,
  onClick,
  disabled,
  labelOn = "On your list",
  labelOff = "Want to play",
  className = ""
}: {
  saved: boolean;
  onClick?: () => void;
  disabled?: boolean;
  labelOn?: string;
  labelOff?: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex min-h-8 items-center justify-center gap-2 rounded-xs border px-3 py-1.5 text-[13px] font-semibold shadow-[0_1px_0_rgba(255,255,255,0.08)_inset,0_1px_2px_rgba(18,28,25,0.08)] ${
        saved
          ? "border-[rgba(49,107,83,0.32)] bg-pine-soft text-pine"
          : "border-line bg-white text-ink"
      } ${className}`}
    >
      <WishlistIcon className="h-3.5 w-3.5" filled={saved} />
      <span>{saved ? labelOn : labelOff}</span>
    </button>
  );
}
