type PlayedMarkIconProps = {
  className?: string;
  title?: string;
};

export function PlayedMarkIcon({
  className = "h-4 w-4",
  title = "Played course"
}: PlayedMarkIconProps) {
  return (
    <svg
      viewBox="0 0 96 96"
      role="img"
      aria-label={title}
      fill="none"
      className={className}
    >
      <g stroke="currentColor" strokeWidth="6" strokeLinecap="round">
        <line x1="14" y1="22" x2="58" y2="22" />
        <line x1="14" y1="48" x2="74" y2="48" />
        <line x1="14" y1="74" x2="86" y2="74" />
      </g>
      <g fill="currentColor">
        <path d="M14 22 L30 22 L22 8 Z" />
        <path d="M14 48 L30 48 L22 34 Z" />
        <path d="M14 74 L30 74 L22 60 Z" />
      </g>
    </svg>
  );
}
