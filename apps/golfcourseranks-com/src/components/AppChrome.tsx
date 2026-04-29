"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

import { signOut } from "@/app/actions";

type AppChromeProps = {
  viewer: {
    signedIn: boolean;
    handle: string | null;
    needsOnboarding: boolean;
  };
  children: React.ReactNode;
};

const navigationItems = [
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/my-courses", label: "My Courses" },
  { href: "/friends", label: "Friends" }
];

function toScreenName(pathname: string) {
  if (pathname.startsWith("/courses/")) {
    return "Course detail";
  }

  if (pathname.startsWith("/compare/")) {
    return "Compare";
  }

  if (pathname.startsWith("/profile/")) {
    return "Profile";
  }

  const labels: Record<string, string> = {
    "/leaderboard": "Leaderboard",
    "/my-courses": "My Courses",
    "/friends": "Friends",
    "/feedback": "Feedback",
    "/sign-in": "Sign In",
    "/onboarding": "Onboarding"
  };

  return labels[pathname] ?? "App";
}

export function AppChrome({ viewer, children }: AppChromeProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryString = searchParams.toString();
  const currentUrl = `${pathname}${queryString ? `?${queryString}` : ""}`;
  const feedbackHref = `/feedback?screen=${encodeURIComponent(toScreenName(pathname))}&from=${encodeURIComponent(currentUrl)}`;

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(236,214,164,0.22),_transparent_38%),linear-gradient(180deg,_#f9f5ee_0%,_#efe3d1_42%,_#f6efe4_100%)] text-[var(--ink)]">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 pb-24 pt-4 sm:px-6 lg:px-8">
        <header className="glass-panel sticky top-4 z-30 flex items-center justify-between rounded-[2rem] px-4 py-3 sm:px-5">
          <div className="flex items-center gap-4">
            <Link href="/leaderboard" className="brand-heading text-xl font-semibold tracking-[-0.05em]">
              GolfCourseRanks.com
            </Link>
            <nav className="hidden items-center gap-2 md:flex">
              {navigationItems.map((item) => {
                const active = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`rounded-full px-4 py-2 text-sm font-medium transition ${
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
              href={feedbackHref}
              className="hidden rounded-full border border-[rgba(24,37,43,0.08)] bg-white/80 px-4 py-2 text-sm font-semibold text-[var(--ink)] sm:inline-flex"
            >
              Feedback
            </Link>

            {viewer.signedIn ? (
              <>
                <Link
                  href={viewer.needsOnboarding ? "/onboarding" : viewer.handle ? `/profile/${viewer.handle}` : "/profile"}
                  className="rounded-full border border-[rgba(24,37,43,0.08)] bg-white/80 px-4 py-2 text-sm font-semibold text-[var(--ink)]"
                >
                  {viewer.needsOnboarding ? "Finish profile" : "Profile"}
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
                href={`/sign-in?next=${encodeURIComponent(pathname)}`}
                className="rounded-full bg-[var(--ink)] px-4 py-2 text-sm font-semibold text-white"
              >
                Sign in
              </Link>
            )}
          </div>
        </header>

        <div className="md:hidden">
          <nav className="glass-panel mt-3 flex items-center gap-2 overflow-x-auto rounded-[1.6rem] px-3 py-2">
            {navigationItems.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium ${
                    active ? "bg-[var(--ink)] text-white" : "text-[var(--muted)]"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <main className="flex-1 py-6">{children}</main>

        <Link
          href={feedbackHref}
          className="fixed bottom-5 right-5 z-40 inline-flex items-center gap-2 rounded-full bg-[var(--ink)] px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_50px_rgba(24,37,43,0.24)]"
        >
          <span className="text-base leading-none">+</span>
          <span>Send feedback</span>
        </Link>
      </div>
    </div>
  );
}
