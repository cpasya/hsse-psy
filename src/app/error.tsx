"use client";
export default function ErrorPage({
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <main className="boot">
      <h1>Terjadi kendala</h1>
      <p>Halaman belum dapat ditampilkan. Data form tidak dikirim otomatis.</p>
      <button className="btn btn-outline" onClick={reset}>
        Coba lagi
      </button>
    </main>
  );
}
