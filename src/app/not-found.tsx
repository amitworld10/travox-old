import Link from "next/link";

export default function NotFound() {
  return (
    <main className="page-shell">
      <div className="panel">
        <h1>Page not found</h1>
        <p className="muted">This Travox surface has not been migrated yet.</p>
        <Link href="/customers">Go to customers</Link>
      </div>
    </main>
  );
}
