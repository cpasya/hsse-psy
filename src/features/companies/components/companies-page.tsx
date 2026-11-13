"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useSession } from "next-auth/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, Search } from "lucide-react";
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
  createCompany,
  deleteCompany,
  listCompanies,
  updateCompany,
} from "../api";
import { createCompanySchema, type CompanyRecord } from "../schemas";

const errorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "Request failed";

const emptyForm = {
  companyName: "",
  companyAddress: "",
  companyDescription: "",
  companyBusiness: "",
};

export function CompaniesPage() {
  const { data: session, status } = useSession();
  const client = useQueryClient();
  const user =
    status === "authenticated" && !session?.error ? session.user : null;
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({ page: 1, limit: 20, search: "" });
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<CompanyRecord | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<CompanyRecord | null>(null);
  const readable = can(user, "companies.read");
  const scope = JSON.stringify([user?.id, user?.updatedAt, user?.permissions]);
  const query = useQuery({
    queryKey: ["companies", scope, filters],
    queryFn: () => listCompanies(filters),
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

  const save = useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: string | null;
      payload: ReturnType<typeof createCompanySchema.parse>;
    }) => {
      if (id) await updateCompany(id, payload);
      else await createCompany(payload);
    },
    onSuccess: async () => {
      setFormOpen(false);
      toast.success("Company saved");
      await client.invalidateQueries({ queryKey: ["companies"] });
    },
    onError: (error) => setFormError(errorMessage(error)),
  });
  const remove = useMutation({
    mutationFn: deleteCompany,
    onSuccess: async () => {
      setDeleteTarget(null);
      toast.success("Company deleted");
      await client.invalidateQueries({ queryKey: ["companies"] });
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  function openForm(record: CompanyRecord | null) {
    setEditing(record);
    setForm(
      record
        ? {
            companyName: record.companyName,
            companyAddress: record.companyAddress,
            companyDescription: record.companyDescription ?? "",
            companyBusiness: record.companyBusiness ?? "",
          }
        : emptyForm,
    );
    setFormError("");
    save.reset();
    setFormOpen(true);
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");
    const permission = editing ? "companies.update" : "companies.create";
    if (!can(user, permission)) {
      setFormError("Action permission is unavailable");
      return;
    }
    const parsed = createCompanySchema.safeParse({
      companyName: form.companyName,
      companyAddress: form.companyAddress,
      companyDescription: form.companyDescription.trim() || null,
      companyBusiness: form.companyBusiness.trim() || null,
    });
    if (!parsed.success) {
      setFormError(
        parsed.error.issues.map((issue) => issue.message).join(", "),
      );
      return;
    }
    save.mutate({ id: editing?.id ?? null, payload: parsed.data });
  }

  if (status === "loading") return <p role="status">Verifying access…</p>;
  if (!readable) return <Forbidden />;

  const result = query.data;
  const waiting = query.isFetching || search.trim() !== filters.search;
  const updateField = (key: keyof typeof form, value: string) =>
    setForm((current) => ({ ...current, [key]: value }));

  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">ADMINISTRATION</p>
          <h1>Companies</h1>
          <p className="muted">Company master data from the HSSE backend.</p>
        </div>
        {can(user, "companies.create") && (
          <Button onClick={() => openForm(null)}>
            <Building2 size={18} /> Add company
          </Button>
        )}
      </div>

      <section className="card access-list">
        <div className="filter-bar">
          <div className="field">
            <label htmlFor="company-search">Search companies</label>
            <div className="search-control">
              <Search size={18} aria-hidden="true" />
              <input
                id="company-search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Company name, business sector, or address"
              />
            </div>
          </div>
          <div className="field">
            <label htmlFor="company-limit">Per page</label>
            <select
              id="company-limit"
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
                  {limit} companies
                </option>
              ))}
            </select>
          </div>
        </div>

        {query.isPending ? (
          <p className="table-state" role="status">
            Loading companies…
          </p>
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
              aria-label="Companies table"
            >
              <table className="access-table">
                <thead>
                  <tr>
                    <th>Company</th>
                    <th>Business sector</th>
                    <th>Address</th>
                    <th>Description</th>
                    <th>ID</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {result.data.map((record) => (
                    <tr key={record.id}>
                      <td>
                        <strong>{record.companyName}</strong>
                      </td>
                      <td>{record.companyBusiness || "—"}</td>
                      <td>{record.companyAddress}</td>
                      <td>{record.companyDescription || "—"}</td>
                      <td>
                        <small className="access-id">{record.id}</small>
                      </td>
                      <td>
                        <div className="access-actions">
                          {can(user, "companies.update") && (
                            <Button
                              variant="outline"
                              onClick={() => openForm(record)}
                            >
                              Edit
                            </Button>
                          )}
                          {can(user, "companies.delete") && (
                            <Button
                              variant="destructive"
                              onClick={() => setDeleteTarget(record)}
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
              <p className="table-state">No matching companies found.</p>
            )}
            <div className="pagination">
              <span>
                {result.total === 0 ? 0 : (result.page - 1) * result.limit + 1}–
                {Math.min(result.page * result.limit, result.total)} of{" "}
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
            <h2>{editing ? "Edit company" : "Add company"}</h2>
          </DialogTitle>
          <DialogDescription>
            Enter the company identity according to organization data.
          </DialogDescription>
          <form className="dialog-form" onSubmit={submit}>
            <div className="form-grid">
              <div className="field">
                <label htmlFor="company-name">Company name</label>
                <input
                  id="company-name"
                  value={form.companyName}
                  onChange={(event) =>
                    updateField("companyName", event.target.value)
                  }
                  disabled={save.isPending}
                  autoFocus
                  required
                />
              </div>
              <div className="field">
                <label htmlFor="company-business">Business sector</label>
                <input
                  id="company-business"
                  value={form.companyBusiness}
                  onChange={(event) =>
                    updateField("companyBusiness", event.target.value)
                  }
                  disabled={save.isPending}
                />
              </div>
            </div>
            <div className="field">
              <label htmlFor="company-address">Company address</label>
              <textarea
                id="company-address"
                value={form.companyAddress}
                onChange={(event) =>
                  updateField("companyAddress", event.target.value)
                }
                disabled={save.isPending}
                required
              />
            </div>
            <div className="field">
              <label htmlFor="company-description">Description</label>
              <textarea
                id="company-description"
                value={form.companyDescription}
                onChange={(event) =>
                  updateField("companyDescription", event.target.value)
                }
                disabled={save.isPending}
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
        open={!!deleteTarget && can(user, "companies.delete")}
        onOpenChange={(open) => {
          if (!open && !remove.isPending) setDeleteTarget(null);
        }}
        title="Delete company?"
        description={`${deleteTarget?.companyName ?? "Company"} will be deleted. The backend will reject the request if the record is still in use.`}
        pending={remove.isPending}
        onConfirm={() => {
          if (deleteTarget && can(user, "companies.delete"))
            remove.mutate(deleteTarget.id);
        }}
      />
    </>
  );
}
