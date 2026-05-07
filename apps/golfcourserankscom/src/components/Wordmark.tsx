import { MarkIcon } from "@/components/MarkIcon";

type WordmarkProps = {
  className?: string;
  title?: string;
  withMark?: boolean;
};

export function Wordmark({
  className = "h-8 w-auto",
  title = "Golf Course Ranks",
  withMark = true
}: WordmarkProps) {
  return (
    <span role="img" aria-label={title} className={`inline-flex items-center gap-2.5 text-current ${className}`}>
      {withMark ? <MarkIcon className="h-[1.45rem] w-[1.45rem] shrink-0" title="" /> : null}
      <span
        className="whitespace-nowrap"
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "1.45rem",
          fontWeight: 600,
          letterSpacing: "-0.05em",
          lineHeight: 1
        }}
      >
        Golf Course Ranks
      </span>
    </span>
  );
}
