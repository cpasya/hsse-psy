"use client";

import { useState, type FormEvent } from "react";
import { useQuery } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";

import { can } from "@/lib/rbac";
import type { UserDTO } from "@/features/users/types";

import {
    getRole,
    getPermissionCatalogue,
    saveRecord,
    replacePermissions,
} from "../api";

import {
    assignmentFingerprint,
    validateSelection,
    type RoleDetail,
    type PermissionRecord,
} from "../schemas";

import { PermissionPicker } from "./permission-picker";

export const errorMessage = (error: unknown) =>
    error instanceof Error ? error.message : "Request failed";

export type RoleMode = "new" | "view" | "edit" | "assign";

type Actions = {
    user: UserDTO;
    onClose: () => void;
    onSaved: () => Promise<void>;
};

export function RoleEditor(
    props: Actions & {
        id: string | null;
        mode: RoleMode;
    },
) {
    const detail = useQuery({
        queryKey: [
            "access-role-detail",
            props.user.id,
            props.id,
        ],
        queryFn: () => getRole(props.id!),
        enabled: !!props.id,
        retry: false,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
    });

    const needsCatalogue =
        props.mode === "new" || props.mode === "assign";

    const readable = can(props.user, "permissions.read");

    const catalogue = useQuery({
        queryKey: [
            "access-catalogue",
            props.user.id,
            props.user.permissions,
        ],
        queryFn: getPermissionCatalogue,
        enabled: needsCatalogue && readable,
        retry: false,
        staleTime: 5 * 60 * 1000,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
    });

    const failed =
        (!!props.id && detail.isError) ||
        (needsCatalogue && readable && catalogue.isError);

    const loading =
        (!!props.id &&
            (!detail.isSuccess || detail.isFetching)) ||
        (needsCatalogue &&
            readable &&
            (!catalogue.isSuccess || catalogue.isFetching));

    return (
        <section
            className={
                props.mode === "new" || props.mode === "edit"
                    ? "access-editor"
                    : "card form-card access-editor"
            }
        >
            <div className="page-heading">
                <h2>
                    {props.mode === "new"
                        ? "Add role"
                        : props.mode === "assign"
                            ? "Manage role permissions"
                            : "Role details / edit"}
                </h2>

                {(props.mode === "view" || props.mode === "assign") && (
                    <Button
                        variant="outline"
                        onClick={props.onClose}
                    >
                        Close
                    </Button>
                )}
            </div>

            {needsCatalogue && !readable ? (
                <p role="alert">
                    permissions.read is required to load the complete
                    catalogue.
                </p>
            ) : failed ? (
                <div className="notice error" role="alert">
                    <span>
                        {errorMessage(detail.error ?? catalogue.error)}
                    </span>

                    <Button
                        variant="outline"
                        onClick={() => {
                            if (props.id) void detail.refetch();
                            if (needsCatalogue) void catalogue.refetch();
                        }}
                    >
                        Try again
                    </Button>
                </div>
            ) : loading ? (
                <p role="status">
                    Loading details and the complete catalogue…
                </p>
            ) : (
                <RoleForm
                    {...props}
                    initial={detail.data ?? null}
                    catalogue={catalogue.data ?? []}
                />
            )}
        </section>
    );
}

