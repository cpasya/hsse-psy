"use client";

import { useState } from "react";
import type { PermissionRecord } from "../schemas";

export function PermissionPicker({
    items,
    selected,
    onChange,
    disabled = false,
}: {
    items: PermissionRecord[];
    selected: string[];
    onChange: (ids: string[]) => void;
    disabled?: boolean;
}) {
    const [search, setSearch] = useState("");

    const visible = items.filter((p) =>
        `${p.resource}.${p.action}`
            .toLowerCase()
            .includes(search.toLowerCase()),
    );

    const unknown = selected.filter(
        (id) => !items.some((p) => p.id === id),
    );

    function toggle(id: string, checked: boolean) {
        onChange(
            checked
                ? [...new Set([...selected, id])]
                : selected.filter((value) => value !== id),
        );
    }

    return (
        <fieldset
            className="access-picker"
            disabled={disabled}
        >
            <legend>
                Permissions — {selected.length} selected
            </legend>

            <div className="field">
                <label htmlFor="permission-search">
                    Search the complete catalogue
                </label>

                <input
                    id="permission-search"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            <p className="muted">
                Searching does not remove hidden selections.
                Inactive permissions cannot be newly selected.
            </p>

            <div className="access-options">
                {visible.map((p) => (
                    <label
                        className="access-option"
                        key={p.id}
                    >
                        <input
                            type="checkbox"
                            checked={selected.includes(p.id)}
                            disabled={
                                !p.isActive && !selected.includes(p.id)
                            }
                            onChange={(e) =>
                                toggle(p.id, e.target.checked)
                            }
                        />

                        <span>
                            <strong>
                                {p.resource}.{p.action}
                            </strong>

                            <small>
                                {p.isActive
                                    ? "Active"
                                    : "Inactive — can be removed"}
                                {p.isSystem ? " · System" : ""}
                            </small>
                        </span>
                    </label>
                ))}

                {!visible.length && (
                    <p className="muted">
                        No matching permissions found.
                    </p>
                )}

                {unknown.map((id) => (
                    <label
                        className="access-option"
                        key={id}
                    >
                        <input
                            type="checkbox"
                            checked
                            onChange={() => toggle(id, false)}
                        />

                        <span>
                            <strong>{id}</strong>

                            <small>
                                Existing assignment is not in the catalogue.
                                It remains selected unless removed.
                            </small>
                        </span>
                    </label>
                ))}
            </div>
        </fieldset>
    );
}
