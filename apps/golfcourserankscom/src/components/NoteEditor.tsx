"use client";

import { useState } from "react";

import { saveCourseNote } from "@/app/actions";
import { formatUpdatedAt } from "@/lib/ranking";

type NoteEditorProps = {
  courseId: string;
  initialNote: string;
};

export function NoteEditor({ courseId, initialNote }: NoteEditorProps) {
  const [note, setNote] = useState(initialNote);
  const [savedNote, setSavedNote] = useState(initialNote);
  const [status, setStatus] = useState<string>("Your note stays private and can feed anonymous summary themes.");
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSave() {
    const previous = savedNote;
    setPending(true);
    setStatus("Saving note...");

    const result = await saveCourseNote(courseId, note);
    setPending(false);

    if (!result.ok) {
      setNote(previous);
      setStatus(result.message ?? "We could not save your note.");
      return;
    }

    setSavedNote(note);
    setLastSavedAt(result.message ?? new Date().toISOString());
    setStatus("Saved");
  }

  return (
    <div className="rounded-[1.7rem] border border-[var(--line)] bg-white/92 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="section-label">Your note</p>
          <h3 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-[var(--ink)]">
            Capture what stood out.
          </h3>
        </div>
        <div className="rounded-full border border-[var(--line)] bg-[rgba(255,255,255,0.86)] px-4 py-2 text-sm text-[var(--muted)]">
          {status} {lastSavedAt ? `· Last saved ${formatUpdatedAt(lastSavedAt)}` : ""}
        </div>
      </div>

      <textarea
        value={note}
        onChange={(event) => setNote(event.target.value)}
        rows={6}
        placeholder="Fast greens, great walk, pricey but memorable on the back nine..."
        className="mt-4 w-full rounded-[1.5rem] border border-[var(--line)] bg-white px-4 py-3 text-sm outline-none focus:border-[rgba(49,107,83,0.45)]"
      />

      <div className="mt-4 flex flex-wrap gap-3">
        <button type="button" onClick={onSave} disabled={pending} className="solid-button min-h-11">
          {pending ? "Saving..." : "Save note"}
        </button>
        <button
          type="button"
          onClick={() => setNote(savedNote)}
          disabled={pending || note === savedNote}
          className="ghost-button min-h-11"
        >
          Revert
        </button>
      </div>
    </div>
  );
}
