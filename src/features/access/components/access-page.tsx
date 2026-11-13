"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import {
    useQuery,
    useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogTitle,
} from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Forbidden } from "@/components/shared/module-placeholder";

import { can } from "@/lib/rbac";
import type { UserDTO } from "@/features/users/types";

import {
    listRoles,
    listPermissions,
    deleteRecord,
    getRole,
    type Resource,
} from "../api";

import type {
    RoleRecord,
    PermissionRecord,
} from "../schemas";

import {
    RoleEditor,
    PermissionEditor,
    errorMessage,
    type RoleMode,
} from "./access-editors";

type Row = RoleRecord | PermissionRecord;

type Editor = {
    id: string | null;
    mode: RoleMode;
    record: PermissionRecord | null;
};

export function AccessPage({
    resource,
}: {
    resource: Resource;
}) {
    const { data: session, status } = useSession();

    if (status === "loading") {
        return <p role="status">Verifying access…</p>;
    }

    if (
        status !== "authenticated" ||
        session?.error ||
        !can(session?.user, `${resource}.read`)
    ) {
        return <Forbidden />;
    }

    // Reset draft dan pisahkan cache saat profil/permission berubah.
    const scope = JSON.stringify(session.user);

    return (
        <AccessContent
            key={resource + scope}
            resource={resource}
            user={session.user}
            scope={scope}
        />
    );
}

