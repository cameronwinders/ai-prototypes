import { createSpace } from "@/actions/spaces";
import { SubmitButton } from "@/components/ui/submit-button";

export function CreateSpaceForm({ error }: { error?: string }) {
  return (
    <form className="stack-card" action={createSpace}>
      <label className="field">
        <span>Space name</span>
        <input name="name" placeholder="Family care team" required />
      </label>
      <label className="field">
        <span>Primary subject</span>
        <input name="subjectName" placeholder="Who is being cared for?" />
      </label>
      <p className="muted">
        You can start with one person or thing being cared for and expand later.
      </p>
      {error ? <p className="error-text">{error}</p> : null}
      <SubmitButton className="button button-primary">Create shared space</SubmitButton>
    </form>
  );
}
