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
    ? "Not assigned"
    : !canReadDepartment
      ? "No read permission"
      : department.isPending
        ? "Loading…"
        : department.isError
          ? "Failed to load"
          : (department.data?.name ?? "Unavailable");

  const jobPositionName = !user.jobPositionId
    ? "Not assigned"
    : !canReadJobPosition
      ? "No read permission"
      : jobPosition.isPending
        ? "Loading…"
        : jobPosition.isError
          ? "Failed to load"
          : (jobPosition.data?.name ?? "Unavailable");

  const companyName = !user.companyId
    ? "Not assigned"
    : !canReadCompany
      ? "No read permission"
      : company.isPending
        ? "Loading…"
        : company.isError
          ? "Failed to load"
          : (company.data?.companyName ?? "Unavailable");

  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">ACCOUNT SETTINGS</p>
          <h1>Profile</h1>
          <p className="muted">Your account information and effective permissions.</p>
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
              <dt>Name</dt>
              <dd>{user.name}</dd>
            </div>
            <div>
              <dt>Email</dt>
              <dd>{user.email}</dd>
            </div>
            <div>
              <dt>NIK</dt>
              <dd>{user.employeeId || "Unavailable"}</dd>
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
              <h2 id="access-title">Effective permissions</h2>
            </div>
            <ShieldCheck size={22} aria-hidden="true" />
          </div>

          {user.permissions.length ? (
            <div
              className="table-scroll"
              role="region"
              aria-label="Effective permissions table"
              tabIndex={0}
            >
              <table className="access-table profile-access-table">
                <thead>
                  <tr>
                    <th scope="col">Resource</th>
                    <th scope="col">Action</th>
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
            <p className="table-state">No operational permissions assigned.</p>
          )}
        </section>

        <section
          className="card profile-panel profile-password"
          aria-labelledby="password-title"
        >
          <div className="profile-panel-heading">
            <div>
              <p className="eyebrow">SECURITY</p>
              <h2 id="password-title">Change password</h2>
              <p className="muted">
                After a successful change, all sessions are revoked and you
                must sign in again.
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
