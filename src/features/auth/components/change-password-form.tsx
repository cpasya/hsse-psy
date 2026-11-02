"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { signOut } from "next-auth/react";
import {
  AlertCircle,
  Eye,
  EyeOff,
  Loader2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  changePasswordSchema,
  type ChangePasswordInput,
} from "../schemas";

export function ChangePasswordForm() {
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  async function submit(input: ChangePasswordInput) {
    setError("");

    try {
      const response = await fetch(
        "/api/session/change-password",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "same-origin",
          body: JSON.stringify(input),
        },
      );

      const result: unknown = await response.json();

      if (!response.ok) {
        throw new Error(
          typeof result === "object" &&
            result !== null &&
            "message" in result
            ? String(result.message)
            : "Password gagal diubah",
        );
      }

      await signOut({ redirect: false });
      location.assign("/login?passwordChanged=1");
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Server tidak dapat dihubungi",
      );
    }
  }

  return (
    <form
      onSubmit={handleSubmit(submit)}
      className="login-form"
      noValidate
    >
      <div className="field">
        <label htmlFor="new-password">
          Password baru
        </label>
        <div className="input-icon">
          <input
            id="new-password"
            type={show ? "text" : "password"}
            autoComplete="new-password"
            disabled={isSubmitting}
            aria-invalid={!!errors.password}
            {...register("password")}
          />
          <button
            type="button"
            className="icon-btn"
            disabled={isSubmitting}
            aria-label={
              show
                ? "Sembunyikan password"
                : "Tampilkan password"
            }
            onClick={() => setShow(!show)}
          >
            {show ? (
              <EyeOff size={18} />
            ) : (
              <Eye size={18} />
            )}
          </button>
        </div>
        {errors.password && (
          <p className="field-error">
            {errors.password.message}
          </p>
        )}
      </div>

      <div className="field">
        <label htmlFor="confirm-password">
          Konfirmasi password baru
        </label>
        <input
          id="confirm-password"
          type={show ? "text" : "password"}
          autoComplete="new-password"
          disabled={isSubmitting}
          aria-invalid={!!errors.confirmPassword}
          {...register("confirmPassword")}
        />
        {errors.confirmPassword && (
          <p className="field-error">
            {errors.confirmPassword.message}
          </p>
        )}
      </div>

      <ul className="muted">
        <li>Minimal 12 karakter</li>
        <li>Minimal satu huruf kapital</li>
        <li>Minimal satu angka</li>
        <li>Minimal satu simbol</li>
      </ul>

      {error && (
        <div className="notice error" role="alert">
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      <Button className="full" disabled={isSubmitting}>
        {isSubmitting ? (
          <Loader2 size={18} className="spin" />
        ) : null}
        {isSubmitting
          ? "Mengubah password…"
          : "Simpan password baru"}
      </Button>
    </form>
  );
}
