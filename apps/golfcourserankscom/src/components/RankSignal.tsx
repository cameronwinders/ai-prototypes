import type { RankSignalRecord, RankSignalVariant } from "@/lib/types";

const baseClasses =
  "inline-flex h-6 items-center gap-1.5 rounded-xs border px-2 text-[11px] font-bold uppercase tracking-[0.12em] leading-none";

const variantClasses: Record<RankSignalVariant, string> = {
  "trending-up": "border-[rgba(49,107,83,0.28)] bg-pine-soft text-[var(--pine-deep)]",
  "trending-down": "border-[rgba(28,41,36,0.7)] bg-transparent text-ink",
  underrated: "border-[rgba(49,107,83,0.28)] bg-pine-soft text-[var(--pine-deep)]",
  overrated: "border-[rgba(28,41,36,0.7)] bg-transparent text-ink",
  "hidden-gem": "border-[var(--pine-deep)] bg-pine text-white"
};

function TrendUpIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="2,12 5,9 8,11 13,4" />
      <polyline points="9.5,4 13,4 13,7.5" />
    </svg>
  );
}

function TrendDownIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="2,4 5,7 8,5 13,12" />
      <polyline points="9.5,12 13,12 13,8.5" />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" aria-hidden="true">
      <path d="M8 2 L9.85 6.1 L14.2 6.55 L10.95 9.5 L11.85 13.8 L8 11.6 L4.15 13.8 L5.05 9.5 L1.8 6.55 L6.15 6.1 Z" />
    </svg>
  );
}

function ChevronUpIcon() {
  return (
    <svg width="9" height="9" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="3,10 8,5 13,10" />
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg width="9" height="9" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="3,6 8,11 13,6" />
    </svg>
  );
}

function GemIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" strokeLinecap="round" aria-hidden="true">
      <path d="M3 6 L5.5 3 L10.5 3 L13 6 L8 13.5 Z" />
      <path d="M3 6 L13 6" />
      <path d="M5.5 3 L8 6" />
      <path d="M10.5 3 L8 6" />
      <path d="M8 6 L8 13.5" />
    </svg>
  );
}

function StarChevron({ up }: { up: boolean }) {
  return (
    <span className="relative inline-flex h-[14px] w-[14px] shrink-0 items-center justify-center">
      <span className="absolute inset-0 flex items-center justify-center">
        <StarIcon />
      </span>
      <span className="absolute -bottom-[2px] -right-[2px] flex h-[9px] w-[9px] items-center justify-center rounded-full bg-[var(--linen)]">
        {up ? <ChevronUpIcon /> : <ChevronDownIcon />}
      </span>
    </span>
  );
}

function signalIcon(variant: RankSignalVariant) {
  switch (variant) {
    case "trending-up":
      return <TrendUpIcon />;
    case "trending-down":
      return <TrendDownIcon />;
    case "underrated":
      return <StarChevron up />;
    case "overrated":
      return <StarChevron up={false} />;
    case "hidden-gem":
      return <GemIcon />;
  }
}

export function RankSignal({
  signal,
  compact = false,
  className = ""
}: {
  signal: RankSignalRecord | null | undefined;
  compact?: boolean;
  className?: string;
}) {
  if (!signal) {
    return null;
  }

  const classes = `${baseClasses} ${variantClasses[signal.variant]} ${compact ? "px-1.5" : ""} ${className}`.trim();

  return (
    <span title={signal.title} className={classes}>
      {signalIcon(signal.variant)}
      {!compact ? <span>{signal.label}</span> : null}
    </span>
  );
}