function RoleForm({
    user,
    mode,
    initial,
    catalogue,
    onClose,
    onSaved,
}: Actions & {
    mode: RoleMode;
    initial: RoleDetail | null;
    catalogue: PermissionRecord[];
}) {
    const [name, setName] = useState(initial?.name ?? "");

    const [description, setDescription] = useState(
        initial?.description ?? "",
    );

    const [selected, setSelected] = useState(
        initial?.permissions.map((p) => p.id) ?? [],
    );

    const [error, setError] = useState("");
    const [busy, setBusy] = useState(false);
    const [confirm, setConfirm] = useState(false);

    const original =
        initial?.permissions.map((p) => p.id) ?? [];

    const protectedRole =
        !!initial &&
        (initial.isSystem || initial.id === user.roleId);

    const required = mode === "new"
        ? "roles.create"
        : mode === "assign"
            ? "roles.assign"
            : "roles.update";

    const writable =
        mode !== "view" &&
        !protectedRole &&
        can(user, required);

    const changed =
        JSON.stringify([...selected].sort()) !==
        JSON.stringify([...original].sort());

    async function save(assignmentConfirmed = false) {
        setError("");

        if (!writable) {
            setError(
                "System roles and your own role are read-only, or permission is unavailable.",
            );
            return;
        }

        if (mode === "assign" && !assignmentConfirmed) {
            setConfirm(true);
            return;
        }

        setBusy(true);

        try {
            if (mode === "assign") {
                validateSelection(
                    selected,
                    original,
                    catalogue,
                );

                const current = await getRole(initial!.id);

                if (
                    current.isSystem ||
                    current.id === user.roleId
                ) {
                    throw new Error("This role is protected");
                }

                if (
                    assignmentFingerprint(current) !==
                    assignmentFingerprint(initial!)
                ) {
                    throw new Error(
                        "The role changed after it was opened. Close and reopen it before saving.",
                    );
                }

                await replacePermissions(
                    initial!.id,
                    selected,
                );
            } else if (mode === "new") {
                validateSelection(selected, [], catalogue);

                await saveRecord("roles", null, {
                    name,
                    description,
                    permissionIds: selected,
                });
            } else {
                const payload: Record<string, string> = {};

                if (name.trim() !== initial!.name) {
                    payload.name = name.trim();
                }

                if (
                    description.trim() !==
                    (initial!.description ?? "")
                ) {
                    payload.description = description.trim();
                }

                await saveRecord(
                    "roles",
                    initial!.id,
                    payload,
                );
            }

            await onSaved();
        } catch (e) {
            setError(errorMessage(e));
        } finally {
            setBusy(false);
            setConfirm(false);
        }
    }

    function submit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        void save();
    }

    return (
        <form
            onSubmit={submit}
            className="dialog-form"
        >
            {protectedRole && (
                <div className="notice">
                    UI safeguard: system roles and your own role are
                    read-only. The backend must still enforce authorization.
                </div>
            )}

            {error && (
                <div className="notice error" role="alert">
                    {error}
                </div>
            )}

            <fieldset
                disabled={
                    busy || !writable || mode === "assign"
                }
                className="form-grid"
            >
                <div className="field">
                    <label htmlFor="role-name">
                        Role name
                    </label>

                    <input
                        id="role-name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                    />
                </div>

                <div className="field">
                    <label htmlFor="role-description">
                        Description
                    </label>

                    <input
                        id="role-description"
                        value={description}
                        onChange={(e) =>
                            setDescription(e.target.value)
                        }
                    />
                </div>
            </fieldset>

            {mode === "new" || mode === "assign" ? (
                <>
                    <PermissionPicker
                        items={catalogue}
                        selected={selected}
                        onChange={setSelected}
                        disabled={busy || !writable}
                    />

                    {mode === "assign" && (
                        <p className="muted">
                            PUT replaces the entire assignment.{" "}
                            {original.length} existing →{" "}
                            {selected.length} selected.
                            An empty list removes all assignments.
                        </p>
                    )}
                </>
            ) : (
                <div>
                    <h3>
                        Existing permissions ({original.length})
                    </h3>

                    <ul className="access-existing">
                        {initial?.permissions.map((p) => (
                            <li key={p.id}>
                                {p.resource}.{p.action}
                                {!p.isActive ? " — inactive" : ""}
                            </li>
                        ))}
                    </ul>

                    {!original.length && (
                        <p className="muted">
                            No assignments yet.
                        </p>
                    )}
                </div>
            )}

            <div className="dialog-actions">
                <Button
                    type="button"
                    variant="outline"
                    disabled={busy}
                    onClick={onClose}
                >
                    Cancel / close
                </Button>

                {mode !== "view" && (
                    <Button
                        type="submit"
                        disabled={
                            !writable ||
                            busy ||
                            (mode === "assign" && !changed)
                        }
                    >
                        {busy ? "Saving…" : "Save"}
                    </Button>
                )}
            </div>

            <ConfirmDialog
                open={confirm}
                onOpenChange={(value) => {
                    if (!busy) setConfirm(value);
                }}
                title="Replace all role permissions?"
                description={
                    `Assignment ${name}: ${original.length} existing ` +
                    `will become ${selected.length} selected. ` +
                    "Users with this role may lose access. " +
                    "No permissions are added automatically."
                }
                pending={busy}
                onConfirm={() => void save(true)}
            />
        </form>
    );
}

