import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { LockKeyhole, ShieldCheck } from "lucide-react";

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
            Create a new password
          </h1>
          <p className="muted">
            The initial password is only used for your first sign-in.
            After it is changed, please sign in again.
          </p>

          <ChangePasswordForm />
        </div>
      </section>

      <section className="login-story" aria-label="Account security">
        <div className="story-copy">
          <LockKeyhole size={40} />
          <p className="eyebrow">ACCOUNT SECURITY</p>
          <h2>
            New password.
            <br />
            More secure access.
          </h2>
          <p>
            Do not reuse the initial password or share your password with
            anyone.
          </p>
        </div>
      </section>
    </main>
  );
}
