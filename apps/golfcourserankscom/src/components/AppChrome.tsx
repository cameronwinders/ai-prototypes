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
  { href: "/me/courses", label: "My Courses" },
  { href: "/friends", label: "Friends" },
  { href: "/profile", label: "Me" }
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

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(202,218,201,0.45),_transparent_32%),radial-gradient(circle_at_top_right,_rgba(233,216,182,0.32),_transparent_28%),linear-gradient(180deg,_#f6f3ec_0%,_#efe8db_52%,_#f7f4ee_100%)] text-[var(--ink)]">
      <div className="mx-auto flex min-h-screen w-full max-w-[1280px] flex-col px-4 pb-28 pt-4 sm:px-6 lg:px-8">
        <header className="shell-panel sticky top-4 z-40 rounded-[2rem] px-4 py-3 sm:px-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-5">
              <Link href="/" className="brand-heading text-[1.45rem] font-semibold tracking-[-0.05em] text-[var(--ink)]">
                GolfCourseRanks.com
              </Link>
              <nav className="hidden items-center gap-2 lg:flex">
                {desktopNav.map((item) => {
                  const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                        active ? "bg-[var(--ink)] text-white" : "text-[var(--muted)] hover:bg-white/70"
                      }`}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/courses"
                className="hidden rounded-full border border-[var(--line)] bg-white/85 px-4 py-2 text-sm font-semibold text-[var(--ink)] md:inline-flex"
              >
                Quick search
              </Link>
              <Link
                href={feedbackHref}
                className="hidden rounded-full border border-[var(--line)] bg-[var(--pine-soft)] px-4 py-2 text-sm font-semibold text-[var(--pine)] sm:inline-flex"
              >
                Feedback
              </Link>

              {viewer.signedIn ? (
                <>
                  {viewer.isAdmin ? (
                    <Link
                      href="/admin/feedback"
                      className="hidden rounded-full border border-[var(--line)] bg-white/85 px-4 py-2 text-sm font-semibold text-[var(--ink)] xl:inline-flex"
                    >
                      Admin
                    </Link>
                  ) : null}
                  <Link
                    href={viewer.needsOnboarding ? "/onboarding" : "/profile"}
                    className="rounded-full border border-[var(--line)] bg-white/85 px-4 py-2 text-sm font-semibold text-[var(--ink)]"
                  >
                    {viewer.needsOnboarding ? "Finish profile" : "Me"}
                  </Link>
                  <form action={signOut}>
                    <button
                      type="submit"
                      className="rounded-full bg-[var(--ink)] px-4 py-2 text-sm font-semibold text-white"
                    >
                      Sign out
                    </button>
                  </form>
                </>
              ) : (
                <Link
                  href={`/sign-in?next=${encodeURIComponent(currentUrl)}`}
                  className="rounded-full bg-[var(--ink)] px-4 py-2 text-sm font-semibold text-white"
                >
                  Sign in
                </Link>
              )}
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
                  active ? "bg-[var(--ink)] text-white" : "text-[var(--muted)]"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <Link
          href={feedbackHref}
          className="fixed bottom-[5.75rem] right-4 z-40 inline-flex items-center gap-2 rounded-full bg-[var(--ink)] px-5 py-3 text-sm font-semibold text-white shadow-[0_20px_55px_rgba(22,38,34,0.28)] lg:bottom-6 lg:right-8"
        >
          <span className="text-base leading-none">+</span>
          <span>Feedback</span>
        </Link>
      </div>
    </div>
  );
}
