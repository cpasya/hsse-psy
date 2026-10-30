import Link from "next/link";
export default function NotFound() {
  return (
    <main className="boot">
      <h1>404 · Halaman tidak ditemukan</h1>
      <p>Alamat yang Anda cari tidak tersedia.</p>
      <Link href="/dashboard" className="btn btn-outline">
        Kembali ke dashboard
      </Link>
    </main>
  );
}
