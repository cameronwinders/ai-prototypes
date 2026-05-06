import Link from "next/link";

export default function NotFound() {
  return (
    <div className="shell-panel p-6 sm:p-8">
      <p className="eyebrow">PAGE NOT FOUND</p>
      <h1 className="h2 mt-4">That page is out of bounds</h1>
      <p className="subhed mt-4">
        The link may be old, or the page may have moved while the national board kept growing. Use one of the quick routes below to get back into the app.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/leaderboard" className="solid-button">
          Open leaderboard
        </Link>
        <Link href="/courses" className="ghost-button">
          Browse courses
        </Link>
        <Link href="/" className="ghost-button">
          Back to home
        </Link>
      </div>
    </div>
  );
}
