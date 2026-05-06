type WordmarkProps = {
  className?: string;
  title?: string;
};

export function Wordmark({ className = "h-8 w-auto", title = "Golf Course Ranks" }: WordmarkProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 520 80"
      role="img"
      aria-label={title}
      className={className}
    >
      <text
        x="0"
        y="56"
        fill="currentColor"
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "56px",
          fontWeight: 600,
          letterSpacing: "-0.05em"
        }}
      >
        Golf Course Ranks
      </text>
    </svg>
  );
}
