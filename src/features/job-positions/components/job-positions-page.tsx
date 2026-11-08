"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useSession } from "next-auth/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BriefcaseBusiness, Search } from "lucide-react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Forbidden } from "@/components/shared/module-placeholder";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { can } from "@/lib/rbac";

import {
  createJobPosition,
  deleteJobPosition,
  listJobPositions,
  updateJobPosition,
} from "../api";
import { createJobPositionSchema, type JobPositionRecord } from "../schemas";

const errorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "Request gagal";

export function JobPositionsPage() {
  const { data: session, status } = useSession();
  const client = useQueryClient();
  const user =
    status === "authenticated" && !session?.error ? session.user : null;
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({ page: 1, limit: 20, search: "" });
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<JobPositionRecord | null>(null);
  const [name, setName] = useState("");
  const [formError, setFormError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<JobPositionRecord | null>(
    null,
  );
  const readable = can(user, "job-positions.read");
  const scope = JSON.stringify([user?.id, user?.updatedAt, user?.permissions]);
  const query = useQuery({
    queryKey: ["job-positions", scope, filters],
    queryFn: () => listJobPositions(filters),
    enabled: readable,
    retry: false,
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      const next = search.trim();
      setFilters((current) =>
        current.search === next
          ? current
          : { ...current, search: next, page: 1 },
      );
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    const result = query.data;
    if (result && result.page > result.totalPages) {
      setFilters((current) => ({ ...current, page: result.totalPages }));
    }
  }, [query.data]);

  async function refresh() {
    await Promise.all([
      client.invalidateQueries({ queryKey: ["job-positions"] }),
      client.invalidateQueries({ queryKey: ["references"] }),
    ]);
  }

  const save = useMutation({
    mutationFn: async ({ id, value }: { id: string | null; value: string }) => {
      const payload = createJobPositionSchema.parse({ name: value });
      if (id) await updateJobPosition(id, payload);
      else await createJobPosition(payload);
    },
    onSuccess: async () => {
      setFormOpen(false);
      toast.success("Job position tersimpan");
      await refresh();
    },
    onError: (error) => setFormError(errorMessage(error)),
  });
  const remove = useMutation({
    mutationFn: deleteJobPosition,
    onSuccess: async () => {
      setDeleteTarget(null);
      toast.success("Job position dihapus");
      await refresh();
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  function openForm(record: JobPositionRecord | null) {
    setEditing(record);
    setName(record?.name ?? "");
    setFormError("");
    save.reset();
    setFormOpen(true);
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");
    const permission = editing
      ? "job-positions.update"
      : "job-positions.create";
    if (!can(user, permission)) {
      setFormError("Permission aksi tidak tersedia");
      return;
    }
    const parsed = createJobPositionSchema.safeParse({ name });
    if (!parsed.success) {
      setFormError(
        parsed.error.issues.map((issue) => issue.message).join(", "),
      );
      return;
    }
    save.mutate({ id: editing?.id ?? null, value: parsed.data.name });
  }

  if (status === "loading") return <p role="status">Memverifikasi akses…</p>;
  if (!readable) return <Forbidden />;

  const result = query.data;
  const waiting = query.isFetching || search.trim() !== filters.search;

  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">ADMINISTRASI</p>
          <h1>Job Positions</h1>
          <p className="muted">Master jabatan untuk referensi employee.</p>
        </div>
        {can(user, "job-positions.create") && (
          <Button onClick={() => openForm(null)}>
            <BriefcaseBusiness size={18} /> Tambah job position
          </Button>
        )}
      </div>

      <section className="card access-list">
        <div className="filter-bar">
          <div className="field">
            <label htmlFor="job-position-search">Cari job position</label>
            <div className="search-control">
              <Search size={18} aria-hidden="true" />
              <input
                id="job-position-search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Nama job position"
              />
            </div>
          </div>
          <div className="field">
            <label htmlFor="job-position-limit">Per halaman</label>
            <select
              id="job-position-limit"
              value={filters.limit}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  page: 1,
                  limit: Number(event.target.value),
                }))
              }
            >
              {[10, 20, 50, 100].map((limit) => (
                <option key={limit} value={limit}>
                  {limit} job position
                </option>
              ))}
            </select>
          </div>
        </div>

        {query.isPending ? (
          <p className="table-state" role="status">
            Memuat job position…
          </p>
        ) : query.isError ? (
          <div className="notice error" role="alert">
            <span>{errorMessage(query.error)}</span>
            <Button variant="outline" onClick={() => void query.refetch()}>
              Coba lagi
            </Button>
          </div>
        ) : result ? (
          <>
            <div
              className="table-scroll"
              tabIndex={0}
              role="region"
              aria-label="Tabel job position"
            >
              <table className="access-table">
                <thead>
                  <tr>
                    <th>Nama job position</th>
                    <th>ID</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {result.data.map((record) => (
                    <tr key={record.id}>
                      <td>
                        <strong>{record.name}</strong>
                      </td>
                      <td>
                        <small className="access-id">{record.id}</small>
                      </td>
                      <td>
                        <div className="access-actions">
                          {can(user, "job-positions.update") && (
                            <Button
                              variant="outline"
                              onClick={() => openForm(record)}
                            >
                              Edit
                            </Button>
                          )}
                          {can(user, "job-positions.delete") && (
                            <Button
                              variant="destructive"
                              onClick={() => setDeleteTarget(record)}
                            >
                              Hapus
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {!result.data.length && (
              <p className="table-state">Tidak ada job position yang sesuai.</p>
            )}
            <div className="pagination">
              <span>
                {result.total === 0 ? 0 : (result.page - 1) * result.limit + 1}–
                {Math.min(result.page * result.limit, result.total)} dari{" "}
                {result.total}
              </span>
              <div className="pagination-controls">
                <Button
                  variant="outline"
                  disabled={waiting || !result.hasPreviousPage}
                  onClick={() =>
                    setFilters((current) => ({
                      ...current,
                      page: current.page - 1,
                    }))
                  }
                >
                  Sebelumnya
                </Button>
                <Button
                  variant="outline"
                  disabled={waiting || !result.hasNextPage}
                  onClick={() =>
                    setFilters((current) => ({
                      ...current,
                      page: current.page + 1,
                    }))
                  }
                >
                  Berikutnya
                </Button>
              </div>
            </div>
          </>
        ) : null}
      </section>

      <Dialog
        open={formOpen}
        onOpenChange={(open) => {
          if (!open && !save.isPending) setFormOpen(false);
        }}
      >
        <DialogContent>
          <DialogTitle asChild>
            <h2>{editing ? "Edit job position" : "Tambah job position"}</h2>
          </DialogTitle>
          <DialogDescription>
            Nama jabatan yang dapat dipilih pada employee.
          </DialogDescription>
          <form className="dialog-form" onSubmit={submit}>
            <div className="field">
              <label htmlFor="job-position-name">Nama job position</label>
              <input
                id="job-position-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                disabled={save.isPending}
                autoFocus
                required
              />
            </div>
            {formError && (
              <p className="field-error" role="alert">
                {formError}
              </p>
            )}
            <div className="dialog-actions">
              <Button
                type="button"
                variant="outline"
                disabled={save.isPending}
                onClick={() => setFormOpen(false)}
              >
                Batal
              </Button>
              <Button disabled={save.isPending}>
                {save.isPending ? "Menyimpan…" : "Simpan"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget && can(user, "job-positions.delete")}
        onOpenChange={(open) => {
          if (!open && !remove.isPending) setDeleteTarget(null);
        }}
        title="Hapus job position?"
        description={`${deleteTarget?.name ?? "Job position"} akan dihapus. Backend akan menolak jika record masih digunakan.`}
        pending={remove.isPending}
        onConfirm={() => {
          if (deleteTarget && can(user, "job-positions.delete"))
            remove.mutate(deleteTarget.id);
        }}
      />
    </>
  );
}
