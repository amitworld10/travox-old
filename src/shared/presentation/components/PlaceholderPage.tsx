type PlaceholderPageProps = {
  title: string;
  description?: string;
};

export function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  return (
    <main className="page-shell">
      <section className="panel">
        <h1>{title}</h1>
        <p className="muted">
          {description ?? "This surface is reserved for the Next.js migration."}
        </p>
      </section>
    </main>
  );
}
