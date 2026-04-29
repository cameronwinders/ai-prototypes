"use client";

import { useState } from "react";

type ShareButtonProps = {
  title: string;
  text: string;
  url: string;
  className?: string;
};

export function ShareButton({ title, text, url, className }: ShareButtonProps) {
  const [status, setStatus] = useState<string | null>(null);

  async function handleShare() {
    setStatus(null);

    try {
      const nav = typeof window !== "undefined" ? window.navigator : undefined;

      if (nav?.share) {
        await nav.share({ title, text, url });
        setStatus("Shared.");
        return;
      }

      const clipboard = nav?.clipboard;

      if (clipboard?.writeText) {
        await clipboard.writeText(url);
        setStatus("Link copied.");
        return;
      }

      setStatus("Share is not available on this device.");
    } catch {
      setStatus("Share cancelled.");
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <button type="button" onClick={handleShare} className={className ?? "ghost-button min-h-11"}>
        Share
      </button>
      {status ? <p className="text-sm text-[var(--muted)]">{status}</p> : null}
    </div>
  );
}
