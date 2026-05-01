import "./globals.css";

import type { Metadata, Viewport } from "next";
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
  title: "Golf Course Ranks",
  description:
    "Crowd-ranked leaderboard for U.S. public golf courses, powered by real golfers dragging their played lists into order."
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1
};

export const dynamic = "force-dynamic";

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
            needsOnboarding: Boolean(viewer.user && !viewer.profile?.onboarding_completed),
            isAdmin: viewer.isAdmin
          }}
        >
          {children}
        </AppChrome>
      </body>
    </html>
  );
}
