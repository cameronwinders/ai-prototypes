type WishlistIconProps = {
  className?: string;
  title?: string;
  filled?: boolean;
};

export function WishlistIcon({
  className = "h-4 w-4",
  title = "Wish list",
  filled = false
}: WishlistIconProps) {
  return filled ? (
    <svg viewBox="0 0 16 16" role="img" aria-label={title} className={className}>
      <path
        d="M4 2.5 L12 2.5 L12 13.5 L8 10.5 L4 13.5 Z"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  ) : (
    <svg viewBox="0 0 16 16" role="img" aria-label={title} fill="none" className={className}>
      <path
        d="M4 2.5 L12 2.5 L12 13.5 L8 10.5 L4 13.5 Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}
