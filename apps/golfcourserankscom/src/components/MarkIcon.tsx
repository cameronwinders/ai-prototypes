type MarkIconProps = {
  className?: string;
  title?: string;
  monochrome?: boolean;
};

export function MarkIcon({
  className = "h-6 w-6",
  title = "Golf Course Ranks mark",
  monochrome = false
}: MarkIconProps) {
  const flagFill = monochrome ? "currentColor" : "#316b53";

  return (
    <svg
      viewBox="0 0 96 96"
      role="img"
      aria-label={title}
      fill="none"
      className={className}
    >
      <g stroke="currentColor" strokeWidth="6" strokeLinecap="round">
        <line x1="14" y1="28" x2="56" y2="28" />
        <line x1="14" y1="52" x2="72" y2="52" />
        <line x1="14" y1="76" x2="86" y2="76" />
      </g>
      <g fill={flagFill}>
        <path d="M14 28 L36 28 L23 4 Z" />
        <path d="M14 52 L36 52 L23 28 Z" />
        <path d="M14 76 L36 76 L23 52 Z" />
      </g>
    </svg>
  );
}
