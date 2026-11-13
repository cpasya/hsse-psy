import Link from "next/link";
export default function NotFound() {
  return (
    <main className="boot">
      <h1>404 · Page not found</h1>
      <p>The address you are looking for is unavailable.</p>
      <Link href="/dashboard" className="btn btn-outline">
        Back to dashboard
      </Link>
    </main>
  );
}
