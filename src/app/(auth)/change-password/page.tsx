import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Image from "next/image";

import { ChangePasswordForm } from "@/features/auth/components/change-password-form";
import { authOptions } from "@/lib/auth";

export const metadata = {
  title: "Change Password",
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
    <main className="login-layout login-page password-page">
      <section
        className="login-form-area"
        aria-labelledby="change-password-title"
      >
        <div className="login-form-wrap">
          <div className="login-mobile-brand">
            <Image
              src="/brand/kufpec-logo.png"
              alt="KUFPEC"
              width={494}
              height={199}
              priority
            />
          </div>

          <p className="login-safety-line">SECURE YOUR ACCOUNT</p>
          <h1 id="change-password-title">Create a new password</h1>
          <p className="muted">
            The initial password is only used for your first sign-in.
            After it is changed, please sign in again.
          </p>

          <ChangePasswordForm />
        </div>
      </section>

      <section
        className="login-story login-brand-panel"
        aria-label="Account security"
      >
        <div className="login-brand-content">
          <Image
            className="kufpec-logo"
            src="/brand/kufpec-logo.png"
            alt="KUFPEC"
            width={494}
            height={199}
            priority
          />

          <div className="login-brand-message">
            <h1 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '75px' }} >SAFETY &amp; HEALTH - INTEGRATED ELECTRONIC LIVE DATABASE</h1>
            <Image src="/brand/SHIELD-KUFPEC.png" alt="KUFPEC" width={350} height={350} priority />
          </div>
        </div>
      </section>
    </main>
  );
}
