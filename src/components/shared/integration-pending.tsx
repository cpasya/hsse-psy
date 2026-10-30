import React from "react";
import Link from "next/link";
import { Database, LockKeyhole } from "lucide-react";
export function IntegrationPending({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">WORKSPACE HSSE</p>
          <h1>{title}</h1>
          <p className="muted">{description}</p>
        </div>
        <span className="badge neutral">Menunggu integrasi API</span>
      </div>
      <section className="card placeholder">
        <div className="placeholder-icon">
          <Database size={32} />
        </div>
        <h2>Sumber data belum dihubungkan</h2>
        <p>
          Halaman ini disiapkan untuk data backend. Daftar, formulir, dan aksi
          transaksi akan tersedia setelah kontrak API modul ini dikonfirmasi.
        </p>
        <div className="notice">
          <LockKeyhole size={18} />
          Tidak ada data contoh, penyimpanan lokal, atau request ke endpoint
          yang belum disepakati.
        </div>
        <Link className="btn btn-outline" href="/dashboard">
          Kembali ke dashboard
        </Link>
      </section>
    </>
  );
}
