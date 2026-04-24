export default function Home() {
  return (
    <main className="app-shell">
      <section className="hero-card">
        <p className="eyebrow">AI prototype child</p>
        <h1>Creator App Studio</h1>
        <p className="lede">
          This deployable scaffold was created at <code>apps/creator-app-studio</code> and is wired for the shared Supabase schema <code>app_creator_app_studio</code>.
        </p>
      </section>

      <section className="checklist-card">
        <h2>Next steps</h2>
        <ol>
          <li>Paste the Notion PM, Design, Testing, and Orchestrator handoffs into <code>spec/</code>.</li>
          <li>Implement the feature set for this prototype in <code>src/</code>.</li>
          <li>Run <code>npm run verify:config --workspace=creator-app-studio</code> and <code>npm run build --workspace=creator-app-studio</code>.</li>
        </ol>
      </section>
    </main>
  );
}
