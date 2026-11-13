"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { getSession, signIn } from "next-auth/react";
import { Eye, EyeOff, ArrowRight, Loader2, AlertCircle } from "lucide-react";
import { loginSchema } from "../schemas";
import { LoginPayload } from "../types";
import { Button } from "@/components/ui/button";
export function LoginForm() {
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginPayload>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });
  async function submit(data: LoginPayload) {
    setError("");
    try {
      const query = new URLSearchParams(location.search);
      const target = query.get("callbackUrl");
      let callbackUrl = "/dashboard";
      if (target) {
        const url = new URL(target, location.origin);
        if (
          url.origin === location.origin &&
          url.pathname.startsWith("/") &&
          !url.pathname.startsWith("/login")
        )
          callbackUrl = url.pathname + url.search;
      }
      const result = await signIn("credentials", {
        ...data,
        redirect: false,
        callbackUrl,
      });
      if (result?.error) {
        setError(
          result.error === "CredentialsSignin"
            ? "Incorrect email or password"
            : result.error,
        );
        return;
      }

      const session = await getSession();

      location.assign(
        session?.user.mustachePassword
          ? "/change-password"
          : callbackUrl,
      );
    } catch {
      setError("The server could not be reached. Please try again.");
    }
  }
  return (
    <form onSubmit={handleSubmit(submit)} className="login-form" noValidate>
      <div className="field">
        <label htmlFor="email">Work email</label>
        <input
          id="email"
          type="email"
          autoComplete="username"
          placeholder="name@company.com"
          disabled={isSubmitting}
          aria-invalid={!!errors.email}
          {...register("email")}
        />
        {errors.email && <p className="field-error">{errors.email.message}</p>}
      </div>
      <div className="field">
        <label htmlFor="password">Password</label>
        <div className="input-icon">
          <input
            id="password"
            type={show ? "text" : "password"}
            autoComplete="current-password"
          placeholder="Enter your password"
            disabled={isSubmitting}
            aria-invalid={!!errors.password}
            {...register("password")}
          />
          <button
            type="button"
            className="icon-btn"
            disabled={isSubmitting}
            aria-label={show ? "Hide password" : "Show password"}
            onClick={() => setShow(!show)}
          >
            {show ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        {errors.password && (
          <p className="field-error">{errors.password.message}</p>
        )}
      </div>
      {error && (
        <div className="notice error" role="alert">
          <AlertCircle size={18} />
          {error}
        </div>
      )}
      <Button className="full" disabled={isSubmitting}>
        {isSubmitting ? <Loader2 size={18} className="spin" /> : null}
        {isSubmitting ? "Signing in…" : "Sign in to Dashboard"}
        <ArrowRight size={18} />
      </Button>
    </form>
  );
}
