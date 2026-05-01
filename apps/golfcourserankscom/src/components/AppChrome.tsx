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
  { href: "/me/courses", label: "My courses" },
  { href: "/feedback?topic=course-addition", label: "Request a course" }
];

const mobileMenuItems = [
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/courses", label: "Courses" },
  { href: "/me/courses", label: "My Courses" },
  { href: "/friends", label: "Friends" },
  { href: "/profile", label: "Profile" },
  { href: "/feedback", label: "Feedback" },
  { href: "/feedback?topic=course-addition", label: "Request a course" }
];

const activePillTextStyle = {
  color: "#ffffff",
  WebkitTextFillColor: "#ffffff"
} as const;

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
  const requestCourseHref = `/feedback?screen=${encodeURIComponent(toScreenName(pathname))}&from=${encodeURIComponent(currentUrl)}&topic=course-addition`;
  const inCourseSection = pathname === "/courses" || pathname === "/me/courses" || pathname.startsWith("/courses/");
  const profileHref = "/profile";

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
      <div className="mx-auto flex min-h-screen w-full max-w-[1280px] flex-col px-4 pb-16 pt-4 sm:px-6 lg:px-8">
        <header className="shell-panel sticky top-4 z-40 rounded-[2rem] px-4 py-3 sm:px-6">
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-4">
              <div className="flex min-w-0 items-center gap-5">
                <Link
                  href="/"
                  className="brand-heading shrink-0 text-[1.1rem] font-semibold leading-none tracking-[-0.05em] text-[var(--ink)] sm:text-[1.35rem] lg:whitespace-nowrap lg:text-[1.45rem]"
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
                <Link
                  href={profileHref}
                  className="hidden min-h-11 items-center justify-center whitespace-nowrap rounded-full border border-[var(--line)] bg-white/85 px-4 py-2 text-sm font-semibold text-[var(--ink)] lg:inline-flex"
                >
                  Profile
                </Link>
                <Link
                  href={feedbackHref}
                  className="hidden min-h-11 items-center justify-center whitespace-nowrap rounded-full border border-[var(--line)] bg-[var(--pine-soft)] px-4 py-2 text-sm font-semibold text-[var(--pine)] lg:inline-flex"
                >
                  Feedback
                </Link>
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
                      item.href === "/feedback?topic=course-addition"
                        ? requestCourseHref
                        : item.href;
                    const active = item.href === "/feedback?topic=course-addition" ? false : isCourseSubnavActive(item.href);

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

        {menuOpen ? (
          <div className="fixed inset-0 z-50 lg:hidden">
            <button
              type="button"
              aria-label="Close menu"
              className="absolute inset-0 bg-[rgba(17,27,24,0.28)] backdrop-blur-[2px]"
              onClick={() => setMenuOpen(false)}
            />
            <div
              id="mobile-site-menu"
              role="dialog"
              aria-modal="true"
              aria-label="Site navigation"
              className="absolute right-4 top-20 w-[min(22rem,calc(100vw-2rem))] rounded-[2rem] border border-[var(--line)] bg-[rgba(255,253,249,0.98)] p-4 shadow-[0_30px_60px_rgba(18,28,25,0.18)]"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="section-label">Menu</p>
                  <p className="mt-2 text-sm text-[var(--muted)]">Jump to the next place without covering the leaderboard.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setMenuOpen(false)}
                  className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border border-[var(--line)] bg-white text-lg text-[var(--ink)]"
                  aria-label="Close menu"
                >
                  x
                </button>
              </div>

              <nav className="mt-5 grid gap-2">
                {mobileMenuItems.map((item) => {
                  const href =
                    item.href === "/feedback"
                      ? feedbackHref
                      : item.href === "/feedback?topic=course-addition"
                        ? requestCourseHref
                        : item.href === "/profile"
                          ? profileHref
                          : item.href;
                  const active =
                    item.href === "/feedback" || item.href === "/feedback?topic=course-addition"
                      ? pathname.startsWith("/feedback")
                      : item.href === "/profile"
                        ? pathname === "/profile" || pathname.startsWith("/profile/")
                        : pathname === item.href || pathname.startsWith(`${item.href}/`);

                  return (
                    <Link
                      key={item.label}
                      href={href}
                      onClick={() => setMenuOpen(false)}
                      className={`flex min-h-11 items-center justify-between rounded-[1.25rem] px-4 py-3 text-sm font-semibold transition ${
                        active
                          ? "bg-[var(--ink)] shadow-[0_10px_24px_rgba(24,37,43,0.12)]"
                          : "bg-white text-[var(--ink)]"
                      }`}
                      style={active ? activePillTextStyle : undefined}
                    >
                      <span style={active ? activePillTextStyle : undefined}>{item.label}</span>
                      {active ? (
                        <span className="text-xs uppercase tracking-[0.16em]" style={activePillTextStyle}>
                          Current
                        </span>
                      ) : null}
                    </Link>
                  );
                })}

                {viewer.signedIn ? (
                  <form action={signOut} className="pt-2">
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
                    className="solid-button mt-2 min-h-11 w-full justify-center"
                    style={activePillTextStyle}
                  >
                    Sign in
                  </Link>
                )}
              </nav>
            </div>
          </div>
        ) : null}

        <main className="flex-1 py-6">{children}</main>

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
