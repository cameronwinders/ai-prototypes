type CareIconProps = {
  icon?: string | null;
  label?: string | null;
};

function normalizeIcon(icon?: string | null, label?: string | null) {
  const source = `${icon ?? ""} ${label ?? ""}`.toLowerCase();

  if (source.includes("check") || source.includes("complete") || source.includes("task")) {
    return "check";
  }

  if (source.includes("eye") || source.includes("observation") || source.includes("observe")) {
    return "eye";
  }

  if (source.includes("pulse") || source.includes("check-in") || source.includes("check in")) {
    return "pulse";
  }

  return "note";
}

export function CareIcon({ icon, label }: CareIconProps) {
  const kind = normalizeIcon(icon, label);

  if (kind === "check") {
    return (
      <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
        <path d="M5 12.5 9.2 17 19 7" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.4" />
      </svg>
    );
  }

  if (kind === "eye") {
    return (
      <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
        <path d="M3.5 12s3.1-5 8.5-5 8.5 5 8.5 5-3.1 5-8.5 5-8.5-5-8.5-5Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
        <path d="M12 14.6a2.6 2.6 0 1 0 0-5.2 2.6 2.6 0 0 0 0 5.2Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
      </svg>
    );
  }

  if (kind === "pulse") {
    return (
      <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
        <path d="M3 12h4l2-5 4 11 2.2-6H21" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" />
      </svg>
    );
  }

  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
      <path d="M7 5.5h10A1.5 1.5 0 0 1 18.5 7v10a1.5 1.5 0 0 1-1.5 1.5H7A1.5 1.5 0 0 1 5.5 17V7A1.5 1.5 0 0 1 7 5.5Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="2" />
      <path d="M8.5 9.5h7M8.5 13h5" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
    </svg>
  );
}
