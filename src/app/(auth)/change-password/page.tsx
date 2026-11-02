import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { LockKeyhole, ShieldCheck } from "lucide-react";

import { ChangePasswordForm } from "@/features/auth/components/change-password-form";
import { authOptions } from "@/lib/auth";

export const metadata = {
  title: "Ganti Password",
};

export default async function ChangePasswordPage() {
  const session = await getServerSession(authOptions);

  if (!session || session.error) {
    redirect("/login");
  }

  if (!session.user.mustachePassword) {
    redirect("/dashboard");
  }

  return (
    <main className="login-layout">
      <section
        className="login-form-area"
        aria-labelledby="change-password-title"
      >
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

          <h1 id="change-password-title">
            Buat password baru
          </h1>
          <p className="muted">
            Password awal hanya digunakan untuk login pertama.
            Setelah berhasil, silakan login kembali.
          </p>

          <ChangePasswordForm />
        </div>
      </section>

      <section className="login-story" aria-label="Keamanan akun">
        <div className="story-copy">
          <LockKeyhole size={40} />
          <p className="eyebrow">PENGAMANAN AKUN</p>
          <h2>
            Password baru.
            <br />
            Akses lebih aman.
          </h2>
          <p>
            Jangan gunakan kembali password awal atau membagikan
            password kepada siapa pun.
          </p>
        </div>
      </section>
    </main>
  );
}
