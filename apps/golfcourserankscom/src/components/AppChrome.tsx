"use client";

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
  { href: "/friends", label: "Friends" },
  { href: "/profile", label: "Me" }
];

const courseSubnav = [
  { href: "/courses", label: "Browse courses" },
  { href: "/me/courses", label: "My courses" },
  { href: "/feedback?topic=course-addition", label: "Request a course" }
];

const mobileNav = [
  { href: "/leaderboard", label: "Board" },
  { href: "/courses", label: "Courses" },
  { href: "/me/courses", label: "My Courses" },
  { href: "/friends", label: "Friends" },
  { href: "/profile", label: "Me" }
];

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
    "/profile": "Me",
    "/sign-in": "Sign In",
    "/onboarding": "Onboarding",
    "/admin/feedback": "Admin feedback"
  };

  return labels[pathname] ?? "App";
}

export function AppChrome({ viewer, children }: AppChromeProps) {
  const pathname = usePathname();
  const currentUrl = pathname;
  const feedbackHref = `/feedback?screen=${encodeURIComponent(toScreenName(pathname))}&from=${encodeURIComponent(currentUrl)}`;
  const requestCourseHref = `/feedback?screen=${encodeURIComponent(toScreenName(pathname))}&from=${encodeURIComponent(currentUrl)}&topic=course-addition`;
  const inCourseSection = pathname === "/courses" || pathname === "/me/courses" || pathname.startsWith("/courses/");

  function isDesktopNavActive(href: string) {
    if (href === "/courses") {
      return pathname === "/courses" || pathname === "/me/courses" || pathname.startsWith("/courses/");
    }

    return pathname === href || pathname.startsWith(`${href}/`);
  }

  function isCourseSubnavActive(href: string) {
    if (href === "/feedback?topic=course-addition") {
      return pathname === "/feedback" && currentUrl.includes("/feedback");
    }

    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(202,218,201,0.45),_transparent_32%),radial-gradient(circle_at_top_right,_rgba(233,216,182,0.32),_transparent_28%),linear-gradient(180deg,_#f6f3ec_0%,_#efe8db_52%,_#f7f4ee_100%)] text-[var(--ink)]">
      <div className="mx-auto flex min-h-screen w-full max-w-[1280px] flex-col px-4 pb-28 pt-4 sm:px-6 lg:px-8">
        <header className="shell-panel sticky top-4 z-40 rounded-[2rem] px-4 py-3 sm:px-6">
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-4">
              <div className="flex min-w-0 items-center gap-5">
              <Link
                href="/"
                className="brand-heading shrink-0 whitespace-nowrap text-[1.35rem] font-semibold leading-none tracking-[-0.05em] text-[var(--ink)] sm:text-[1.45rem]"
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
                          ? "bg-[var(--ink)] text-[rgb(255,255,255)] shadow-[0_10px_25px_rgba(24,37,43,0.12)]"
                          : "text-[var(--muted)] hover:bg-white/70"
                      }`}
                    >
                      <span className={active ? "text-[rgb(255,255,255)]" : ""}>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href={feedbackHref}
                className="hidden min-h-11 items-center justify-center whitespace-nowrap rounded-full border border-[var(--line)] bg-[var(--pine-soft)] px-4 py-2 text-sm font-semibold text-[var(--pine)] sm:inline-flex"
              >
                Feedback
              </Link>

              {viewer.signedIn ? (
                <>
                  {viewer.isAdmin ? (
                    <Link
                      href="/admin/feedback"
                      className="hidden min-h-11 items-center justify-center whitespace-nowrap rounded-full border border-[var(--line)] bg-white/85 px-4 py-2 text-sm font-semibold text-[var(--ink)] xl:inline-flex"
                    >
                      Admin
                    </Link>
                  ) : null}
                  <form action={signOut}>
                    <button
                      type="submit"
                      className="solid-button min-h-11 whitespace-nowrap px-4 text-[rgb(255,255,255)]"
                    >
                      Sign out
                    </button>
                  </form>
                </>
              ) : (
                <Link
                  href={`/sign-in?next=${encodeURIComponent(currentUrl)}`}
                  className="solid-button min-h-11 whitespace-nowrap px-4 text-[rgb(255,255,255)]"
                >
                  Sign in
                </Link>
              )}
            </div>
          </div>

            <div className="hidden items-center gap-2 lg:flex">
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${
                  inCourseSection ? "bg-[var(--pine-soft)] text-[var(--pine)]" : "text-[var(--muted)]"
                }`}
              >
                Courses
              </span>
              <div className="flex min-w-0 items-center gap-2 overflow-x-auto">
                {courseSubnav.map((item) => {
                  const href =
                    item.href === "/feedback?topic=course-addition"
                      ? requestCourseHref
                      : item.href;
                  const active = isCourseSubnavActive(item.href);

                  return (
                    <Link
                      key={item.label}
                      href={href}
                      className={`inline-flex min-h-10 items-center justify-center whitespace-nowrap rounded-full border px-4 py-2 text-sm font-semibold transition ${
                        active
                          ? "border-[rgba(49,107,83,0.18)] bg-[var(--pine-soft)] text-[var(--pine)]"
                          : "border-[var(--line)] bg-white/72 text-[var(--muted)] hover:bg-white"
                      }`}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 py-6">{children}</main>

        <nav className="shell-panel fixed inset-x-4 bottom-4 z-40 mx-auto flex max-w-[560px] items-center justify-between rounded-[1.8rem] px-2 py-2 lg:hidden">
          {mobileNav.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex min-h-11 min-w-0 flex-1 items-center justify-center rounded-[1.2rem] px-2 py-3 text-xs font-semibold transition ${
                  active ? "bg-[var(--ink)] text-[rgb(255,255,255)]" : "text-[var(--muted)]"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <Link
          href={feedbackHref}
          className="solid-button fixed bottom-[5.75rem] right-4 z-40 min-h-11 gap-2 whitespace-nowrap px-5 text-[rgb(255,255,255)] shadow-[0_20px_55px_rgba(22,38,34,0.28)] lg:bottom-6 lg:right-8"
        >
          <span className="text-base leading-none">+</span>
          <span>Feedback</span>
        </Link>
      </div>
    </div>
  );
}