export function PermissionEditor({
    user,
    record,
    onClose,
    onSaved,
}: Actions & {
    record: PermissionRecord | null;
}) {
    const [resource, setResource] = useState(
        record?.resource ?? "",
    );

    const [action, setAction] = useState(
        record?.action ?? "",
    );

    const [description, setDescription] = useState(
        record?.description ?? "",
    );

    const [isActive, setActive] = useState(
        record?.isActive ?? true,
    );

    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");

    const writable =
        !record?.isSystem &&
        can(
            user,
            record
                ? "permissions.update"
                : "permissions.create",
        );

    async function submit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setError("");

        if (!writable) {
            setError(
                "System permissions are read-only or permission is unavailable",
            );
            return;
        }

        setBusy(true);

        try {
            const values = {
                resource: resource.trim(),
                action: action.trim(),
                description: description.trim(),
                isActive,
            };

            const payload: Record<string, string | boolean> = {};

            for (
                const key of [
                    "resource",
                    "action",
                    "description",
                    "isActive",
                ] as const
            ) {
                if (
                    !record ||
                    values[key] !== (record[key] ?? "")
                ) {
                    payload[key] = values[key];
                }
            }

            await saveRecord(
                "permissions",
                record?.id ?? null,
                payload,
            );

            await onSaved();
        } catch (e) {
            setError(errorMessage(e));
        } finally {
            setBusy(false);
        }
    }

    return (
        <section className="access-editor">
            <h2>
                {record ? "Edit permission" : "Add permission"}
            </h2>

            <p className="muted">
                Creating a permission does not automatically create a new
                feature or grant it to a role.
            </p>

            <form
                className="dialog-form"
                onSubmit={submit}
            >
                {error && (
                    <div className="notice error" role="alert">
                        {error}
                    </div>
                )}

                <fieldset
                    className="form-grid"
                    disabled={busy || !writable}
                >
                    <div className="field">
                        <label htmlFor="permission-resource">
                            Resource
                        </label>

                        <input
                            id="permission-resource"
                            value={resource}
                            onChange={(e) =>
                                setResource(e.target.value)
                            }
                            required
                        />
                    </div>

                    <div className="field">
                        <label htmlFor="permission-action">
                            Action
                        </label>

                        <input
                            id="permission-action"
                            value={action}
                            onChange={(e) =>
                                setAction(e.target.value)
                            }
                            required
                        />
                    </div>

                    <div className="field">
                        <label htmlFor="permission-description">
                            Description
                        </label>

                        <input
                            id="permission-description"
                            value={description}
                            onChange={(e) =>
                                setDescription(e.target.value)
                            }
                        />
                    </div>

                    <label className="access-option">
                        <input
                            type="checkbox"
                            checked={isActive}
                            onChange={(e) =>
                                setActive(e.target.checked)
                            }
                        />
                        Active
                    </label>
                </fieldset>

                <div className="dialog-actions">
                    <Button
                        type="button"
                        variant="outline"
                        disabled={busy}
                        onClick={onClose}
                    >
                        Cancel
                    </Button>

                    <Button disabled={busy || !writable}>
                        {busy ? "Saving…" : "Save"}
                    </Button>
                </div>
            </form>
        </section>
    );
}
