"use client";

import { Button } from "@/components/ui/button";

import type {
    ReferenceOption,
} from "@/features/references/selection";

interface Props {
    id: string;
    label: string;
    value: string;
    items: ReferenceOption[];
    allowed: boolean;
    pending: boolean;
    error: string | null;
    onChange: (value: string) => void;
    onRetry: () => void;
    required?: boolean;
}

export function ReferenceSelect({
    id,
    label,
    value,
    items,
    allowed,
    pending,
    error,
    onChange,
    onRetry,
    required = false,
}: Props) {
    const unresolved =
        value !== "" &&
        !items.some((item) => item.id === value);

    const hint = !allowed
        ? "Tidak memiliki izin membaca referensi ini. Nilai existing tidak diubah."
        : pending
            ? "Memuat seluruh halaman referensi…"
            : error
                ? error
                : !items.length
                    ? "Belum ada referensi yang dapat dipilih."
                    : "";

    return (
        <div className="field">
            <label htmlFor={id}>{label}</label>

            <select
                id={id}
                value={value}
                disabled={!allowed || pending || !!error}
                aria-describedby={`${id}-hint`}
                aria-busy={allowed && pending}
                required={required}
                onChange={(event) => onChange(event.target.value)}
            >
                <option value="">Belum ditetapkan</option>

                {unresolved && (
                    <option value={value}>
                        Referensi belum termuat · {value}
                    </option>
                )}

                {items.map((item) => (
                    <option key={item.id} value={item.id}>
                        {item.name}
                    </option>
                ))}
            </select>

            <small
                id={`${id}-hint`}
                role={error && allowed ? "alert" : undefined}
            >
                {hint}
            </small>

            {unresolved && (
                <small>
                    UUID pilihan: {value}. Tidak otomatis dikosongkan.
                </small>
            )}

            {allowed && error && (
                <Button
                    type="button"
                    variant="outline"
                    onClick={onRetry}
                >
                    Muat ulang {label}
                </Button>
            )}
        </div>
    );
}
