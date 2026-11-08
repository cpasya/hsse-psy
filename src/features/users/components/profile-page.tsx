"use client";

import { useQuery } from "@tanstack/react-query";
import { KeyRound, ShieldCheck } from "lucide-react";

import { StatusBadge } from "@/components/shared/status-badge";
import { ChangePasswordForm } from "@/features/auth/components/change-password-form";
import { getCompany } from "@/features/companies/api";
import { getDepartment } from "@/features/departments/api";
import { getJobPosition } from "@/features/job-positions/api";
import { can } from "@/lib/rbac";
import { initials } from "@/lib/utils";

import type { UserDTO } from "../types";

export function ProfilePage({ user }: { user: UserDTO }) {
  const canReadDepartment = can(user, "departments.read");
  const canReadJobPosition = can(user, "job-positions.read");
  const canReadCompany = can(user, "companies.read");

  const department = useQuery({
    queryKey: ["profile-reference", user.id, "departments", user.departmentId],
    queryFn: () => getDepartment(user.departmentId!),
    enabled: canReadDepartment && !!user.departmentId,
    retry: false,
    staleTime: 60_000,
  });

  const jobPosition = useQuery({
    queryKey: [
      "profile-reference",
      user.id,
      "job-positions",
      user.jobPositionId,
    ],
    queryFn: () => getJobPosition(user.jobPositionId!),
    enabled: canReadJobPosition && !!user.jobPositionId,
    retry: false,
    staleTime: 60_000,
  });

  const company = useQuery({
    queryKey: ["profile-reference", user.id, "companies", user.companyId],
    queryFn: () => getCompany(user.companyId!),
    enabled: canReadCompany && !!user.companyId,
    retry: false,
    staleTime: 60_000,
  });

  const departmentName = !user.departmentId
    ? "Belum ditetapkan"
    : !canReadDepartment
      ? "Tidak memiliki izin membaca"
      : department.isPending
        ? "Memuat…"
        : department.isError
          ? "Gagal memuat"
          : (department.data?.name ?? "Belum tersedia");

  const jobPositionName = !user.jobPositionId
    ? "Belum ditetapkan"
    : !canReadJobPosition
      ? "Tidak memiliki izin membaca"
      : jobPosition.isPending
        ? "Memuat…"
        : jobPosition.isError
          ? "Gagal memuat"
          : (jobPosition.data?.name ?? "Belum tersedia");

  const companyName = !user.companyId
    ? "Belum ditetapkan"
    : !canReadCompany
      ? "Tidak memiliki izin membaca"
      : company.isPending
        ? "Memuat…"
        : company.isError
          ? "Gagal memuat"
          : (company.data?.companyName ?? "Belum tersedia");

  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">ACCOUNT SETTINGS</p>
          <h1>Profile</h1>
          <p className="muted">Informasi akun dan akses efektif Anda.</p>
        </div>
      </div>

      <div className="profile-page">
        <section
          className="card profile-panel"
          aria-labelledby="personal-title"
        >
          <div className="profile-panel-heading">
            <div>
              <p className="eyebrow">PROFILE</p>
              <h2 id="personal-title">Personal Information</h2>
            </div>
          </div>

          <div className="profile-hero">
            <span className="avatar profile-avatar" aria-hidden="true">
              {user.image ? (
                <img src={user.image} alt="" referrerPolicy="no-referrer" />
              ) : (
                initials(user.name)
              )}
            </span>

            <div>
              <h3>{user.name}</h3>
              <p>
                {jobPositionName} · {departmentName}
              </p>
            </div>
          </div>

          <dl className="profile-information-grid">
            <div>
              <dt>Nama</dt>
              <dd>{user.name}</dd>
            </div>
            <div>
              <dt>Email</dt>
              <dd>{user.email}</dd>
            </div>
            <div>
              <dt>NIK</dt>
              <dd>{user.employeeId || "Belum tersedia"}</dd>
            </div>
            <div>
              <dt>Status</dt>
              <dd>
                <StatusBadge status={user.status} />
              </dd>
            </div>
            <div>
              <dt>Job Position</dt>
              <dd>{jobPositionName}</dd>
            </div>
            <div>
              <dt>Department</dt>
              <dd>{departmentName}</dd>
            </div>
            <div>
              <dt>Company</dt>
              <dd>{companyName}</dd>
            </div>
          </dl>
        </section>

        <section className="card profile-panel" aria-labelledby="access-title">
          <div className="profile-panel-heading">
            <div>
              <p className="eyebrow">AUTHORIZATION</p>
              <h2 id="access-title">Hak akses efektif</h2>
            </div>
            <ShieldCheck size={22} aria-hidden="true" />
          </div>

          {user.permissions.length ? (
            <div
              className="table-scroll"
              role="region"
              aria-label="Tabel hak akses efektif"
              tabIndex={0}
            >
              <table className="access-table profile-access-table">
                <thead>
                  <tr>
                    <th scope="col">Resource</th>
                    <th scope="col">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {user.permissions.map((permission) => {
                    const [resource, ...actions] = permission.split(".");

                    return (
                      <tr key={permission}>
                        <td>
                          <strong>{resource}</strong>
                        </td>
                        <td>
                          <code>{actions.join(".") || "—"}</code>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="table-state">Tidak ada permission operasional.</p>
          )}
        </section>

        <section
          className="card profile-panel profile-password"
          aria-labelledby="password-title"
        >
          <div className="profile-panel-heading">
            <div>
              <p className="eyebrow">SECURITY</p>
              <h2 id="password-title">Ganti password</h2>
              <p className="muted">
                Setelah berhasil, seluruh sesi dicabut dan Anda harus login
                kembali.
              </p>
            </div>
            <KeyRound size={22} aria-hidden="true" />
          </div>

          <ChangePasswordForm />
        </section>
      </div>
    </>
  );
}
