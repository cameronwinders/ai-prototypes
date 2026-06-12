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
    <span
      className={`inline-flex h-[34px] items-center justify-center gap-[0.46rem] whitespace-nowrap rounded-none border border-ink bg-ink px-[0.85rem] text-[0.7rem] font-semibold uppercase leading-none tracking-[0.07em] text-linen ${className}`}
    >
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
      className={`inline-flex h-[34px] items-center justify-center gap-[0.46rem] whitespace-nowrap rounded-none border px-[0.85rem] text-[0.7rem] font-semibold uppercase leading-none tracking-[0.07em] transition-colors ${
        saved
          ? "border-[rgba(49,107,83,0.32)] bg-pine-soft text-pine-deep"
          : "border-[rgba(28,41,36,0.4)] bg-transparent text-ink hover:border-ink hover:bg-[rgba(28,41,36,0.04)]"
      } ${className}`}
    >
      <WishlistIcon className="h-3.5 w-3.5" filled={saved} />
      <span>{saved ? labelOn : labelOff}</span>
    </button>
  );
}
