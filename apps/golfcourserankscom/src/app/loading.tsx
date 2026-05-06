export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="shell-panel p-6 sm:p-8">
        <div className="h-4 w-28 animate-pulse rounded-[var(--radius-xs)] bg-[rgba(49,107,83,0.18)]" />
        <div className="mt-5 h-16 w-full max-w-3xl animate-pulse rounded-[var(--radius-md)] bg-[rgba(29,42,36,0.08)]" />
        <div className="mt-4 h-6 w-full max-w-2xl animate-pulse rounded-[var(--radius-xs)] bg-[rgba(29,42,36,0.08)]" />
      </div>

      <div className="grid gap-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="shell-panel-contrast p-5">
            <div className="h-5 w-32 animate-pulse rounded-[var(--radius-xs)] bg-[rgba(29,42,36,0.08)]" />
            <div className="mt-4 h-8 w-3/4 animate-pulse rounded-[var(--radius-md)] bg-[rgba(29,42,36,0.08)]" />
            <div className="mt-3 h-4 w-2/3 animate-pulse rounded-[var(--radius-xs)] bg-[rgba(29,42,36,0.08)]" />
          </div>
        ))}
      </div>
    </div>
  );
}
