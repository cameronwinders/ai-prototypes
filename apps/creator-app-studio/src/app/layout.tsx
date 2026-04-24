import "./globals.css";

import type { Metadata } from "next";
import { Instrument_Sans, Manrope } from "next/font/google";
import type { ReactNode } from "react";

import { getSiteUrl } from "@/lib/supabase/env";

const bodyFont = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap"
});

const displayFont = Manrope({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["500", "600", "700", "800"],
  display: "swap"
});

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: "Creator App Studio",
  description:
    "Creator App Studio helps SMB influencers and creators launch premium branded web apps their audiences will pay for.",
  openGraph: {
    title: "Creator App Studio",
    description:
      "Launch a premium app your audience will pay for. Built beautifully, launched quickly, and structured to grow with your audience.",
    url: "/",
    siteName: "Creator App Studio",
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "Creator App Studio",
    description:
      "We help creators turn frameworks, routines, and communities into premium branded web app experiences."
  }
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body
        className={`${bodyFont.variable} ${displayFont.variable} bg-[var(--page-bg)] text-[var(--text-primary)] antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
