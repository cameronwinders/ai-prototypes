import Link from "next/link";

import { signOut } from "@/actions/auth";

type AccountMenuProps = {
  displayName: string;
  relationshipLabel?: string | null;
};

export function AccountMenu({ displayName, relationshipLabel }: AccountMenuProps) {
  return (
    <div className="account-menu" aria-label="Account">
      <Link className="account-link" href="/profile">
        <span className="account-avatar" aria-hidden="true">
          {displayName.slice(0, 1).toUpperCase()}
        </span>
        <span>
          <strong>{displayName}</strong>
          <small>{relationshipLabel || "Profile"}</small>
        </span>
      </Link>
      <Link className="account-logout" href="/spaces">
        Spaces
      </Link>
      <form action={signOut}>
        <button className="account-logout" type="submit">
          Log out
        </button>
      </form>
    </div>
  );
}
