import Link from "next/link";
import { Wrench, ArrowUpRight, LockKeyhole } from "lucide-react";
export function ModulePlaceholder({
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
        <span className="badge neutral">Planned</span>
      </div>
      <section className="card placeholder">
        <div className="placeholder-icon">
          <Wrench size={32} />
        </div>
        <h2>Ruang untuk langkah berikutnya.</h2>
        <p>
          Modul ini masih dalam tahap perencanaan. Kontrak API, alur
          persetujuan, dan kebijakan data belum disepakati.
        </p>
        <div className="notice">
          <LockKeyhole size={18} />
          Tidak ada data operasional atau aksi unggah yang disimulasikan di
          sini.
        </div>
        <Link className="btn btn-outline" href="/dashboard">
          Kembali ke dashboard <ArrowUpRight size={18} />
        </Link>
      </section>
    </>
  );
}
export function Forbidden() {
  return (
    <section className="card state">
      <LockKeyhole size={32} />
      <h1>403 · Akses dibatasi</h1>
      <p>Peran Anda tidak memiliki izin untuk membuka modul ini.</p>
      <Link className="btn btn-outline" href="/dashboard">
        Kembali ke dashboard
      </Link>
    </section>
  );
}
