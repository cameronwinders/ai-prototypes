"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { signOut } from "@/app/actions";
import { Wordmark } from "@/components/Wordmark";

type AppChromeProps = {
  viewer: {
    signedIn: boolean;
    handle: string | null;
    needsOnboarding: boolean;
    isAdmin: boolean;
  };
  children: React.ReactNode;
};

const desktopNav = [
  { href: "/rankings", label: "Overall Rankings" },
  { href: "/courses", label: "Browse Courses" },
  { href: "/me/courses", label: "My Courses" },
  { href: "/friends", label: "Friends" }
];

const courseSubnav = [
  { href: "/courses", label: "Browse Courses" },
  { href: "/me/courses", label: "My Courses" },
  { href: "/me/wishlist", label: "My Wishlist" }
];

const mobileMenuItems = [
  { href: "/rankings", label: "Overall Rankings" },
  { href: "/courses", label: "Browse Courses" },
  { href: "/me/courses", label: "My Courses" },
  { href: "/me/wishlist", label: "My Wishlist" },
  { href: "/friends", label: "Friends" },
  { href: "/profile", label: "Profile" }
];

const activePillTextStyle = {
  color: "#ffffff",
  WebkitTextFillColor: "#ffffff"
} as const;

function ProfileIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <path
        d="M12 12.25a4.25 4.25 0 1 0 0-8.5 4.25 4.25 0 0 0 0 8.5Zm0 2.5c-4.12 0-7.47 2.48-7.47 5.53 0 .4.33.72.72.72h13.5c.4 0 .72-.32.72-.72 0-3.05-3.35-5.53-7.47-5.53Z"
        fill="currentColor"
      />
    </svg>
  );
}

function toScreenName(pathname: string) {
  if (pathname.startsWith("/courses/")) {
    return "Course detail";
  }

  if (pathname.startsWith("/compare/")) {
    return "Compare";
  }

  const labels: Record<string, string> = {
    "/": "Home",
    "/rankings": "Overall Rankings",
    "/courses": "Browse Courses",
    "/me/courses": "My Courses",
    "/me/wishlist": "My Wishlist",
    "/friends": "Friends",
    "/feedback": "Feedback",
    "/profile": "Profile",
    "/sign-in": "Sign In",
    "/onboarding": "Onboarding",
    "/admin/feedback": "Admin feedback"
  };

  return labels[pathname] ?? "App";
}

function navPillClasses(active: boolean) {
  return active
    ? "inline-flex min-h-10 items-center justify-center rounded-xs bg-ink px-4 py-2 text-sm font-semibold shadow-active"
    : "inline-flex min-h-10 items-center justify-center rounded-xs px-4 py-2 text-sm font-semibold text-muted transition hover:bg-white/78 hover:text-ink";
}

