import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Image from "next/image";
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
    <main className="login-layout login-page">
      <section className="login-form-area" aria-labelledby="login-title">
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

          <p className="login-safety-line">"SAFETY FIRST IS SAFETY ALWAYS"</p>
          <h1 id="login-title">Sign In</h1>
          <p className="muted">
            Enter your work email and password to continue.
          </p>
          <LoginForm />
          <p className="login-help">
            Need access or forgot your password?
            <br />
            Contact your organization&apos;s SHiELD Administrator.
          </p>
        </div>
        <p className="login-copyright">
          © 2026 SHiELD · Safety &amp; Health - Integrated Electronic Live Database
        </p>
      </section>

      <section className="login-story login-brand-panel" aria-label="About SHIELD">
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

        {/* <div className="story-footer">
          <LockKeyhole size={16} /> Access by authority. Safety for everyone.
        </div> */}
      </section>
    </main>
  );
}