function AccessContent({
    resource,
    user,
    scope,
}: {
    resource: Resource;
    user: UserDTO;
    scope: string;
}) {
    const client = useQueryClient();
    const { update } = useSession();

    const [search, setSearch] = useState("");

    const [filters, setFilters] = useState({
        page: 1,
        limit: 20,
        search: "",
    });

    const [editor, setEditor] = useState<Editor | null>(null);
    const [editorOpen, setEditorOpen] = useState(false);
    const [target, setTarget] = useState<Row | null>(null);
    const [busy, setBusy] = useState(false);

    const title =
        resource === "roles" ? "Roles" : "Permissions";

    const allowed = (action: string) =>
        can(user, `${resource}.${action}`);

    const protectedRow = (row: Row) =>
        row.isSystem ||
        (resource === "roles" && row.id === user.roleId);

    const editorUsesModal = !!editor && (
        resource === "permissions" ||
        editor.mode === "new" ||
        editor.mode === "edit"
    );

    function openEditor(next: Editor) {
        setEditor(next);
        setEditorOpen(
            resource === "permissions" ||
            next.mode === "new" ||
            next.mode === "edit",
        );
    }

    function closeEditor() {
        if (editorUsesModal) {
            setEditorOpen(false);
        } else {
            setEditor(null);
        }
    }

    const query = useQuery({
        queryKey: [
            "access-list",
            resource,
            scope,
            filters,
        ],
        retry: false,
        queryFn: async () =>
            resource === "roles"
                ? await listRoles(filters)
                : await listPermissions(filters),
    });

    useEffect(() => {
        const timer = setTimeout(() => {
            setFilters((prev) =>
                prev.search === search.trim()
                    ? prev
                    : {
                        ...prev,
                        page: 1,
                        search: search.trim(),
                    },
            );
        }, 300);

        return () => clearTimeout(timer);
    }, [search]);

    useEffect(() => {
        const page = query.data;

        if (page && page.page > page.totalPages) {
            setFilters((prev) =>
                prev.page === page.page
                    ? { ...prev, page: page.totalPages }
                    : prev,
            );
        }
    }, [query.data]);

    async function refresh() {
        closeEditor();
        setTarget(null);

        await Promise.all([
            client.invalidateQueries({
                queryKey: ["access-list"],
            }),
            client.invalidateQueries({
                queryKey: ["access-role-detail"],
            }),
            client.invalidateQueries({
                queryKey: ["access-catalogue"],
            }),
            client.invalidateQueries({
                queryKey: ["references"],
            }),
        ]);

        try {
            const next = await update();

            if (!next || next.error) {
                toast.error(
                    "Data was saved, but access could not be verified again.",
                );
            }
        } catch {
            toast.error(
                "Data was saved. Refresh access before continuing.",
            );
        }
    }

    async function saved() {
        toast.success("Changes saved");
        await refresh();
    }

    async function remove() {
        if (
            !target ||
            !allowed("delete") ||
            protectedRow(target)
        ) {
            return;
        }

        setBusy(true);

        try {
            if (resource === "roles") {
                const current = await getRole(target.id);

                if (
                    current.isSystem ||
                    current.id === user.roleId
                ) {
                    throw new Error("This role is protected");
                }
            }

            await deleteRecord(resource, target.id);
            await saved();
        } catch (e) {
            toast.error(errorMessage(e));
        } finally {
            setBusy(false);
        }
    }

    const data = query.data;

    const waiting =
        query.isFetching ||
        search.trim() !== filters.search;

    const editorContent = editor
        ? resource === "roles"
            ? (
                <RoleEditor
                    key={`${editor.id}:${editor.mode}`}
                    id={editor.id}
                    mode={editor.mode}
                    user={user}
                    onClose={closeEditor}
                    onSaved={saved}
                />
            )
            : (
                <PermissionEditor
                    key={editor.id ?? "new"}
                    record={editor.record}
                    user={user}
                    onClose={closeEditor}
                    onSaved={saved}
                />
            )
        : null;

    const editorTitle = resource === "roles"
        ? editor?.mode === "new"
            ? "Add role"
            : "Edit role"
        : editor?.record
            ? "Edit permission"
            : "Add permission";

    return (
        <>
            <div className="page-heading">
                <div>
                    <p className="eyebrow">
                        Access administration
                    </p>

                    <h1>{title}</h1>

                    <p className="muted">
                        Data and authorization are provided by the HSSE backend.
                    </p>
                </div>

                {allowed("create") && (
                    <Button
                        disabled={
                            !!editor &&
                            (!editorUsesModal || editorOpen)
                        }
                        onClick={() =>
                            openEditor({
                                id: null,
                                mode: "new",
                                record: null,
                            })
                        }
                    >
                        Add{" "}
                        {resource === "roles"
                            ? "role"
                            : "permission"}
                    </Button>
                )}
            </div>

            <div className="notice">
                UI safeguard: system records are read-only, and the current
                account role cannot be changed or deleted on this page.
                {/* Ini bukan pengganti validasi backend. */}
            </div>

            <section className="card access-list">
                <div className="filter-bar">
                    <div className="field">
                        <label htmlFor="access-search">
                            Search {title}
                        </label>

                        <input
                            id="access-search"
                            value={search}
                            onChange={(e) =>
                                setSearch(e.target.value)
                            }
                        />
                    </div>

                    <div className="field">
                        <label htmlFor="access-limit">
                            Per page
                        </label>

                        <select
                            id="access-limit"
                            value={filters.limit}
                            onChange={(e) =>
                                setFilters((prev) => ({
                                    ...prev,
                                    page: 1,
                                    limit: Number(e.target.value),
                                }))
                            }
                        >
                            {[2, 10, 20, 50, 100].map((n) => (
                                <option key={n} value={n}>
                                    {n} records
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {query.isPending ? (
                    <p className="table-state" role="status">
                        Loading…
                    </p>
                ) : query.isError ? (
                    <div className="notice error" role="alert">
                        <span>{errorMessage(query.error)}</span>

                        <Button
                            variant="outline"
                            onClick={() => void query.refetch()}
                        >
                            Try again
                        </Button>
                    </div>
                ) : data && (
                    <>
                        <div
                            className="table-scroll"
                            tabIndex={0}
                            role="region"
                            aria-label={`${title} table`}
                        >
                            <table className="access-table">
                                <thead>
                                    <tr>
                                        <th>
                                            {resource === "roles"
                                                ? "Role name"
                                                : "Permission code"}
                                        </th>
                                        <th>Description</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {data.data.map((row: Row) => (
                                        <tr key={row.id}>
                                            <td>
                                                <strong>
                                                    {"name" in row
                                                        ? row.name
                                                        : `${row.resource}.${row.action}`}
                                                </strong>

                                                <small className="access-id">
                                                    {row.id}
                                                </small>
                                            </td>

                                            <td>
                                                {row.description ?? "—"}
                                            </td>

                                            <td>
                                                {row.isSystem
                                                    ? "System"
                                                    : "Custom"}

                                                {"isActive" in row
                                                    ? row.isActive
                                                        ? " · Active"
                                                        : " · Inactive"
                                                    : ""}
                                            </td>

                                            <td>
                                                <div className="access-actions">
                                                    {resource === "roles" && (
                                                        <Button
                                                            variant="outline"
                                                            onClick={() =>
                                                                openEditor({
                                                                    id: row.id,
                                                                    mode: "view",
                                                                    record: null,
                                                                })
                                                            }
                                                        >
                                                            Details
                                                        </Button>
                                                    )}

                                                    {!protectedRow(row) &&
                                                        allowed("update") && (
                                                            <Button
                                                                variant="outline"
                                                                onClick={() =>
                                                                    openEditor({
                                                                        id: row.id,
                                                                        mode: "edit",
                                                                        record:
                                                                            resource === "permissions"
                                                                                ? row as PermissionRecord
                                                                                : null,
                                                                    })
                                                                }
                                                            >
                                                                Edit
                                                            </Button>
                                                        )}

                                                    {resource === "roles" &&
                                                        !protectedRow(row) &&
                                                        can(user, "roles.assign") &&
                                                        can(user, "permissions.read") && (
                                                            <Button
                                                                variant="outline"
                                                                onClick={() =>
                                                                    openEditor({
                                                                        id: row.id,
                                                                        mode: "assign",
                                                                        record: null,
                                                                    })
                                                                }
                                                            >
                                                                Manage permissions
                                                            </Button>
                                                        )}

                                                    {!protectedRow(row) &&
                                                        allowed("delete") && (
                                                            <Button
                                                                variant="destructive"
                                                                onClick={() =>
                                                                    setTarget(row)
                                                                }
                                                            >
                                                                Delete
                                                            </Button>
                                                        )}

                                                    {resource === "permissions" &&
                                                        protectedRow(row) && (
                                                            <span className="muted">
                                                                Read-only
                                                            </span>
                                                        )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {!data.data.length && (
                            <p className="table-state">
                                No matching data found.
                            </p>
                        )}

                        <div className="pagination">
                            <span>
                                {data.total === 0
                                    ? 0
                                    : (data.page - 1) * data.limit + 1}
                                –
                                {Math.min(
                                    data.page * data.limit,
                                    data.total,
                                )}
                                {" "}of {data.total}
                                {" "}· Page {data.page}
                                {" "}of {data.totalPages}
                            </span>

                            <div className="pagination-controls">
                                <Button
                                    variant="outline"
                                    disabled={
                                        waiting || !data.hasPreviousPage
                                    }
                                    onClick={() =>
                                        setFilters((prev) => ({
                                            ...prev,
                                            page: prev.page - 1,
                                        }))
                                    }
                                >
                                    Previous
                                </Button>

                                <Button
                                    variant="outline"
                                    disabled={
                                        waiting || !data.hasNextPage
                                    }
                                    onClick={() =>
                                        setFilters((prev) => ({
                                            ...prev,
                                            page: prev.page + 1,
                                        }))
                                    }
                                >
                                    Next
                                </Button>
                            </div>
                        </div>
                    </>
                )}
            </section>

            {editorUsesModal ? (
                <Dialog
                    open={editorOpen}
                    onOpenChange={(open) => {
                        if (!open) setEditorOpen(false);
                    }}
                >
                    <DialogContent className="access-editor-modal">
                        <DialogTitle className="sr-only">
                            {editorTitle}
                        </DialogTitle>

                        {editorContent}
                    </DialogContent>
                </Dialog>
            ) : editorContent}

            <ConfirmDialog
                open={!!target}
                onOpenChange={(value) => {
                    if (!value && !busy) setTarget(null);
                }}
                title={
                    `Delete ${resource === "roles"
                        ? "role"
                        : "permission"}?`
                }
                description={
                    `Record: ${target
                        ? "name" in target
                            ? target.name
                            : `${target.resource}.${target.action}`
                        : ""
                    }. The backend may reject a record that is still ` +
                    "referenced. Deletion may affect user access."
                }
                pending={busy}
                onConfirm={() => void remove()}
            />
        </>
    );
}
