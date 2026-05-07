import { getGolferInitials } from "@/lib/ranking";

type InitialsAvatarProps = {
  displayName: string | null | undefined;
  handle: string | null | undefined;
  size?: "sm" | "md";
  title?: string;
  className?: string;
};

const SIZE_CLASSES = {
  sm: "h-8 w-8 text-[11px]",
  md: "h-10 w-10 text-[12px]"
} as const;

export function InitialsAvatar({
  displayName,
  handle,
  size = "sm",
  title,
  className = ""
}: InitialsAvatarProps) {
  return (
    <span
      title={title}
      className={`inline-flex items-center justify-center rounded-full border border-[rgba(28,41,36,0.1)] bg-[rgba(216,231,221,0.88)] font-semibold uppercase tracking-[0.08em] text-pine shadow-chip ${SIZE_CLASSES[size]} ${className}`.trim()}
    >
      {getGolferInitials(displayName, handle)}
    </span>
  );
}
