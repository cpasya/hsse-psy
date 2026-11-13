"use client";
export default function ErrorPage({
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <main className="boot">
      <h1>Something went wrong</h1>
      <p>The page cannot be displayed yet. Form data was not submitted automatically.</p>
      <button className="btn btn-outline" onClick={reset}>
        Try again
      </button>
    </main>
  );
}
