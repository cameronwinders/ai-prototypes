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
      viewBox="0 0 16 16"
      role="img"
      aria-label={title}
      fill="none"
      className={className}
    >
      <line x1="5" y1="14" x2="5" y2="2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M5 2 L12 4.2 L5 6.6 Z" fill="currentColor" />
      <ellipse cx="5" cy="14" rx="2.2" ry="0.6" fill="currentColor" opacity="0.6" />
    </svg>
  );
}
