import { splitDisplayName } from "@/lib/ranking";

type InitialsAvatarProps = {
  displayName: string | null | undefined;
  handle: string | null | undefined;
  src?: string | null;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  title?: string;
  className?: string;
};

const SIZE_CLASSES = {
  xs: "h-[18px] w-[18px] text-[9px] border-[1.5px]",
  sm: "h-6 w-6 text-[11px] border-[1.5px]",
  md: "h-8 w-8 text-[14px] border-2",
  lg: "h-11 w-11 text-[18px] border-2",
  xl: "h-16 w-16 text-[26px] border-2"
} as const;

function getInitials(displayName: string | null | undefined, handle: string | null | undefined) {
  const { firstName, lastName } = splitDisplayName(displayName, handle ?? "golfer");
  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.trim().toUpperCase();

  if (initials) {
    return initials;
  }

  if (handle) {
    return handle.slice(0, 2).toUpperCase();
  }

  return "--";
}

export function InitialsAvatar({
  displayName,
  handle,
  src,
  size = "sm",
  title,
  className = ""
}: InitialsAvatarProps) {
  const initials = getInitials(displayName, handle);
  const label = title ?? displayName ?? handle ?? "Golf Course Ranks member";

  if (src) {
    return (
      <span
        title={label}
        className={`inline-flex shrink-0 overflow-hidden rounded-full border-[rgba(28,41,36,0.9)] bg-[var(--linen)] bg-cover bg-center align-middle ${SIZE_CLASSES[size]} ${className}`.trim()}
        style={{ backgroundImage: `url(${src})` }}
      />
    );
  }

  return (
    <span
      title={label}
      className={`inline-flex shrink-0 items-center justify-center rounded-full border-[rgba(28,41,36,0.88)] bg-[var(--linen)] font-display font-bold tracking-[-0.02em] text-ink align-middle ${SIZE_CLASSES[size]} ${className}`.trim()}
    >
      {initials}
    </span>
  );
}

type AvatarStackProps = {
  people: Array<{
    id: string;
    display_name: string | null;
    handle: string | null;
    src?: string | null;
  }>;
  max?: number;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
};

const STACK_OFFSET = {
  xs: "-ml-1.5",
  sm: "-ml-2",
  md: "-ml-2.5",
  lg: "-ml-3",
  xl: "-ml-4"
} as const;

export function AvatarStack({ people, max = 4, size = "sm", className = "" }: AvatarStackProps) {
  const visible = people.slice(0, max);
  const extra = people.length - visible.length;

  return (
    <span className={`inline-flex items-center ${className}`.trim()}>
      {visible.map((person, index) => (
        <span key={person.id} className={index === 0 ? "" : STACK_OFFSET[size]}>
          <InitialsAvatar
            displayName={person.display_name}
            handle={person.handle}
            src={person.src}
            size={size}
            title={person.display_name ?? person.handle ?? "Friend"}
            className="shadow-[0_0_0_2px_var(--linen)]"
          />
        </span>
      ))}
      {extra > 0 ? (
        <span
          className={`${visible.length > 0 ? STACK_OFFSET[size] : ""} inline-flex min-w-[1.9rem] items-center justify-center rounded-full border-2 border-[rgba(28,41,36,0.88)] bg-[var(--linen)] px-2 py-1 font-mono text-[10px] font-bold tracking-[0.04em] text-ink shadow-[0_0_0_2px_var(--linen)]`.trim()}
        >
          +{extra}
        </span>
      ) : null}
    </span>
  );
}
