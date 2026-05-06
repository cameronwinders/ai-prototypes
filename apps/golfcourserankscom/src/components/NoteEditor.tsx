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
    <div className="shell-panel-contrast p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="eyebrow">PRIVATE NOTE</p>
          <h3 className="h3 mt-3 text-[1.35rem]">Capture what stood out</h3>
        </div>
        <div className="pill pill-line pill-sentence">
          {status}
          {lastSavedAt ? ` · Last saved ${formatUpdatedAt(lastSavedAt)}` : ""}
        </div>
      </div>

      <textarea
        value={note}
        onChange={(event) => setNote(event.target.value)}
        rows={6}
        placeholder="Fast greens, great walk, pricey but memorable on the back nine..."
        className="mt-4 w-full rounded-[var(--radius-md)] border border-[var(--line)] bg-white px-4 py-3 text-sm outline-none focus:border-[rgba(49,107,83,0.45)]"
      />

      <div className="mt-4 flex flex-wrap gap-3">
        <button type="button" onClick={onSave} disabled={pending} className="solid-button">
          {pending ? "Saving..." : "Save note"}
        </button>
        <button
          type="button"
          onClick={() => setNote(savedNote)}
          disabled={pending || note === savedNote}
          className="ghost-button"
        >
          Revert
        </button>
      </div>
    </div>
  );
}
