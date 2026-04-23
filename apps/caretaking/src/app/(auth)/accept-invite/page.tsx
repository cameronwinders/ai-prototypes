import Link from "next/link";
import { redirect } from "next/navigation";

import { acceptInvite } from "@/actions/invites";
import { AppShell } from "@/components/layout/app-shell";
import { SubmitButton } from "@/components/ui/submit-button";
import { createClient } from "@/lib/supabase/server";

type AcceptInvitePageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AcceptInvitePage({ searchParams }: AcceptInvitePageProps) {
  const params = await searchParams;
  const token = typeof params.token === "string" ? params.token : "";
  const error = typeof params.error === "string" ? params.error : "";
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/sign-in?next=${encodeURIComponent(`/accept-invite?token=${token}`)}`);
  }

  return (
    <AppShell title="Accept invite" subtitle="Join the shared caregiving space tied to this invite.">
      <form className="stack-card" action={acceptInvite}>
        <input type="hidden" name="token" value={token} />
        <p className="muted">
          Signed in as <strong>{user.email}</strong>.
        </p>
        {error ? <p className="error-text">{error}</p> : null}
        {!token ? <p className="error-text">Missing invite token.</p> : null}
        <SubmitButton className="button button-primary">Accept invite</SubmitButton>
        <Link className="button button-secondary" href="/spaces/new">
          Create a new space instead
        </Link>
      </form>
    </AppShell>
  );
}
