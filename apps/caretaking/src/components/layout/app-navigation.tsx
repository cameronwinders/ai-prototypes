"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";

import { signOut } from "@/actions/auth";

type NavigationSpace = {
  id: string;
  name: string;
  slug: string | null;
};

type AppNavigationProps = {
  displayName: string;
  relationshipLabel?: string | null;
  spaces: NavigationSpace[];
  defaultSpaceId?: string;
  showFeedbackReview?: boolean;
};

function getCurrentSpaceId(pathname: string) {
  const match = pathname.match(/^\/spaces\/([^/]+)/);
  return match?.[1] ?? null;
}

function matchesPath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppNavigation({ displayName, relationshipLabel, spaces, defaultSpaceId, showFeedbackReview = false }: AppNavigationProps) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const currentSpaceId = getCurrentSpaceId(pathname);
  const preferredSpaceId = currentSpaceId ?? defaultSpaceId ?? null;

  const preferredSpace = useMemo(() => {
    if (!preferredSpaceId) {
      return null;
    }

    return spaces.find((space) => space.id === preferredSpaceId) ?? null;
  }, [preferredSpaceId, spaces]);

  const primaryLinks = [
    {
      label: "Timeline",
      href: preferredSpaceId ? `/spaces/${preferredSpaceId}/timeline` : "/spaces",
      active: preferredSpaceId ? matchesPath(pathname, `/spaces/${preferredSpaceId}/timeline`) || matchesPath(pathname, `/spaces/${preferredSpaceId}/events`) : pathname === "/spaces"
    },
    {
      label: "Reminders",
      href: preferredSpaceId ? `/spaces/${preferredSpaceId}/reminders` : "/spaces",
      active: preferredSpaceId ? matchesPath(pathname, `/spaces/${preferredSpaceId}/reminders`) : false
    },
    {
      label: "Notifications",
      href: preferredSpaceId ? `/spaces/${preferredSpaceId}/notifications` : "/spaces",
      active: preferredSpaceId ? matchesPath(pathname, `/spaces/${preferredSpaceId}/notifications`) : false
    },
    {
      label: "Spaces",
      href: "/spaces",
      active: pathname === "/spaces" || pathname === "/spaces/new"
    }
  ];

  const accountLinks = [
    { label: "Profile", href: "/profile", active: matchesPath(pathname, "/profile") },
    { label: "Submit Feedback", href: "/feedback", active: pathname === "/feedback" },
    ...(showFeedbackReview ? [{ label: "Feedback Review", href: "/feedback/review", active: matchesPath(pathname, "/feedback/review") }] : [])
  ];

  return (
    <>
      <button
        aria-controls="app-navigation"
        aria-expanded={menuOpen}
        className="nav-mobile-trigger"
        onClick={() => setMenuOpen((open) => !open)}
        type="button"
      >
        <span className="nav-mobile-trigger-icon" aria-hidden="true">
          {displayName.slice(0, 1).toUpperCase()}
        </span>
        <span>
          <strong>Menu</strong>
          <small>{preferredSpace?.name ?? "Caretaking App"}</small>
        </span>
      </button>

      {menuOpen ? <button aria-label="Close navigation" className="nav-overlay" onClick={() => setMenuOpen(false)} type="button" /> : null}

      <aside className={`app-navigation ${menuOpen ? "is-open" : ""}`} id="app-navigation">
        <div className="nav-header">
          <div>
            <p className="eyebrow">Caretaking App</p>
            <h2>Shared care</h2>
            <p className="muted">Move through the product without losing context.</p>
          </div>
          <button aria-label="Close navigation" className="nav-close" onClick={() => setMenuOpen(false)} type="button">
            Close
          </button>
        </div>

        <section className="nav-section">
          <div className="nav-account-card">
            <div className="nav-account-avatar" aria-hidden="true">
              {displayName.slice(0, 1).toUpperCase()}
            </div>
            <div>
              <strong>{displayName}</strong>
              <p className="muted">{relationshipLabel || "Care team member"}</p>
            </div>
          </div>
        </section>

        <section className="nav-section" aria-labelledby="nav-core-heading">
          <div className="nav-section-heading" id="nav-core-heading">
            Core app
          </div>
          <nav className="nav-list" aria-label="Core navigation">
            {primaryLinks.map((item) => (
              <Link
                aria-current={item.active ? "page" : undefined}
                className={`nav-link ${item.active ? "is-active" : ""}`}
                href={item.href}
                key={item.label}
                onClick={() => setMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </section>

        <section className="nav-section" aria-labelledby="nav-spaces-heading">
          <div className="nav-section-heading" id="nav-spaces-heading">
            Spaces
          </div>
          <div className="nav-space-panel">
            <Link
              className={`nav-link nav-link-compact ${currentSpaceId ? "is-active" : ""}`}
              href={preferredSpaceId ? `/spaces/${preferredSpaceId}/timeline` : "/spaces"}
              onClick={() => setMenuOpen(false)}
            >
              Current space
              <small>{preferredSpace?.name ?? "Choose a space"}</small>
            </Link>
            <Link className="nav-link nav-link-compact" href="/spaces" onClick={() => setMenuOpen(false)}>
              Switch space
              <small>{spaces.length > 0 ? `${spaces.length} available` : "Create your first space"}</small>
            </Link>
            {preferredSpaceId ? (
              <Link
                className={`nav-link nav-link-compact ${matchesPath(pathname, `/spaces/${preferredSpaceId}/settings`) ? "is-active" : ""}`}
                href={`/spaces/${preferredSpaceId}/settings`}
                onClick={() => setMenuOpen(false)}
              >
                Space settings
                <small>Team, access, and structure</small>
              </Link>
            ) : null}
          </div>
          {spaces.length > 0 ? (
            <div className="nav-space-list" aria-label="Available spaces">
              {spaces.map((space) => {
                const active = currentSpaceId === space.id;
                return (
                  <Link
                    aria-current={active ? "page" : undefined}
                    className={`nav-space-link ${active ? "is-active" : ""}`}
                    href={`/spaces/${space.id}/timeline`}
                    key={space.id}
                    onClick={() => setMenuOpen(false)}
                  >
                    <span>{space.name}</span>
                    <small>{active ? "Current space" : "Open"}</small>
                  </Link>
                );
              })}
            </div>
          ) : null}
        </section>

        <section className="nav-section" aria-labelledby="nav-account-heading">
          <div className="nav-section-heading" id="nav-account-heading">
            Account
          </div>
          <nav className="nav-list" aria-label="Account navigation">
            {accountLinks.map((item) => (
              <Link
                aria-current={item.active ? "page" : undefined}
                className={`nav-link ${item.active ? "is-active" : ""}`}
                href={item.href}
                key={item.label}
                onClick={() => setMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <form action={signOut}>
            <button className="nav-link nav-link-button" type="submit">
              Log out
            </button>
          </form>
        </section>
      </aside>
    </>
  );
}
