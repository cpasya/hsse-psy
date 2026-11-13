"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useSession } from "next-auth/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, Search } from "lucide-react";
import { toast } from "sonner";

import { Forbidden } from "@/components/shared/module-placeholder";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { can } from "@/lib/rbac";

import {
  createDepartment,
  deleteDepartment,
  listDepartments,
  updateDepartment,
} from "../api";
import {
  createDepartmentSchema,
  type DepartmentRecord,
} from "../schemas";

const errorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "Request failed";

export function DepartmentsPage() {
  const { data: session, status } = useSession();
  const client = useQueryClient();
  const user = status === "authenticated" && !session?.error
    ? session.user
    : null;

  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({
    page: 1,
    limit: 20,
    search: "",
  });
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<DepartmentRecord | null>(null);
  const [name, setName] = useState("");
  const [formError, setFormError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<DepartmentRecord | null>(null);

  const readable = can(user, "departments.read");
  const scope = JSON.stringify([
    user?.id,
    user?.updatedAt,
    user?.permissions,
  ]);

  const query = useQuery({
    queryKey: ["departments", scope, filters],
    queryFn: () => listDepartments(filters),
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
      setFilters((current) => ({
        ...current,
        page: result.totalPages,
      }));
    }
  }, [query.data]);

  async function refresh() {
    await Promise.all([
      client.invalidateQueries({ queryKey: ["departments"] }),
      client.invalidateQueries({ queryKey: ["references"] }),
    ]);
  }

  const save = useMutation({
    mutationFn: async ({
      id,
      value,
    }: {
      id: string | null;
      value: string;
    }) => {
      const payload = createDepartmentSchema.parse({ name: value });

      if (id) {
        await updateDepartment(id, payload);
      } else {
        await createDepartment(payload);
      }
    },
    onSuccess: async () => {
      setFormOpen(false);
      toast.success("Department saved");
      await refresh();
    },
    onError: (error) => setFormError(errorMessage(error)),
  });

  const remove = useMutation({
    mutationFn: deleteDepartment,
    onSuccess: async () => {
      setDeleteTarget(null);
      toast.success("Department deleted");
      await refresh();
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  function openForm(record: DepartmentRecord | null) {
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
      ? "departments.update"
      : "departments.create";

    if (!can(user, permission)) {
      setFormError("Action permission is unavailable");
      return;
    }

    const parsed = createDepartmentSchema.safeParse({ name });

    if (!parsed.success) {
      setFormError(parsed.error.issues.map((issue) => issue.message).join(", "));
      return;
    }

    save.mutate({
      id: editing?.id ?? null,
      value: parsed.data.name,
    });
  }

  if (status === "loading") {
    return <p role="status">Verifying access…</p>;
  }

  if (!readable) return <Forbidden />;

  const result = query.data;
  const waiting = query.isFetching || search.trim() !== filters.search;

  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">ADMINISTRATION</p>
          <h1>Departments</h1>
          <p className="muted">Department master data from the HSSE backend.</p>
        </div>

        {can(user, "departments.create") && (
          <Button onClick={() => openForm(null)}>
            <Building2 size={18} />
            Add department
          </Button>
        )}
      </div>

      <section className="card access-list">
        <div className="filter-bar">
          <div className="field">
            <label htmlFor="department-search">Search departments</label>
            <div className="search-control">
              <Search size={18} aria-hidden="true" />
              <input
                id="department-search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Department name"
              />
            </div>
          </div>

          <div className="field">
            <label htmlFor="department-limit">Per page</label>
            <select
              id="department-limit"
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
                  {limit} departments
                </option>
              ))}
            </select>
          </div>
        </div>

        {query.isPending ? (
          <p className="table-state" role="status">Loading departments…</p>
        ) : query.isError ? (
          <div className="notice error" role="alert">
            <span>{errorMessage(query.error)}</span>
            <Button variant="outline" onClick={() => void query.refetch()}>
              Try again
            </Button>
          </div>
        ) : result ? (
          <>
            <div
              className="table-scroll"
              tabIndex={0}
              role="region"
              aria-label="Departments table"
            >
              <table className="access-table">
                <thead>
                  <tr>
                    <th>Department name</th>
                    <th>ID</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {result.data.map((department) => (
                    <tr key={department.id}>
                      <td><strong>{department.name}</strong></td>
                      <td><small className="access-id">{department.id}</small></td>
                      <td>
                        <div className="access-actions">
                          {can(user, "departments.update") && (
                            <Button
                              variant="outline"
                              onClick={() => openForm(department)}
                            >
                              Edit
                            </Button>
                          )}

                          {can(user, "departments.delete") && (
                            <Button
                              variant="destructive"
                              onClick={() => setDeleteTarget(department)}
                            >
                              Delete
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
              <p className="table-state">No matching departments found.</p>
            )}

            <div className="pagination">
              <span>
                {result.total === 0 ? 0 : (result.page - 1) * result.limit + 1}
                –{Math.min(result.page * result.limit, result.total)} of {result.total}
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
                  Previous
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
                  Next
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
            <h2>{editing ? "Edit department" : "Add department"}</h2>
          </DialogTitle>
          <DialogDescription>
            Department name used as an employee reference.
          </DialogDescription>

          <form className="dialog-form" onSubmit={submit}>
            <div className="field">
              <label htmlFor="department-name">Department name</label>
              <input
                id="department-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                disabled={save.isPending}
                autoFocus
                required
              />
            </div>

            {formError && (
              <p className="field-error" role="alert">{formError}</p>
            )}

            <div className="dialog-actions">
              <Button
                type="button"
                variant="outline"
                disabled={save.isPending}
                onClick={() => setFormOpen(false)}
              >
                Cancel
              </Button>
              <Button disabled={save.isPending}>
                {save.isPending ? "Saving…" : "Save"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget && can(user, "departments.delete")}
        onOpenChange={(open) => {
          if (!open && !remove.isPending) setDeleteTarget(null);
        }}
        title="Delete department?"
        description={
          `${deleteTarget?.name ?? "Department"} will be deleted. ` +
          "The backend will reject the request if the record is still in use."
        }
        pending={remove.isPending}
        onConfirm={() => {
          if (deleteTarget && can(user, "departments.delete")) {
            remove.mutate(deleteTarget.id);
          }
        }}
      />
    </>
  );
}
