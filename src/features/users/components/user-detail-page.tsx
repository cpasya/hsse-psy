"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import {
  getEmployee,
  replaceEmployeePermissions,
} from "@/features/employees/api";
import {
  employeePermissionFingerprint,
  type EmployeeDetail,
} from "@/features/employees/schemas";
import { getPermissionCatalogue } from "@/features/access/api";
import {
  validateSelection,
  type PermissionRecord,
} from "@/features/access/schemas";
import type { UserDTO } from "@/features/users/types";
import { can } from "@/lib/rbac";

const errorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "Request gagal";

export function UserDetailPage({
  employeeId,
  currentUser,
}: {
  employeeId: string;
  currentUser: UserDTO;
}) {
  const employee = useQuery({
    queryKey: ["employee-detail", currentUser.id, employeeId],
    queryFn: () => getEmployee(employeeId),
    retry: false,
  });

  const canManage =
    employeeId !== currentUser.id &&
    can(currentUser, "employees.update") &&
    can(currentUser, "permissions.read");

  const catalogue = useQuery({
    queryKey: ["access-catalogue", currentUser.id, currentUser.permissions],
    queryFn: getPermissionCatalogue,
    enabled: canManage,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  if (employee.isPending) {
    return <p role="status">Memuat detail user…</p>;
  }

  if (employee.isError) {
    return (
      <div className="notice error" role="alert">
        <p>{errorMessage(employee.error)}</p>
        <Button variant="outline" onClick={() => void employee.refetch()}>
          Coba lagi
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">MASTER USER</p>
          <h1>{employee.data.name}</h1>
          <p className="muted">Detail profil dan hak akses langsung user.</p>
        </div>

        <Button asChild variant="outline">
          <Link href="/users">
            <ArrowLeft size={18} />
            Kembali
          </Link>
        </Button>
      </div>

      <div className="employee-detail-grid">
        <ProfileCard employee={employee.data} />

        <AccessCard
          key={employeePermissionFingerprint(employee.data)}
          employee={employee.data}
          catalogue={catalogue.data ?? []}
          canManage={canManage}
          catalogueLoading={canManage && catalogue.isPending}
          catalogueError={canManage ? catalogue.error : null}
          onRetryCatalogue={() => void catalogue.refetch()}
          onSaved={async () => {
            await employee.refetch();
          }}
        />
      </div>
    </>
  );
}

function ProfileCard({ employee }: { employee: EmployeeDetail }) {
  return (
    <section className="card" aria-labelledby="profile-title">
      <div className="section-heading compact-heading">
        <div>
          <h2 id="profile-title">Profil employee</h2>
          <p className="muted">Data identitas dari backend.</p>
        </div>
        <StatusBadge status={employee.status} />
      </div>

      <dl className="detail-dl">
        <dt>Email</dt>
        <dd>{employee.email}</dd>
        <dt>Nomor karyawan</dt>
        <dd>{employee.employeeNumber ?? "—"}</dd>
        <dt>Telepon</dt>
        <dd>{employee.phone ?? "—"}</dd>
        <dt>Department ID</dt>
        <dd>{employee.departmentId ?? "—"}</dd>
        <dt>Job Position ID</dt>
        <dd>{employee.jobPositionId ?? "—"}</dd>
      </dl>
    </section>
  );
}

function AccessCard({
  employee,
  catalogue,
  canManage,
  catalogueLoading,
  catalogueError,
  onRetryCatalogue,
  onSaved,
}: {
  employee: EmployeeDetail;
  catalogue: PermissionRecord[];
  canManage: boolean;
  catalogueLoading: boolean;
  catalogueError: unknown;
  onRetryCatalogue: () => void;
  onSaved: () => Promise<void>;
}) {
  const client = useQueryClient();
  const original = employee.permissions.map((permission) => permission.id);
  const [selected, setSelected] = useState(original);
  const [search, setSearch] = useState("");
  const [confirm, setConfirm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const selectedSet = new Set(selected);
  const changed =
    JSON.stringify([...selected].sort()) !==
    JSON.stringify([...original].sort());

  const groups = useMemo(() => {
    const result = new Map<string, PermissionRecord[]>();
    const needle = search.trim().toLowerCase();

    for (const permission of catalogue) {
      if (
        needle &&
        !`${permission.resource}.${permission.action}`
          .toLowerCase()
          .includes(needle)
      ) {
        continue;
      }

      const items = result.get(permission.resource) ?? [];
      items.push(permission);
      result.set(permission.resource, items);
    }

    return [...result.entries()];
  }, [catalogue, search]);

  const unknown = useMemo(() => {
    const catalogueIds = new Set(catalogue.map((permission) => permission.id));
    const needle = search.trim().toLowerCase();

    return employee.permissions.filter(
      (permission) =>
        !catalogueIds.has(permission.id) &&
        (!needle ||
          `${permission.resource}.${permission.action}`
            .toLowerCase()
            .includes(needle)),
    );
  }, [catalogue, employee.permissions, search]);

  function toggle(id: string, checked: boolean) {
    setSelected((current) =>
      checked
        ? [...new Set([...current, id])]
        : current.filter((value) => value !== id),
    );
  }

  async function save() {
    setSaving(true);
    setError("");

    try {
      validateSelection(selected, original, catalogue);

      const current = await getEmployee(employee.id);

      if (
        employeePermissionFingerprint(current) !==
        employeePermissionFingerprint(employee)
      ) {
        throw new Error(
          "Hak akses berubah sejak halaman dibuka. Muat ulang sebelum menyimpan.",
        );
      }

      await replaceEmployeePermissions(employee.id, selected);
      await client.invalidateQueries({ queryKey: ["employees"] });
      await onSaved();
      toast.success("Hak akses user tersimpan");
    } catch (caught) {
      const message = errorMessage(caught);
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
      setConfirm(false);
    }
  }

  return (
    <section className="card" aria-labelledby="access-title">
      <div className="section-heading compact-heading">
        <div>
          <h2 id="access-title">Hak akses</h2>
          <p className="muted">
            {original.length} permission terpasang pada user ini.
          </p>
        </div>
        <ShieldCheck size={22} aria-hidden="true" />
      </div>

      {error && (
        <div className="notice error" role="alert">
          {error}
        </div>
      )}

      {!canManage ? (
        <>
          <p className="muted access-note">
            Hak akses hanya dapat diubah dengan employees.update dan
            permissions.read. Akun sendiri selalu read-only.
          </p>
          <ExistingPermissions employee={employee} />
        </>
      ) : catalogueLoading ? (
        <p className="access-note" role="status">
          Memuat katalog permission lengkap…
        </p>
      ) : catalogueError ? (
        <div className="notice error" role="alert">
          <p>{errorMessage(catalogueError)}</p>
          <Button variant="outline" onClick={onRetryCatalogue}>
            Coba lagi
          </Button>
        </div>
      ) : (
        <>
          <div className="field access-search">
            <label htmlFor="employee-permission-search">Cari permission</label>
            <input
              id="employee-permission-search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Contoh: employees.read"
            />
          </div>

          <div className="permission-groups">
            {groups.map(([resource, permissions]) => (
              <fieldset className="permission-group" key={resource}>
                <legend>{resource}</legend>
                {permissions.map((permission) => {
                  const checked = selectedSet.has(permission.id);

                  return (
                    <label className="permission-switch" key={permission.id}>
                      <span>
                        <strong>{permission.action}</strong>
                        <small>
                          {permission.isActive ? "Aktif" : "Nonaktif"}
                        </small>
                      </span>
                      <input
                        type="checkbox"
                        role="switch"
                        checked={checked}
                        disabled={!permission.isActive && !checked}
                        onChange={(event) =>
                          toggle(permission.id, event.target.checked)
                        }
                      />
                    </label>
                  );
                })}
              </fieldset>
            ))}

            {!!unknown.length && (
              <fieldset className="permission-group">
                <legend>Tidak ada di katalog</legend>
                {unknown.map((permission) => (
                  <label className="permission-switch" key={permission.id}>
                    <span>
                      <strong>
                        {permission.resource}.{permission.action}
                      </strong>
                      <small>Dipertahankan kecuali dilepas eksplisit</small>
                    </span>
                    <input
                      type="checkbox"
                      role="switch"
                      checked={selectedSet.has(permission.id)}
                      onChange={(event) =>
                        toggle(permission.id, event.target.checked)
                      }
                    />
                  </label>
                ))}
              </fieldset>
            )}

            {!groups.length && !unknown.length && (
              <p className="muted">Tidak ada permission yang sesuai.</p>
            )}
          </div>

          <p className="muted access-note">
            PUT mengganti seluruh daftar: {original.length} existing →{" "}
            {selected.length} dipilih. Daftar kosong mencabut seluruh akses.
          </p>

          <div className="dialog-actions">
            <Button
              variant="outline"
              disabled={!changed || saving}
              onClick={() => setSelected(original)}
            >
              Batalkan perubahan
            </Button>
            <Button
              disabled={!changed || saving}
              onClick={() => setConfirm(true)}
            >
              Simpan hak akses
            </Button>
          </div>
        </>
      )}

      <ConfirmDialog
        open={confirm}
        onOpenChange={(open) => !saving && setConfirm(open)}
        title="Ganti seluruh hak akses user?"
        description={`${employee.name}: ${original.length} permission menjadi ${selected.length}. Perubahan ini langsung memengaruhi akses user.`}
        pending={saving}
        onConfirm={() => void save()}
      />
    </section>
  );
}

function ExistingPermissions({ employee }: { employee: EmployeeDetail }) {
  if (!employee.permissions.length) {
    return <p className="muted access-note">Belum ada permission.</p>;
  }

  return (
    <ul className="access-existing">
      {employee.permissions.map((permission) => (
        <li key={permission.id}>
          {permission.resource}.{permission.action}
          {!permission.isActive ? " — nonaktif" : ""}
        </li>
      ))}
    </ul>
  );
}
