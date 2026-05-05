"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { signOut } from "@/app/actions";

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
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/courses", label: "Courses" },
  { href: "/friends", label: "Friends" }
];

const courseSubnav = [
  { href: "/courses", label: "Browse courses" },
  { href: "/me/courses", label: "My courses" }
];

const mobileMenuItems = [
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/courses", label: "Courses" },
  { href: "/me/courses", label: "My Courses" },
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
    "/leaderboard": "Leaderboard",
    "/courses": "Courses",
    "/me/courses": "My Courses",
    "/friends": "Friends",
    "/feedback": "Feedback",
    "/profile": "Profile",
    "/sign-in": "Sign In",
    "/onboarding": "Onboarding",
    "/admin/feedback": "Admin feedback"
  };

  return labels[pathname] ?? "App";
}

export function AppChrome({ viewer, children }: AppChromeProps) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const currentUrl = pathname;
  const feedbackHref = `/feedback?screen=${encodeURIComponent(toScreenName(pathname))}&from=${encodeURIComponent(currentUrl)}`;
  const inCourseSection = pathname === "/courses" || pathname === "/me/courses" || pathname.startsWith("/courses/");
  const profileHref = "/profile";
  const myCoursesHref = viewer.signedIn
    ? viewer.needsOnboarding
      ? "/onboarding?next=%2Fme%2Fcourses"
      : "/me/courses"
    : "/sign-in?next=%2Fme%2Fcourses";

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  function isDesktopNavActive(href: string) {
    if (href === "/courses") {
      return pathname === "/courses" || pathname === "/me/courses" || pathname.startsWith("/courses/");
    }

    return pathname === href || pathname.startsWith(`${href}/`);
  }

  function isCourseSubnavActive(href: string) {
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(202,218,201,0.45),_transparent_32%),radial-gradient(circle_at_top_right,_rgba(233,216,182,0.32),_transparent_28%),linear-gradient(180deg,_#f6f3ec_0%,_#efe8db_52%,_#f7f4ee_100%)] text-[var(--ink)]">
      <div className="mx-auto flex min-h-screen w-full max-w-[1280px] flex-col px-4 pb-10 pt-0 sm:px-6 sm:pb-16 sm:pt-4 lg:px-8">
        <header className="-mx-4 sticky top-0 z-40 border-b border-[rgba(28,41,36,0.12)] bg-[rgba(251,248,242,0.94)] px-4 py-2.5 shadow-[0_12px_28px_rgba(20,31,28,0.06)] backdrop-blur-xl sm:-mx-6 sm:px-6 lg:mx-0 lg:rounded-[2rem] lg:border lg:border-[var(--line)] lg:bg-[linear-gradient(180deg,_rgba(255,253,249,0.96),_rgba(255,250,243,0.84))] lg:px-4 lg:py-3 lg:shadow-[0_22px_65px_rgba(18,28,25,0.08)] lg:backdrop-blur-[18px]">
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-4">
              <div className="flex min-w-0 items-center gap-5">
                <Link
                  href="/"
                  className="brand-heading shrink-0 text-[1.45rem] font-semibold leading-none tracking-[-0.05em] text-[var(--ink)] sm:text-[1.35rem] lg:whitespace-nowrap lg:text-[1.45rem]"
                >
                  Golf Course Ranks
                </Link>
                <nav className="hidden items-center gap-2 lg:flex">
                  {desktopNav.map((item) => {
                    const active = isDesktopNavActive(item.href);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`inline-flex min-h-11 items-center justify-center whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition ${
                          active
                            ? "bg-[var(--ink)] shadow-[0_10px_25px_rgba(24,37,43,0.12)]"
                            : "text-[var(--muted)] hover:bg-white/70"
                        }`}
                        style={active ? activePillTextStyle : undefined}
                      >
                        <span style={active ? activePillTextStyle : undefined}>{item.label}</span>
                      </Link>
                    );
                  })}
                </nav>
              </div>

              <div className="hidden items-center gap-2 lg:flex">
                {viewer.signedIn ? (
                  <Link
                    href={profileHref}
                    className="hidden min-h-11 items-center justify-center gap-2 whitespace-nowrap rounded-full border border-[var(--line)] bg-white/85 px-4 py-2 text-sm font-semibold text-[var(--ink)] lg:inline-flex"
                  >
                    <ProfileIcon className="h-4 w-4" />
                    Profile
                  </Link>
                ) : null}
                {viewer.signedIn && viewer.isAdmin ? (
                  <Link
                    href="/admin/feedback"
                    className="hidden min-h-11 items-center justify-center whitespace-nowrap rounded-full border border-[var(--line)] bg-white/85 px-4 py-2 text-sm font-semibold text-[var(--ink)] xl:inline-flex"
                  >
                    Admin
                  </Link>
                ) : null}
                {viewer.signedIn ? (
                  <form action={signOut}>
                    <button
                      type="submit"
                      className="solid-button min-h-11 whitespace-nowrap px-4 text-[rgb(255,255,255)]"
                      style={activePillTextStyle}
                    >
                      Sign out
                    </button>
                  </form>
                ) : (
                  <Link
                    href={`/sign-in?next=${encodeURIComponent(currentUrl)}`}
                    className="solid-button min-h-11 whitespace-nowrap px-4 text-[rgb(255,255,255)]"
                    style={activePillTextStyle}
                  >
                    Sign in
                  </Link>
                )}
              </div>

              <div className="flex items-center gap-2 lg:hidden">
                <Link
                  href={viewer.signedIn ? profileHref : `/sign-in?next=${encodeURIComponent(currentUrl)}`}
                  className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border border-[var(--line)] bg-white/94 text-[var(--ink)] shadow-[0_8px_24px_rgba(24,37,43,0.08)]"
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
                  className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border border-[var(--line)] bg-white/92 p-0 text-[var(--ink)] shadow-[0_8px_24px_rgba(24,37,43,0.08)]"
                >
                  <span className="sr-only">{menuOpen ? "Close menu" : "Open menu"}</span>
                  <span className="flex w-5 flex-col gap-1.5">
                    <span className={`h-0.5 rounded-full bg-[var(--ink)] transition ${menuOpen ? "translate-y-2 rotate-45" : ""}`} />
                    <span className={`h-0.5 rounded-full bg-[var(--ink)] transition ${menuOpen ? "opacity-0" : ""}`} />
                    <span className={`h-0.5 rounded-full bg-[var(--ink)] transition ${menuOpen ? "-translate-y-2 -rotate-45" : ""}`} />
                  </span>
                </button>
              </div>
            </div>

            {inCourseSection ? (
              <div className="hidden items-center gap-2 lg:flex">
                <span className="rounded-full bg-[var(--pine-soft)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--pine)]">
                  Courses
                </span>
                <div className="flex min-w-0 items-center gap-2 overflow-x-auto">
                  {courseSubnav.map((item) => {
                    const href =
                      item.href === "/me/courses"
                          ? myCoursesHref
                        : item.href;
                    const active = isCourseSubnavActive(item.href);

                    return (
                      <Link
                        key={item.label}
                        href={href}
                        className={`inline-flex min-h-10 items-center justify-center whitespace-nowrap rounded-full border px-4 py-2 text-sm font-semibold transition ${
                          active
                            ? "border-[rgba(24,37,43,0.08)] bg-[var(--ink)] shadow-[0_10px_25px_rgba(24,37,43,0.1)]"
                            : "border-[var(--line)] bg-white/72 text-[var(--muted)] hover:bg-white"
                        }`}
                        style={active ? activePillTextStyle : undefined}
                      >
                        <span style={active ? activePillTextStyle : undefined}>{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </div>
        </header>

        <div
          className={`fixed inset-0 z-50 lg:hidden transition ${menuOpen ? "pointer-events-auto" : "pointer-events-none"}`}
          aria-hidden={!menuOpen}
        >
          <button
            type="button"
            aria-label="Close menu"
            className={`absolute inset-0 bg-[rgba(17,27,24,0.34)] backdrop-blur-[4px] transition-opacity duration-300 ${
              menuOpen ? "opacity-100" : "opacity-0"
            }`}
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
              <div>
                <p className="brand-heading text-[1.5rem] font-semibold tracking-[-0.05em] text-[var(--ink)]">Golf Course Ranks</p>
                <p className="mt-2 text-sm leading-6 text-[var(--muted)]">Open the next part of your golf list without losing your place.</p>
              </div>
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border border-[var(--line)] bg-white text-[var(--ink)]"
                aria-label="Close menu"
              >
                <span className="text-2xl leading-none">x</span>
              </button>
            </div>

            <nav className="mt-6 grid gap-3">
              {mobileMenuItems.map((item) => {
                const href =
                    item.href === "/me/courses"
                        ? myCoursesHref
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
                    className={`flex min-h-[3.5rem] items-center justify-between rounded-[1.5rem] border px-4 py-3 text-base font-semibold transition ${
                      active
                        ? "border-[rgba(24,37,43,0.08)] bg-[var(--ink)] shadow-[0_14px_28px_rgba(24,37,43,0.14)]"
                        : "border-[var(--line)] bg-white/84 text-[var(--ink)]"
                    }`}
                    style={active ? activePillTextStyle : undefined}
                  >
                    <span style={active ? activePillTextStyle : undefined}>{item.label}</span>
                    <span
                      className={`text-xs uppercase tracking-[0.16em] ${
                        active ? "" : "text-[var(--muted)]"
                      }`}
                      style={active ? activePillTextStyle : undefined}
                    >
                      {active ? "Current" : "Open"}
                    </span>
                  </Link>
                );
              })}
            </nav>

            <div className="mt-auto border-t border-[rgba(28,41,36,0.08)] pt-5">
              <div className="flex items-center justify-between rounded-[1.4rem] bg-[rgba(255,255,255,0.76)] px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-[var(--ink)]">
                    {viewer.signedIn ? viewer.handle ?? "Signed-in golfer" : "Not signed in"}
                  </p>
                  <p className="mt-1 text-sm text-[var(--muted)]">
                    {viewer.signedIn ? "Open your account, invite friends, or sign out." : "Sign in to save courses and compare lists."}
                  </p>
                </div>
                <Link
                  href={viewer.signedIn ? profileHref : `/sign-in?next=${encodeURIComponent(currentUrl)}`}
                  onClick={() => setMenuOpen(false)}
                  className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border border-[var(--line)] bg-white text-[var(--ink)]"
                  aria-label={viewer.signedIn ? "Open profile" : "Sign in"}
                >
                  <ProfileIcon className="h-5 w-5" />
                </Link>
              </div>

              {viewer.signedIn ? (
                <form action={signOut} className="mt-4">
                  <button
                    type="submit"
                    className="solid-button min-h-11 w-full justify-center"
                    style={activePillTextStyle}
                  >
                    Sign out
                  </button>
                </form>
              ) : (
                <Link
                  href={`/sign-in?next=${encodeURIComponent(currentUrl)}`}
                  onClick={() => setMenuOpen(false)}
                  className="solid-button mt-4 min-h-11 w-full justify-center"
                  style={activePillTextStyle}
                >
                  Sign in
                </Link>
              )}
            </div>
          </div>
        </div>

        <main className="flex-1 py-4 sm:py-6">{children}</main>

        <Link
          href={feedbackHref}
          className="solid-button fixed bottom-4 right-4 z-40 min-h-11 gap-2 whitespace-nowrap px-4 text-[rgb(255,255,255)] shadow-[0_20px_55px_rgba(22,38,34,0.28)] lg:bottom-6 lg:right-8 lg:px-5"
          style={activePillTextStyle}
        >
          <span className="text-base leading-none" style={activePillTextStyle}>+</span>
          <span style={activePillTextStyle}>Feedback</span>
        </Link>
      </div>
    </div>
  );
}
