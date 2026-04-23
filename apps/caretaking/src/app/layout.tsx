import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "Caretaking App",
  description: "A caregiving app for care teams, timelines, reminders, and notifications."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
