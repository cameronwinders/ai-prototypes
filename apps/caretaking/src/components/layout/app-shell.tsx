import Link from "next/link";

import { SpaceNav } from "@/components/layout/space-nav";

type AppShellProps = {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  actionHref?: string;
  actionLabel?: string;
  actionVariant?: "primary" | "secondary";
  eyebrow?: string;
  spaceId?: string;
};

export function AppShell({
  title,
  subtitle,
  children,
  actionHref,
  actionLabel,
  actionVariant = "secondary",
  eyebrow = "Caretaking App",
  spaceId
}: AppShellProps) {
  return (
    <main className="app-shell">
      <header className="app-header">
        <div>
          <p className="eyebrow">{eyebrow}</p>
          <h1>{title}</h1>
          {subtitle ? <p className="muted">{subtitle}</p> : null}
        </div>
        {actionHref && actionLabel ? (
          <Link className={`button button-${actionVariant}`} href={actionHref}>
            {actionLabel}
          </Link>
        ) : null}
      </header>
      {spaceId ? <SpaceNav spaceId={spaceId} /> : null}
      {children}
    </main>
  );
}
