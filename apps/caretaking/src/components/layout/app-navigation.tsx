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

type NavigationLink = {
  label: string;
  href: string;
  active: boolean;
  detail?: string;
};

function getCurrentSpaceId(pathname: string) {
  const match = pathname.match(/^\/spaces\/([^/]+)/);
  return match?.[1] ?? null;
}

function matchesPath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function getInitial(displayName: string) {
  return displayName.slice(0, 1).toUpperCase();
}

export function AppNavigation({ displayName, relationshipLabel, spaces, defaultSpaceId, showFeedbackReview = false }: AppNavigationProps) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);

  const currentSpaceId = getCurrentSpaceId(pathname);
  const preferredSpaceId = currentSpaceId ?? defaultSpaceId ?? null;

  const preferredSpace = useMemo(() => {
    if (!preferredSpaceId) {
      return null;
    }

    return spaces.find((space) => space.id === preferredSpaceId) ?? null;
  }, [preferredSpaceId, spaces]);

  const primaryLinks: NavigationLink[] = [
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

  const spaceLinks: NavigationLink[] = [
    {
      label: "Current space",
      href: preferredSpaceId ? `/spaces/${preferredSpaceId}/timeline` : "/spaces",
      active: Boolean(currentSpaceId),
      detail: preferredSpace?.name ?? "Choose a space"
    },
    {
      label: "Switch space",
      href: "/spaces",
      active: pathname === "/spaces" || pathname === "/spaces/new",
      detail: spaces.length > 0 ? `${spaces.length} available` : "Create your first space"
    },
    ...(preferredSpaceId
      ? [
          {
            label: "Space settings",
            href: `/spaces/${preferredSpaceId}/settings`,
            active: matchesPath(pathname, `/spaces/${preferredSpaceId}/settings`),
            detail: "Team, access, and structure"
          }
        ]
      : [])
  ];

  const accountLinks: NavigationLink[] = [
    { label: "Profile", href: "/profile", active: matchesPath(pathname, "/profile") },
    { label: "Submit Feedback", href: "/feedback", active: pathname === "/feedback" },
    ...(showFeedbackReview ? [{ label: "Feedback Review", href: "/feedback/review", active: matchesPath(pathname, "/feedback/review") }] : [])
  ];

  const closeMenus = () => {
    setMenuOpen(false);
    setAccountOpen(false);
  };

  return (
    <>
      <header className="app-topbar">
        <div className="app-topbar-inner">
          <div className="app-brand">
            <Link className="app-brand-link" href={preferredSpaceId ? `/spaces/${preferredSpaceId}/timeline` : "/spaces"} onClick={closeMenus}>
              <span className="app-brand-mark" aria-hidden="true">
                C
              </span>
              <span className="app-brand-copy">
                <strong>Caretaking App</strong>
                <small>{preferredSpace?.name ?? "Shared care, calmly coordinated."}</small>
              </span>
            </Link>
          </div>

          <nav className="app-nav-desktop" aria-label="Primary navigation">
            {primaryLinks.map((item) => (
              <Link
                aria-current={item.active ? "page" : undefined}
                className={`app-nav-link ${item.active ? "is-active" : ""}`}
                href={item.href}
                key={item.label}
                onClick={() => setAccountOpen(false)}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="app-topbar-actions">
            <Link className="app-space-summary" href="/spaces" onClick={() => setAccountOpen(false)}>
              <span>Spaces</span>
              <strong>{preferredSpace?.name ?? "Choose a space"}</strong>
            </Link>

            <div className={`account-dropdown ${accountOpen ? "is-open" : ""}`}>
              <button
                aria-expanded={accountOpen}
                aria-haspopup="menu"
                className="account-trigger"
                onClick={() => {
                  setAccountOpen((open) => !open);
                  setMenuOpen(false);
                }}
                type="button"
              >
                <span className="account-trigger-avatar" aria-hidden="true">
                  {getInitial(displayName)}
                </span>
                <span className="account-trigger-copy">
                  <strong>{displayName}</strong>
                  <small>{relationshipLabel || "Account"}</small>
                </span>
                <span className="account-trigger-caret" aria-hidden="true">
                  ▾
                </span>
              </button>

              {accountOpen ? (
                <div className="account-dropdown-menu" role="menu">
                  {accountLinks.map((item) => (
                    <Link
                      aria-current={item.active ? "page" : undefined}
                      className={`account-dropdown-link ${item.active ? "is-active" : ""}`}
                      href={item.href}
                      key={item.label}
                      onClick={closeMenus}
                      role="menuitem"
                    >
                      {item.label}
                    </Link>
                  ))}
                  <form action={signOut}>
                    <button className="account-dropdown-link account-dropdown-button" role="menuitem" type="submit">
                      Log out
                    </button>
                  </form>
                </div>
              ) : null}
            </div>

            <button
              aria-controls="app-navigation-drawer"
              aria-expanded={menuOpen}
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              className="hamburger-button"
              onClick={() => {
                setMenuOpen((open) => !open);
                setAccountOpen(false);
              }}
              type="button"
            >
              <span />
              <span />
              <span />
            </button>
          </div>
        </div>
      </header>

      {menuOpen || accountOpen ? (
        <button
          aria-label="Dismiss navigation"
          className="nav-overlay"
          onClick={closeMenus}
          type="button"
        />
      ) : null}

      <aside className={`mobile-drawer ${menuOpen ? "is-open" : ""}`} id="app-navigation-drawer">
        <div className="mobile-drawer-header">
          <div>
            <p className="eyebrow">Menu</p>
            <h2>Navigate the app</h2>
            <p className="muted">Move quickly between care updates, reminders, and spaces.</p>
          </div>
          <button aria-label="Close menu" className="mobile-drawer-close" onClick={closeMenus} type="button">
            Close
          </button>
        </div>

        <section className="mobile-drawer-section">
          <div className="mobile-account-card">
            <div className="nav-account-avatar" aria-hidden="true">
              {getInitial(displayName)}
            </div>
            <div>
              <strong>{displayName}</strong>
              <p className="muted">{relationshipLabel || "Care team member"}</p>
            </div>
          </div>
        </section>

        <section className="mobile-drawer-section" aria-labelledby="mobile-primary-heading">
          <div className="mobile-drawer-heading" id="mobile-primary-heading">
            Main navigation
          </div>
          <nav className="mobile-drawer-list" aria-label="Mobile primary navigation">
            {primaryLinks.map((item) => (
              <Link
                aria-current={item.active ? "page" : undefined}
                className={`mobile-drawer-link ${item.active ? "is-active" : ""}`}
                href={item.href}
                key={item.label}
                onClick={closeMenus}
              >
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>
        </section>

        <section className="mobile-drawer-section" aria-labelledby="mobile-spaces-heading">
          <div className="mobile-drawer-heading" id="mobile-spaces-heading">
            Spaces
          </div>
          <div className="mobile-drawer-list">
            {spaceLinks.map((item) => (
              <Link
                aria-current={item.active ? "page" : undefined}
                className={`mobile-drawer-link ${item.active ? "is-active" : ""}`}
                href={item.href}
                key={item.label}
                onClick={closeMenus}
              >
                <span>{item.label}</span>
                {item.detail ? <small>{item.detail}</small> : null}
              </Link>
            ))}
            {spaces.map((space) => {
              const active = currentSpaceId === space.id;

              return (
                <Link
                  aria-current={active ? "page" : undefined}
                  className={`mobile-drawer-link ${active ? "is-active" : ""}`}
                  href={`/spaces/${space.id}/timeline`}
                  key={space.id}
                  onClick={closeMenus}
                >
                  <span>{space.name}</span>
                  <small>{active ? "Current space" : "Open space"}</small>
                </Link>
              );
            })}
          </div>
        </section>

        <section className="mobile-drawer-section" aria-labelledby="mobile-account-heading">
          <div className="mobile-drawer-heading" id="mobile-account-heading">
            Account
          </div>
          <div className="mobile-drawer-list">
            {accountLinks.map((item) => (
              <Link
                aria-current={item.active ? "page" : undefined}
                className={`mobile-drawer-link ${item.active ? "is-active" : ""}`}
                href={item.href}
                key={item.label}
                onClick={closeMenus}
              >
                <span>{item.label}</span>
              </Link>
            ))}
            <form action={signOut}>
              <button className="mobile-drawer-link mobile-drawer-button" type="submit">
                <span>Log out</span>
              </button>
            </form>
          </div>
        </section>
      </aside>
    </>
  );
}
