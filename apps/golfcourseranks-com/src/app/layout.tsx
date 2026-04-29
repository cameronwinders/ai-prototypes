import "./globals.css";

import type { Metadata } from "next";
import { Cormorant_Garamond, Public_Sans } from "next/font/google";

import { AppChrome } from "@/components/AppChrome";
import { getViewerContext } from "@/lib/viewer";

const displayFont = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-display"
});

const bodyFont = Public_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body"
});

export const metadata: Metadata = {
  title: "GolfCourseRanks.com",
  description:
    "Crowd-ranked leaderboard for the best public golf courses, powered by ordered golfer lists."
};

export default async function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const viewer = await getViewerContext();

  return (
    <html lang="en" className={`${displayFont.variable} ${bodyFont.variable}`}>
      <body>
        <AppChrome
          viewer={{
            signedIn: Boolean(viewer.user),
            handle: viewer.profile?.handle ?? null,
            needsOnboarding: Boolean(viewer.user && !viewer.profile?.onboarding_completed)
          }}
        >
          {children}
        </AppChrome>
      </body>
    </html>
  );
}