export function AppChrome({ viewer, children }: AppChromeProps) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const currentUrl = pathname;
  const feedbackHref = `/feedback?screen=${encodeURIComponent(toScreenName(pathname))}&from=${encodeURIComponent(currentUrl)}`;
  const inCourseSection =
    pathname === "/courses" ||
    pathname === "/me/courses" ||
    pathname === "/me/wishlist" ||
    pathname.startsWith("/courses/");
  const profileHref = "/profile";
  const myCoursesHref = viewer.signedIn
    ? viewer.needsOnboarding
      ? "/onboarding?next=%2Fme%2Fcourses"
      : "/me/courses"
    : "/sign-in?next=%2Fme%2Fcourses";
  const wishlistHref = viewer.signedIn
    ? viewer.needsOnboarding
      ? "/onboarding?next=%2Fme%2Fwishlist"
      : "/me/wishlist"
    : "/sign-in?next=%2Fme%2Fwishlist";

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  function isDesktopNavActive(href: string) {
    if (href === "/courses") {
      return pathname === "/courses" || pathname.startsWith("/courses/");
    }

    if (href === "/me/courses") {
      return (
        pathname === "/me/courses" ||
        pathname === "/me/wishlist" ||
        pathname === "/my-courses" ||
        pathname.startsWith("/me/courses/") ||
        pathname.startsWith("/me/wishlist/")
      );
    }

    return pathname === href || pathname.startsWith(`${href}/`);
  }

  function isCourseSubnavActive(href: string) {
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <div className="min-h-screen bg-[var(--bg-page-gradient)] text-ink">
      <div className="mx-auto flex min-h-screen w-full max-w-[1280px] flex-col px-0 pb-10 pt-0 sm:px-6 sm:pb-16 sm:pt-4 lg:px-8">
        <header className="sticky top-0 z-40 border-b border-[rgba(28,41,36,0.1)] bg-[rgba(251,248,242,0.92)] backdrop-blur-xl sm:rounded-xl sm:border sm:border-line sm:bg-[linear-gradient(180deg,_rgba(255,253,249,0.96),_rgba(255,250,243,0.84))] sm:shadow-header">
          <div className="flex min-h-[72px] items-center justify-between gap-4 px-5 py-3 sm:min-h-[76px] sm:px-5">
            <div className="flex min-w-0 items-center gap-5">
              <Link href="/" className="shrink-0 text-ink" aria-label="Golf Course Ranks home">
                <Wordmark className="h-10 w-auto max-w-[18rem] sm:h-9" />
              </Link>

              <nav className="hidden items-center gap-[18px] lg:flex">
                {desktopNav.map((item) => {
                  const href = item.href === "/me/courses" ? myCoursesHref : item.href;
                  const active = isDesktopNavActive(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={href}
                      className={`relative py-1.5 text-[0.85rem] transition-colors ${
                        active ? "font-semibold text-ink" : "font-medium text-muted hover:text-ink"
                      }`}
                    >
                      {item.label}
                      {active ? (
                        <span className="absolute inset-x-0 -bottom-2 h-0.5 rounded-full bg-pine" aria-hidden="true" />
                      ) : null}
                    </Link>
                  );
                })}
              </nav>
            </div>

            <div className="hidden items-center gap-2 lg:flex">
              {viewer.signedIn ? (
                <Link
                  href={profileHref}
                  className="ghost-button sm gap-2"
                >
                  <ProfileIcon className="h-4 w-4" />
                  Profile
                </Link>
              ) : null}
              {viewer.signedIn && viewer.isAdmin ? (
                <Link href="/admin/feedback" className="ghost-button sm">
                  Admin
                </Link>
              ) : null}
              {viewer.signedIn ? (
                <form action={signOut}>
                  <button type="submit" className="solid-button sm" style={activePillTextStyle}>
                    Sign out
                  </button>
                </form>
              ) : (
                <Link href={`/sign-in?next=${encodeURIComponent(currentUrl)}`} className="solid-button sm" style={activePillTextStyle}>
                  Sign in
                </Link>
              )}
            </div>

            <div className="flex items-center gap-2 lg:hidden">
              <Link
                href={viewer.signedIn ? profileHref : `/sign-in?next=${encodeURIComponent(currentUrl)}`}
                className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border border-line bg-white/92 text-ink shadow-chip"
                aria-label={viewer.signedIn ? "Open profile" : "Sign in"}
              >
                <ProfileIcon className="h-5 w-5" />
              </Link>
              <button
                type="button"
                aria-expanded={menuOpen}
                aria-controls="mobile-site-menu"
                aria-label={menuOpen ? "Close menu" : "Open menu"}
                onClick={() => setMenuOpen((open) => !open)}
                className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border border-line bg-white/92 text-ink shadow-chip"
              >
                <span className="sr-only">{menuOpen ? "Close menu" : "Open menu"}</span>
                <span className="relative flex h-5 w-5 flex-col justify-center gap-1.5">
                  <span
                    className={`block h-0.5 rounded-full bg-current transition-all duration-200 ${
                      menuOpen ? "translate-y-2 rotate-45" : ""
                    }`}
                  />
                  <span
                    className={`block h-0.5 rounded-full bg-current transition-all duration-200 ${
                      menuOpen ? "opacity-0" : ""
                    }`}
                  />
                  <span
                    className={`block h-0.5 rounded-full bg-current transition-all duration-200 ${
                      menuOpen ? "-translate-y-2 -rotate-45" : ""
                    }`}
                  />
                </span>
              </button>
            </div>
          </div>

          {inCourseSection ? (
            <div className="hidden items-center gap-2 border-t border-[rgba(28,41,36,0.08)] px-5 py-3 lg:flex">
              <span className="pill pill-pine">Courses</span>
              <div className="flex min-w-0 items-center gap-2 overflow-x-auto">
                {courseSubnav.map((item) => {
                  const href =
                    item.href === "/me/courses"
                      ? myCoursesHref
                      : item.href === "/me/wishlist"
                        ? wishlistHref
                        : item.href;
                  const active = isCourseSubnavActive(item.href);

                  return (
                    <Link
                      key={item.label}
                      href={href}
                      className={navPillClasses(active)}
                      style={active ? activePillTextStyle : undefined}
                    >
                      <span style={active ? activePillTextStyle : undefined}>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ) : null}
        </header>

        <div
          className={`fixed inset-0 z-50 lg:hidden transition ${menuOpen ? "pointer-events-auto" : "pointer-events-none"}`}
          aria-hidden={!menuOpen}
        >
          <button
            type="button"
            aria-label="Close menu"
            className={`absolute inset-0 bg-[rgba(17,27,24,0.3)] transition-opacity duration-300 ${menuOpen ? "opacity-100" : "opacity-0"}`}
            onClick={() => setMenuOpen(false)}
          />
          <div
            id="mobile-site-menu"
            role="dialog"
            aria-modal="true"
            aria-label="Site navigation"
            className={`absolute inset-y-0 right-0 flex w-full flex-col bg-[linear-gradient(180deg,_rgba(251,248,242,0.995)_0%,_rgba(244,239,229,0.985)_100%)] px-6 pb-8 pt-5 shadow-[0_30px_60px_rgba(18,28,25,0.18)] transition-transform duration-300 ${
              menuOpen ? "translate-x-0" : "translate-x-full"
            }`}
          >
            <div className="flex items-center justify-between gap-3 border-b border-[rgba(28,41,36,0.08)] pb-5">
              <Link href="/" onClick={() => setMenuOpen(false)} className="text-ink" aria-label="Golf Course Ranks home">
                <Wordmark className="h-10 w-auto max-w-[15rem]" />
              </Link>
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border border-line bg-white text-ink shadow-chip"
                aria-label="Close menu"
              >
                <span className="text-2xl leading-none">{"\u00D7"}</span>
              </button>
            </div>

            <nav className="mt-6 grid gap-3">
              {mobileMenuItems.map((item) => {
                const href =
                  item.href === "/me/courses"
                    ? myCoursesHref
                    : item.href === "/me/wishlist"
                      ? wishlistHref
                      : item.href === "/profile"
                      ? profileHref
                      : item.href;
                const active =
                  item.href === "/profile"
                    ? pathname === "/profile" || pathname.startsWith("/profile/") || pathname.startsWith("/u/")
                    : pathname === item.href || pathname.startsWith(`${item.href}/`);

                return (
                  <Link
                    key={item.label}
                    href={href}
                    onClick={() => setMenuOpen(false)}
                    className={`flex min-h-[3.25rem] items-center justify-between rounded-md border px-4 py-3 text-base font-semibold transition ${
                      active
                        ? "border-[rgba(24,37,43,0.08)] bg-ink shadow-active"
                        : "border-line bg-white/84 text-ink"
                    }`}
                    style={active ? activePillTextStyle : undefined}
                  >
                    <span style={active ? activePillTextStyle : undefined}>{item.label}</span>
                    <span
                      className={`section-label text-[11px] ${active ? "" : "text-muted"}`}
                      style={active ? activePillTextStyle : undefined}
                    >
                      {active ? "Current" : "Open"}
                    </span>
                  </Link>
                );
              })}
            </nav>

            <div className="mt-auto border-t border-[rgba(28,41,36,0.08)] pt-5">
              <div className="rounded-lg border border-line bg-white/76 px-4 py-4">
                <p className="text-sm font-semibold text-ink">{viewer.signedIn ? viewer.handle ?? "Signed-in golfer" : "Not signed in"}</p>
                <p className="meta mt-1">
                  {viewer.signedIn ? "Open your account, invite friends, or sign out." : "Sign in to save courses and compare lists."}
                </p>
              </div>

              {viewer.signedIn ? (
                <form action={signOut} className="mt-4">
                  <button type="submit" className="solid-button w-full" style={activePillTextStyle}>
                    Sign out
                  </button>
                </form>
              ) : (
                <Link
                  href={`/sign-in?next=${encodeURIComponent(currentUrl)}`}
                  onClick={() => setMenuOpen(false)}
                  className="solid-button mt-4 w-full"
                  style={activePillTextStyle}
                >
                  Sign in
                </Link>
              )}
            </div>
          </div>
        </div>

        <main className="flex-1 px-4 py-4 sm:px-0 sm:py-6">{children}</main>

        <Link
          href={feedbackHref}
          className="solid-button fixed bottom-4 right-4 z-40 gap-2 shadow-[0_20px_55px_rgba(22,38,34,0.28)] lg:bottom-6 lg:right-8"
          style={activePillTextStyle}
        >
          <span className="text-base leading-none" style={activePillTextStyle}>
            +
          </span>
          <span style={activePillTextStyle}>Feedback</span>
        </Link>
      </div>
    </div>
  );
}
