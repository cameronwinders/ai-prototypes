"use client";

import { useEffect, useState } from "react";

type ShareButtonProps = {
  title: string;
  text: string;
  url: string;
  className?: string;
  analyticsSurface?: string;
  buttonChildren?: React.ReactNode;
  hideSecondaryLinks?: boolean;
  hideStatus?: boolean;
};

export function ShareButton({
  title,
  text,
  url,
  className,
  analyticsSurface,
  buttonChildren,
  hideSecondaryLinks = false,
  hideStatus = false
}: ShareButtonProps) {
  const [status, setStatus] = useState<string | null>(null);
  const [canNativeShare, setCanNativeShare] = useState(false);
  const shareMessage = text ? `${text}\n${url}` : url;

  useEffect(() => {
    setCanNativeShare(typeof navigator !== "undefined" && typeof navigator.share === "function");
  }, []);

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

  async function handleCopy() {
    setStatus(null);

    try {
      const nav = typeof window !== "undefined" ? window.navigator : undefined;
      const clipboard = nav?.clipboard;

      if (clipboard?.writeText) {
        await clipboard.writeText(url);
        await trackShare("clipboard");
        setStatus("Link copied.");
        return;
      }

      setStatus("Copy is not available on this device.");
    } catch {
      setStatus("Copy cancelled.");
    }
  }

  async function handleNativeShare() {
    setStatus(null);

    try {
      const nav = typeof window !== "undefined" ? window.navigator : undefined;

      if (!nav?.share) {
        setStatus("Share is not available on this device.");
        return;
      }

      await nav.share({ title, text, url });
      await trackShare("native");
      setStatus("Link shared.");
    } catch {
      setStatus("Share cancelled.");
    }
  }

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex flex-wrap gap-2.5">
        <button type="button" onClick={handleCopy} className={className ?? "ghost-button min-h-11"}>
          {buttonChildren ?? "Copy link"}
        </button>
        {canNativeShare ? (
          <button type="button" onClick={handleNativeShare} className="ghost-button min-h-11">
            Share
          </button>
        ) : null}
      </div>
      {hideSecondaryLinks ? null : (
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
      )}
      {status && !hideStatus ? <p className="text-sm text-[var(--muted)]">{status}</p> : null}
    </div>
  );
}
