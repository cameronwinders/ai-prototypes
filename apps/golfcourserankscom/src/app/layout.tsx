import "./globals.css";

import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Public_Sans } from "next/font/google";

import { AppChrome } from "@/components/AppChrome";
import { getSiteUrl } from "@/lib/supabase/env";
import { getViewerContext } from "@/lib/viewer";

const displayFont = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-display-face"
});

const bodyFont = Public_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body-face"
});

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: "Golf Course Ranks",
    template: "%s | Golf Course Ranks"
  },
  description:
    "Crowd-ranked leaderboard for U.S. public golf courses, powered by real golfers dragging their played lists into order.",
  openGraph: {
    title: "Golf Course Ranks",
    description:
      "Crowd-ranked leaderboard for U.S. public golf courses, powered by real golfers dragging their played lists into order.",
    images: ["/opengraph-image"]
  },
  twitter: {
    card: "summary_large_image",
    title: "Golf Course Ranks",
    description:
      "Crowd-ranked leaderboard for U.S. public golf courses, powered by real golfers dragging their played lists into order.",
    images: ["/opengraph-image"]
  },
  icons: {
    icon: "/icon",
    apple: "/apple-icon"
  }
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
