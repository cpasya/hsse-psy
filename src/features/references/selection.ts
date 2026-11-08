export const REFERENCE_FIELDS = [
    {
        key: "roleId",
        resource: "roles",
        label: "Role",
        permission: "roles.read",
    },
    {
        key: "departmentId",
        resource: "departments",
        label: "Department",
        permission: "departments.read",
    },
    {
        key: "jobPositionId",
        resource: "job-positions",
        label: "Job Position",
        permission: "job-positions.read",
    },
    {
        key: "locationId",
        resource: "locations",
        label: "Location",
        permission: "locations.read",
    },
] as const;

export type ReferenceKey =
    (typeof REFERENCE_FIELDS)[number]["key"];

export type ReferenceValues = Record<ReferenceKey, string>;

export interface ReferenceOption {
    id: string;
    name: string;
}

export interface ReferenceAvailability {
    allowed: boolean;
    ready: boolean;
    items: ReferenceOption[];
}

// PATCH: referensi yang tidak diubah dihilangkan dari payload.
// Hilangnya izin baca tidak boleh menghapus assignment lama.
export function referencePatch(
    values: ReferenceValues,
    original: ReferenceValues,
    editing: boolean,
    availability: Record<ReferenceKey, ReferenceAvailability>,
): Partial<Record<ReferenceKey, string | null>> {
    const output: Partial<Record<ReferenceKey, string | null>> = {};

    for (const field of REFERENCE_FIELDS) {
        const state = availability[field.key];

        if (!state.allowed) continue;

        const next = values[field.key];

        if (
            editing
                ? next === original[field.key]
                : next === ""
        ) {
            continue;
        }

        if (!state.ready) {
            throw new Error(
                `Pilihan ${field.label} belum siap. Muat ulang atau batalkan perubahan referensi.`,
            );
        }

        if (
            next &&
            !state.items.some((item) => item.id === next)
        ) {
            throw new Error(
                `Pilihan ${field.label} tidak tersedia. Pilih ulang dari daftar terbaru.`,
            );
        }

        output[field.key] = next || null;
    }

    return output;
}
