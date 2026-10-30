"use client";

import {
  useEffect,
  useState,
  type FormEvent,
} from "react";

import { useSession } from "next-auth/react";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { toast } from "sonner";

import {
  Plus,
  Search,
  Users,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/status-badge";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { ReferenceSelect } from "@/components/shared/reference-select";
import { Forbidden } from "@/components/shared/module-placeholder";

import { initials } from "@/lib/utils";
import { can } from "@/lib/rbac";

import type { UserDTO } from "@/features/users/types";

import {
  createEmployee,
  disableEmployee,
  getEmployees,
  updateEmployee,
} from "@/features/employees/api";

import {
  createEmployeeSchema,
  updateEmployeeSchema,
  type BackendEmployee,
  type EmployeeStatus,
} from "@/features/employees/schemas";

import {
  getReferenceOptions,
} from "@/features/references/api";

import {
  REFERENCE_FIELDS,
  referencePatch,
  type ReferenceValues,
  type ReferenceAvailability,
} from "@/features/references/selection";

const message = (error: unknown) =>
  error instanceof Error
    ? error.message
    : "Terjadi kesalahan";

const text = (form: FormData, key: string) =>
  String(form.get(key) ?? "").trim();

const nullable = (form: FormData, key: string) =>
  text(form, key) || null;

const referencesOf = (
  employee: BackendEmployee | null,
): ReferenceValues => ({
  roleId: employee?.roleId ?? "",
  departmentId: employee?.departmentId ?? "",
  locationId: employee?.locationId ?? "",
});

export function UsersPage(
  _props: { currentUser: UserDTO },
) {
  const {
    data: session,
    status: sessionStatus,
  } = useSession();

  // Sumber izin adalah session terbaru, bukan prop server lama.
  const user =
    sessionStatus === "authenticated" &&
      !session?.error
      ? session.user
      : null;

  const client = useQueryClient();

  const [search, setSearch] = useState("");

  const [filters, setFilters] = useState({
    page: 1,
    limit: 20,
    search: "",
    status: "" as EmployeeStatus | "",
  });

  const [formOpen, setFormOpen] = useState(false);

  const [editing, setEditing] =
    useState<BackendEmployee | null>(null);

  const [selected, setSelected] =
    useState<ReferenceValues>(referencesOf(null));

  const [disableTarget, setDisableTarget] =
    useState<BackendEmployee | null>(null);

  const [formError, setFormError] = useState("");

  const canSaveForm = can(
    user,
    editing
      ? "employees.update"
      : "employees.create",
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters((current) =>
        current.search === search.trim()
          ? current
          : {
            ...current,
            search: search.trim(),
            page: 1,
          },
      );
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  const accessKey = JSON.stringify([
    user?.id,
    user?.roleId,
    user?.departmentId,
    user?.locationId,
    user?.jobPositionId,
    user?.updatedAt,
    user?.permissions,
  ]);

  const query = useQuery({
    enabled: can(user, "employees.read"),

    queryKey: [
      "employees",
      accessKey,
      filters,
    ],

    queryFn: () =>
      getEmployees({
        ...filters,
        status: filters.status || undefined,
      }),
  });

  // Hook selalu dipanggil.
  // Request hanya aktif ketika form dan izin sesuai.
  const roles = useQuery({
    queryKey: [
      "references",
      accessKey,
      "roles",
    ],
    enabled:
      formOpen &&
      canSaveForm &&
      can(user, "roles.read"),
    queryFn: () => getReferenceOptions("roles"),
  });

  const departments = useQuery({
    queryKey: [
      "references",
      accessKey,
      "departments",
    ],
    enabled:
      formOpen &&
      canSaveForm &&
      can(user, "departments.read"),
    queryFn: () =>
      getReferenceOptions("departments"),
  });

  const locations = useQuery({
    queryKey: [
      "references",
      accessKey,
      "locations",
    ],
    enabled:
      formOpen &&
      canSaveForm &&
      can(user, "locations.read"),
    queryFn: () =>
      getReferenceOptions("locations"),
  });

  const referenceQueries = {
    roleId: roles,
    departmentId: departments,
    locationId: locations,
  };

  const availability = Object.fromEntries(
    REFERENCE_FIELDS.map((field) => {
      const current = referenceQueries[field.key];
      const allowed = can(user, field.permission);

      return [
        field.key,
        {
          allowed,
          ready:
            allowed &&
            current.isSuccess &&
            !current.isFetching,
          items: allowed
            ? current.data ?? []
            : [],
        },
      ];
    }),
  ) as Record<
    keyof ReferenceValues,
    ReferenceAvailability
  >;

  // Total bisa menyusut setelah disable/filter.
  // Jangan tetap berada di halaman yang sudah tidak ada.
  useEffect(() => {
    const result = query.data;

    if (
      result &&
      result.page > result.totalPages
    ) {
      setFilters((current) =>
        current.page === result.page
          ? {
            ...current,
            page: result.totalPages,
          }
          : current,
      );
    }
  }, [query.data]);

  const save = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string | null;
      payload: unknown;
    }) =>
      id
        ? updateEmployee(
          id,
          updateEmployeeSchema.parse(payload),
        )
        : createEmployee(
          createEmployeeSchema.parse(payload),
        ),

    onSuccess: async (_data, variables) => {
      setFormOpen(false);
      setEditing(null);
      setFormError("");

      if (!variables.id) {
        setFilters((current) => ({
          ...current,
          page: 1,
        }));
      }

      toast.success("Data karyawan tersimpan");

      await client.invalidateQueries({
        queryKey: ["employees"],
      });
    },

    onError: (error) => {
      setFormError(message(error));
      toast.error(message(error));
    },
  });

  const disable = useMutation({
    mutationFn: disableEmployee,

    onSuccess: async () => {
      setDisableTarget(null);
      toast.success("Karyawan dinonaktifkan");

      await client.invalidateQueries({
        queryKey: ["employees"],
      });
    },

    onError: (error) =>
      toast.error(message(error)),
  });

  function openForm(
    employee: BackendEmployee | null,
  ) {
    setEditing(employee);
    setSelected(referencesOf(employee));
    setFormError("");
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    setEditing(null);
    setSelected(referencesOf(null));
    setFormError("");
  }

  function submit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    setFormError("");

    const requiredPermission = editing
      ? "employees.update"
      : "employees.create";

    if (!can(user, requiredPermission)) {
      setFormError(
        "Izin aksi sudah tidak tersedia",
      );
      return;
    }

    try {
      const form = new FormData(
        event.currentTarget,
      );

      const status = text(form, "status");

      if (
        editing?.id === user?.id &&
        status === "disabled"
      ) {
        throw new Error(
          "Tidak dapat menonaktifkan akun sendiri.",
        );
      }

      const referenceChanges = referencePatch(
        selected,
        referencesOf(editing),
        !!editing,
        availability,
      );

      const optionalFields = {
        employeeNumber: nullable(
          form,
          "employeeNumber",
        ),

        phone: nullable(form, "phone"),

        jobPositionId: nullable(
          form,
          "jobPositionId",
        ),

        ...referenceChanges,
      };

      /*
       * CREATE:
       * Jangan kirim field opsional yang kosong.
       *
       * UPDATE:
       * Pertahankan null, karena null bisa berarti
       * pengguna sengaja mengosongkan suatu field.
       */
      const fieldsToSend = editing
        ? optionalFields
        : Object.fromEntries(
          Object.entries(optionalFields).filter(
            ([, value]) =>
              value !== null &&
              value !== undefined &&
              value !== "",
          ),
        );

      const base = {
        name: text(form, "name"),
        status,
        ...fieldsToSend,
      };

      const payload = editing
        ? base
        : {
          ...base,

          email: text(form, "email"),

          // Password tidak boleh di-trim.
          password: String(
            form.get("password") ?? "",
          ),
        };

      const parsed = editing
        ? updateEmployeeSchema.safeParse(payload)
        : createEmployeeSchema.safeParse(payload);

      if (!parsed.success) {
        throw new Error(
          parsed.error.issues
            .map((issue) => issue.message)
            .join(", "),
        );
      }

      save.mutate({
        id: editing?.id ?? null,
        payload: parsed.data,
      });
    } catch (error) {
      setFormError(message(error));
    }
  }

  if (!can(user, "employees.read")) {
    return <Forbidden />;
  }

  const result = query.data;

  const validPage =
    !!result &&
    result.page <= result.totalPages;

  const busy =
    query.isFetching ||
    search.trim() !== filters.search;

  const original = referencesOf(editing);

  const first = result?.data.length
    ? (result.page - 1) * result.limit + 1
    : 0;

  const last = result
    ? Math.min(
      (result.page - 1) * result.limit +
      result.data.length,
      result.total,
    )
    : 0;

  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">
            ADMINISTRASI
          </p>

          <h1>Master User</h1>

          <p className="muted">
            Data karyawan dari backend HSSE.
          </p>
        </div>

        {can(user, "employees.create") && (
          <Button
            disabled={save.isPending}
            onClick={() => openForm(null)}
          >
            <Plus size={18} />
            Tambah karyawan
          </Button>
        )}
      </div>

      <div className="notice">
        <ShieldCheck
          size={18}
          aria-hidden="true"
        />

        <span>
          Akses halaman dan aksi mengikuti
          effective permissions dari backend /me.
        </span>
      </div>

      <section
        className="card employees-card"
        aria-labelledby="employees-title"
      >
        <div className="section-heading">
          <div>
            <h2 id="employees-title">
              Daftar karyawan
            </h2>

            <p className="muted">
              Kelola identitas dan status akun
              di organisasi Anda.
            </p>
          </div>

          <Users
            size={22}
            className="muted"
            aria-hidden="true"
          />
        </div>

        <div className="filter-bar">
          <div className="field">
            <label htmlFor="employee-search">
              Cari karyawan
            </label>

            <div className="search-control">
              <Search
                size={18}
                aria-hidden="true"
              />

              <input
                id="employee-search"
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Nama, email, atau nomor karyawan"
              />
            </div>
          </div>

          <div className="field">
            <label htmlFor="employee-status">
              Status
            </label>

            <select
              id="employee-status"
              value={filters.status}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  status: event.target.value as
                    | EmployeeStatus
                    | "",
                  page: 1,
                }))
              }
            >
              <option value="">
                Semua status
              </option>

              {[
                "pending",
                "active",
                "disabled",
              ].map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label htmlFor="employee-limit">
              Per halaman
            </label>

            <select
              id="employee-limit"
              value={filters.limit}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  limit: Number(
                    event.target.value,
                  ),
                  page: 1,
                }))
              }
            >
              {[2, 10, 20, 50, 100].map(
                (limit) => (
                  <option
                    key={limit}
                    value={limit}
                  >
                    {limit} karyawan
                  </option>
                ),
              )}
            </select>
          </div>
        </div>

        {(
          query.isPending ||
          (query.isSuccess && !validPage)
        ) && (
            <p
              className="table-state"
              role="status"
            >
              Memuat / menyesuaikan halaman…
            </p>
          )}

        {query.isError && (
          <div
            className="notice error"
            role="alert"
          >
            <p>{query.error.message}</p>

            <Button
              variant="outline"
              onClick={() =>
                void query.refetch()
              }
            >
              Coba lagi
            </Button>
          </div>
        )}

        {query.isSuccess &&
          result &&
          validPage && (
            <>
              <div
                className="table-scroll"
                role="region"
                aria-label="Tabel karyawan, geser untuk melihat kolom lainnya"
                tabIndex={0}
              >
                <table className="employee-table">
                  <caption className="sr-only">
                    Daftar karyawan dari backend HSSE
                  </caption>

                  <thead>
                    <tr>
                      {[
                        "Nama",
                        "Email",
                        "Nomor karyawan",
                        "Status",
                        "Role ID",
                        "Aksi",
                      ].map((label) => (
                        <th
                          key={label}
                          scope="col"
                        >
                          {label}
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody>
                    {result.data.map(
                      (employee) => (
                        <tr key={employee.id}>
                          <td>
                            <div className="employee-person">
                              <span
                                className="avatar"
                                aria-hidden="true"
                              >
                                {initials(
                                  employee.name,
                                )}
                              </span>

                              <strong>
                                {employee.name}
                              </strong>
                            </div>
                          </td>

                          <td>
                            {employee.email}
                          </td>

                          <td>
                            {employee.employeeNumber ??
                              "—"}
                          </td>

                          <td>
                            <StatusBadge
                              status={
                                employee.status
                              }
                            />
                          </td>

                          <td>
                            <code className="employee-role">
                              {employee.roleId ??
                                "—"}
                            </code>
                          </td>

                          <td>
                            <div className="row-actions">
                              {can(
                                user,
                                "employees.update",
                              ) && (
                                  <Button
                                    variant="outline"
                                    disabled={
                                      save.isPending
                                    }
                                    onClick={() =>
                                      openForm(
                                        employee,
                                      )
                                    }
                                  >
                                    Edit
                                  </Button>
                                )}

                              {can(
                                user,
                                "employees.delete",
                              ) &&
                                employee.id !==
                                user?.id &&
                                employee.status !==
                                "disabled" && (
                                  <Button
                                    variant="outline"
                                    disabled={
                                      disable.isPending
                                    }
                                    onClick={() =>
                                      setDisableTarget(
                                        employee,
                                      )
                                    }
                                  >
                                    Nonaktifkan
                                  </Button>
                                )}
                            </div>
                          </td>
                        </tr>
                      ),
                    )}
                  </tbody>
                </table>
              </div>

              {!result.data.length && (
                <div
                  className="table-state"
                  role="status"
                >
                  <span className="placeholder-icon">
                    <Users size={28} />
                  </span>

                  <strong>
                    Belum ada karyawan yang sesuai
                  </strong>

                  <p>
                    Coba ubah pencarian atau
                    filter status.
                  </p>
                </div>
              )}

              <div className="pagination">
                <span aria-live="polite">
                  {first}–{last} dari{" "}
                  {result.total} karyawan ·
                  Halaman {result.page} dari{" "}
                  {result.totalPages}
                </span>

                <div className="pagination-controls">
                  <Button
                    variant="outline"
                    disabled={
                      !result.hasPreviousPage ||
                      busy
                    }
                    onClick={() =>
                      setFilters((current) => ({
                        ...current,
                        page: result.page - 1,
                      }))
                    }
                  >
                    <ChevronLeft size={16} />
                    Sebelumnya
                  </Button>

                  <Button
                    variant="outline"
                    disabled={
                      !result.hasNextPage ||
                      busy
                    }
                    onClick={() =>
                      setFilters((current) => ({
                        ...current,
                        page: result.page + 1,
                      }))
                    }
                  >
                    Berikutnya
                    <ChevronRight size={16} />
                  </Button>
                </div>
              </div>
            </>
          )}
      </section>

      <ConfirmDialog
        open={
          !!disableTarget &&
          can(user, "employees.delete")
        }
        onOpenChange={(open) => {
          if (!open && !disable.isPending) {
            setDisableTarget(null);
          }
        }}
        title="Nonaktifkan karyawan?"
        description={`${disableTarget?.name ?? "Karyawan"} tidak akan dapat mengakses aplikasi. Sesi backend miliknya akan dicabut.`}
        pending={disable.isPending}
        onConfirm={() => {
          if (
            disableTarget &&
            can(user, "employees.delete") &&
            disableTarget.id !== user?.id &&
            disableTarget.status !== "disabled"
          ) {
            disable.mutate(disableTarget.id);
          }
        }}
      />

      {formOpen && canSaveForm && (
        <section className="card form-card">
          <h2>
            {editing
              ? "Edit karyawan"
              : "Tambah karyawan"}
          </h2>

          <p className="muted">
            Role, Department, dan Location
            memakai data backend. Referensi
            yang tidak diubah saat edit tidak
            dikirim ulang.
          </p>

          <form
            key={editing?.id ?? "new"}
            className="dialog-form"
            onSubmit={submit}
          >
            <fieldset
              disabled={save.isPending}
              style={{
                border: 0,
                padding: 0,
                margin: 0,
              }}
            >
              <div className="form-grid">
                <div className="field">
                  <label htmlFor="employee-name">
                    Nama
                  </label>

                  <input
                    id="employee-name"
                    name="name"
                    required
                    defaultValue={
                      editing?.name ?? ""
                    }
                  />
                </div>

                <div className="field">
                  <label htmlFor="employee-email">
                    Email
                  </label>

                  <input
                    id="employee-email"
                    name="email"
                    type="email"
                    required={!editing}
                    disabled={!!editing}
                    defaultValue={
                      editing?.email ?? ""
                    }
                    autoComplete="off"
                  />

                  {editing && (
                    <small>
                      Perubahan email tidak
                      didukung kontrak PATCH
                      saat ini.
                    </small>
                  )}
                </div>

                <div className="field">
                  <label htmlFor="employee-number">
                    Nomor karyawan
                  </label>

                  <input
                    id="employee-number"
                    name="employeeNumber"
                    defaultValue={
                      editing?.employeeNumber ??
                      ""
                    }
                  />
                </div>

                <div className="field">
                  <label htmlFor="employee-phone">
                    Telepon
                  </label>

                  <input
                    id="employee-phone"
                    name="phone"
                    type="tel"
                    defaultValue={
                      editing?.phone ?? ""
                    }
                  />
                </div>

                <div className="field">
                  <label htmlFor="employee-form-status">
                    Status
                  </label>

                  <select
                    id="employee-form-status"
                    name="status"
                    defaultValue={
                      editing?.status ??
                      "pending"
                    }
                  >
                    {[
                      "pending",
                      "active",
                      "disabled",
                    ].map((item) => (
                      <option
                        key={item}
                        value={item}
                        disabled={
                          editing?.id ===
                          user?.id &&
                          item === "disabled"
                        }
                      >
                        {item}
                      </option>
                    ))}
                  </select>
                </div>

                {!editing && (
                  <div className="field">
                    <label htmlFor="employee-password">
                      Password awal
                    </label>

                    <input
                      id="employee-password"
                      name="password"
                      type="password"
                      required
                      minLength={12}
                      maxLength={128}
                      autoComplete="new-password"
                    />

                    <small>
                      Minimal 12 karakter.
                      Kebijakan tambahan
                      diperiksa backend.
                    </small>
                  </div>
                )}

                {REFERENCE_FIELDS.map(
                  (field) => {
                    const current =
                      referenceQueries[
                      field.key
                      ];

                    const state =
                      availability[field.key];

                    return (
                      <ReferenceSelect
                        key={field.key}
                        id={`employee-${field.key}`}
                        label={field.label}
                        value={
                          state.allowed
                            ? selected[field.key]
                            : original[field.key]
                        }
                        items={state.items}
                        allowed={state.allowed}
                        pending={
                          current.isPending ||
                          current.isFetching
                        }
                        error={
                          current.isError
                            ? message(
                              current.error,
                            )
                            : null
                        }
                        onChange={(value) =>
                          setSelected(
                            (previous) => ({
                              ...previous,
                              [field.key]: value,
                            }),
                          )
                        }
                        onRetry={() => {
                          if (state.allowed) {
                            void current.refetch();
                          }
                        }}
                      />
                    );
                  },
                )}

                <div className="field">
                  <label htmlFor="employee-jobPositionId">
                    Job Position ID
                  </label>

                  <input
                    id="employee-jobPositionId"
                    name="jobPositionId"
                    placeholder="UUID atau kosong"
                    defaultValue={
                      editing?.jobPositionId ??
                      ""
                    }
                  />

                  <small>
                    Masih UUID manual sampai
                    endpoint master Job Position
                    dikonfirmasi.
                  </small>
                </div>
              </div>
            </fieldset>

            {formError && (
              <p
                className="field-error"
                role="alert"
              >
                {formError}
              </p>
            )}

            <div className="dialog-actions">
              <Button
                type="button"
                variant="outline"
                disabled={save.isPending}
                onClick={closeForm}
              >
                Batal
              </Button>

              <Button disabled={save.isPending}>
                {save.isPending
                  ? "Menyimpan…"
                  : "Simpan"}
              </Button>
            </div>
          </form>
        </section>
      )}
    </>
  );
}