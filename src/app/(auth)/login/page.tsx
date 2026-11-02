import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { LoginForm } from "@/features/auth/components/login-form";
import { ShieldCheck, LockKeyhole } from "lucide-react";

export default async function LoginPage() {
  const session = await getServerSession(authOptions);
  if (session && !session.error) {
    redirect(
      session.user.mustachePassword
        ? "/change-password"
        : "/dashboard",
    );
  }
  return (
    <main className="login-layout">
      <section className="login-form-area" aria-labelledby="login-title">
        <div className="login-form-wrap">
          <div className="brand" aria-label="HSSE Management System">
            <span className="brand-mark">
              <ShieldCheck size={24} />
            </span>
            <div>
              <strong>HSSE</strong>
              <small>Management System</small>
            </div>
          </div>
          <h1 id="login-title">Masuk ke akun Anda</h1>
          <p className="muted">
            Gunakan email dan password kantor untuk melanjutkan.
          </p>
          <LoginForm />
          <p className="login-help">
            Butuh akses atau lupa password?
            <br />
            Hubungi Administrator HSSE di organisasi Anda.
          </p>
        </div>
        <p className="login-copyright">
          © 2026 HSSE · K3, Keamanan &amp; Lingkungan
        </p>
      </section>
      <section className="login-story" aria-label="Tentang HSSE">
        <div className="story-copy">
          <div className="brand">
            <span className="brand-mark">
              <ShieldCheck size={32} />
            </span>
            <div>
              <strong>HSSE</strong>
              <small>K3, Keamanan &amp; Lingkungan</small>
            </div>
          </div>
          <p className="eyebrow">SAFETY IS A SHARED RESPONSIBILITY</p>
          <h2>
            Kerja aman.
            <br />
            Langkah pasti.
          </h2>
          <p>
            Ruang kerja untuk mendukung pengelolaan keselamatan, keamanan, dan
            lingkungan di organisasi Anda.
          </p>
        </div>
        <div className="story-footer">
          <LockKeyhole size={16} /> Akses sesuai wewenang. Keselamatan untuk
          semua.
        </div>
      </section>
    </main>
  );
}
