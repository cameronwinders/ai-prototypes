"use client";

import { useState } from "react";

type ShareButtonProps = {
  title: string;
  text: string;
  url: string;
  className?: string;
  analyticsSurface?: string;
};

export function ShareButton({ title, text, url, className, analyticsSurface }: ShareButtonProps) {
  const [status, setStatus] = useState<string | null>(null);
  const shareMessage = text ? `${text}\n${url}` : url;

  async function trackShare(method: string) {
    try {
      await fetch("/api/analytics", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          eventName: "share_clicked",
          payload: {
            method,
            surface: analyticsSurface ?? "unknown",
            url
          }
        })
      });
    } catch {
      // Ignore analytics failures in the client.
    }
  }

  async function handleShare() {
    setStatus(null);

    try {
      const nav = typeof window !== "undefined" ? window.navigator : undefined;

      if (nav?.share) {
        await nav.share({ title, text, url });
        await trackShare("native");
        setStatus("Shared.");
        return;
      }

      const clipboard = nav?.clipboard;

      if (clipboard?.writeText) {
        await clipboard.writeText(shareMessage);
        await trackShare("clipboard");
        setStatus("Caption and link copied.");
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
      <div className="flex flex-wrap gap-2 text-sm">
        <a
          href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareMessage)}`}
          target="_blank"
          rel="noreferrer"
          className="ghost-button min-h-11"
          onClick={() => {
            void trackShare("x");
          }}
        >
          X
        </a>
        <a
          href={`sms:&body=${encodeURIComponent(shareMessage)}`}
          className="ghost-button min-h-11"
          onClick={() => {
            void trackShare("imessage");
          }}
        >
          iMessage
        </a>
        <a
          href={`https://wa.me/?text=${encodeURIComponent(shareMessage)}`}
          target="_blank"
          rel="noreferrer"
          className="ghost-button min-h-11"
          onClick={() => {
            void trackShare("whatsapp");
          }}
        >
          WhatsApp
        </a>
      </div>
      {status ? <p className="text-sm text-[var(--muted)]">{status}</p> : null}
    </div>
  );
}
