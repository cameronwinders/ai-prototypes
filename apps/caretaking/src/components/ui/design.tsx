import Link from "next/link";

type CardProps = {
  children: React.ReactNode;
  className?: string;
};

type EmptyStateProps = {
  title: string;
  description: string;
  actionHref?: string;
  actionLabel?: string;
};

type StatCardProps = {
  label: string;
  value: string | number;
  tone?: "neutral" | "accent" | "alert";
  href?: string;
};

export function Card({ children, className = "" }: CardProps) {
  return <section className={`ds-card ${className}`.trim()}>{children}</section>;
}

export function SectionTitle({
  eyebrow,
  title,
  description
}: {
  eyebrow?: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="section-title">
      {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
      <h2>{title}</h2>
      {description ? <p className="muted">{description}</p> : null}
    </div>
  );
}

export function StatCard({ label, value, tone = "neutral", href }: StatCardProps) {
  const content = (
    <>
      <span>{label}</span>
      <strong>{value}</strong>
    </>
  );

  if (href) {
    return (
      <Link className={`stat-card stat-card-${tone} stat-card-link`} href={href}>
        {content}
      </Link>
    );
  }

  return (
    <div className={`stat-card stat-card-${tone}`}>
      {content}
    </div>
  );
}

export function EmptyState({ title, description, actionHref, actionLabel }: EmptyStateProps) {
  return (
    <section className="empty-state">
      <div className="empty-orb" aria-hidden="true" />
      <h2>{title}</h2>
      <p className="muted">{description}</p>
      {actionHref && actionLabel ? (
        <Link className="button button-primary" href={actionHref}>
          {actionLabel}
        </Link>
      ) : null}
    </section>
  );
}

export function StatusPill({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "neutral" | "success" | "warning" | "danger" }) {
  return <span className={`status-pill status-pill-${tone}`}>{children}</span>;
}
