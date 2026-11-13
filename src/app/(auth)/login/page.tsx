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
          <h1 id="login-title">Sign in to your account</h1>
          <p className="muted">
            Use your work email and password to continue.
          </p>
          <LoginForm />
          <p className="login-help">
            Need access or forgot your password?
            <br />
            Contact your organization&apos;s HSSE Administrator.
          </p>
        </div>
        <p className="login-copyright">
          © 2026 HSSE · Health, Safety, Security &amp; Environment
        </p>
      </section>
      <section className="login-story" aria-label="About HSSE">
        <div className="story-copy">
          <div className="brand">
            <span className="brand-mark">
              <ShieldCheck size={32} />
            </span>
            <div>
              <strong>HSSE</strong>
              <small>Health, Safety, Security &amp; Environment</small>
            </div>
          </div>
          <p className="eyebrow">SAFETY IS A SHARED RESPONSIBILITY</p>
          <h2>
            Work safely.
            <br />
            Move with confidence.
          </h2>
          <p>
            A workspace for managing health, safety, security, and environment
            across your organization.
          </p>
        </div>
        <div className="story-footer">
          <LockKeyhole size={16} /> Access by authority. Safety for everyone.
        </div>
      </section>
    </main>
  );
}
