"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";

import { MarkIcon } from "@/components/MarkIcon";

type ShareButtonProps = {
  title: string;
  text: string;
  url: string;
  className?: string;
  analyticsSurface?: string;
  buttonChildren?: ReactNode;
  hideSecondaryLinks?: boolean;
  hideStatus?: boolean;
};

function ShareGlyph({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" className={className}>
      <path
        d="M10.75 2.75h2.5v2.5M6 10l7.1-7.1M13.25 8.75v3.5a1 1 0 0 1-1 1h-8.5a1 1 0 0 1-1-1v-8.5a1 1 0 0 1 1-1h3.5"
        stroke="currentColor"
        strokeWidth="1.45"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

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
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [mounted, setMounted] = useState(false);
  const shareMessage = text ? `${text}\n${url}` : url;

  useEffect(() => {
    setMounted(true);
    setCanNativeShare(typeof navigator !== "undefined" && typeof navigator.share === "function");
  }, []);

  const destinations = useMemo(
    () =>
      [
        {
          id: "messages",
          label: "Messages",
          glyph: "M",
          href: `sms:&body=${encodeURIComponent(shareMessage)}`
        },
        {
          id: "x",
          label: "X",
          glyph: "X",
          href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareMessage)}`
        },
        {
          id: "whatsapp",
          label: "WhatsApp",
          glyph: "W",
          href: `https://wa.me/?text=${encodeURIComponent(shareMessage)}`
        },
        {
          id: "email",
          label: "Email",
          glyph: "@",
          href: `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(shareMessage)}`
        }
      ] as const,
    [shareMessage, title]
  );

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
      const clipboard = typeof navigator !== "undefined" ? navigator.clipboard : undefined;

      if (clipboard?.writeText) {
        await clipboard.writeText(url);
        await trackShare("clipboard");
        setCopied(true);
        setStatus("Link copied.");
        setTimeout(() => setCopied(false), 1600);
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
      const nav = typeof navigator !== "undefined" ? navigator : undefined;

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
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={className ?? "ghost-button min-h-11 gap-2"}
      >
        <ShareGlyph />
        {buttonChildren ?? "Share"}
      </button>

      {status && !hideStatus ? <p className="mt-2 text-sm text-muted">{status}</p> : null}

      {mounted && open
        ? createPortal(
            <div className="fixed inset-0 z-[70] flex items-end justify-center p-3 sm:items-center sm:p-5">
              <button
                type="button"
                aria-label="Close share"
                className="absolute inset-0 bg-[rgba(18,28,25,0.36)]"
                onClick={() => setOpen(false)}
              />
              <div className="relative z-[71] max-h-[calc(100vh-1.5rem)] w-full max-w-[34rem] overflow-y-auto rounded-lg border border-line bg-white shadow-[0_24px_60px_rgba(18,28,25,0.18)]">
                <div className="flex items-center justify-between border-b border-line px-5 py-4">
                  <span className="eyebrow">SHARE</span>
                  <button type="button" aria-label="Close share" onClick={() => setOpen(false)} className="ghost-button sm">
                    {"\u00D7"}
                  </button>
                </div>

                <div className="px-5 py-5">
                  <div className="overflow-hidden rounded-md border border-line bg-white">
                    <div className="grid grid-cols-[6px_1fr]">
                      <div className="bg-pine" />
                      <div className="bg-linen-warm px-4 py-4">
                        <div className="text-[1.15rem] font-semibold tracking-[var(--tracking-tight)] text-ink">{title}</div>
                        <div className="mt-1 text-sm text-muted">{text}</div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-3 border-t border-line px-4 py-3">
                      <span className="min-w-0 truncate font-mono text-[0.68rem] tracking-[0.04em] text-muted">{url}</span>
                      <MarkIcon className="h-4 w-4 shrink-0 text-pine" />
                    </div>
                  </div>
                </div>

                <div className="px-5 pb-4">
                  <div className="flex flex-col gap-2 rounded-xs border border-line bg-linen-warm px-3 py-2 sm:flex-row sm:items-center">
                    <span className="min-w-0 flex-1 truncate font-mono text-[0.78rem] text-muted">{url}</span>
                    <button type="button" onClick={handleCopy} className={copied ? "ghost-button sm" : "solid-button sm"}>
                      {copied ? "Copied" : "Copy link"}
                    </button>
                  </div>
                </div>

                {hideSecondaryLinks ? null : (
                  <div className="border-t border-line px-5 py-5">
                    <div className="eyebrow mb-3 text-[0.62rem]">SEND TO</div>
                    <div className="grid grid-cols-4 gap-2">
                      {destinations.map((destination) => (
                        <a
                          key={destination.id}
                          href={destination.href}
                          target={destination.id === "x" || destination.id === "whatsapp" ? "_blank" : undefined}
                          rel={destination.id === "x" || destination.id === "whatsapp" ? "noreferrer" : undefined}
                          className="flex flex-col items-center gap-2 rounded-xs border border-line bg-white px-2 py-3 text-center"
                          onClick={() => {
                            void trackShare(destination.id);
                          }}
                        >
                          <span className="text-base font-semibold text-ink">{destination.glyph}</span>
                          <span className="text-[0.72rem] font-semibold text-muted">{destination.label}</span>
                        </a>
                      ))}
                    </div>
                    {canNativeShare ? (
                      <button type="button" onClick={handleNativeShare} className="ghost-button mt-4 w-full justify-center">
                        <ShareGlyph />
                        Share on this device
                      </button>
                    ) : null}
                  </div>
                )}
              </div>
            </div>,
            document.body
          )
        : null}
    </>
  );
}
