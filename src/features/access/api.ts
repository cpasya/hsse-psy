import { apiClient } from "@/lib/http";
import { parsePage } from "@/lib/pagination";

import { collectReferencePages } from "@/features/references/api";
import { assignRolePermissions } from "@/features/employees/api";

import {
    roleSchema,
    roleDetailSchema,
    permissionSchema,
    createRoleSchema,
    updateRoleSchema,
    createPermissionSchema,
    updatePermissionSchema,
    assignmentSchema,
    type PermissionRecord,
} from "./schemas";

export type Resource = "roles" | "permissions";

export type ListParams = {
    page: number;
    limit: number;
    search: string;
};

function query(params: ListParams) {
    return new URLSearchParams({
        page: String(params.page),
        limit: String(params.limit),
        search: params.search,
    });
}

export async function listRoles(params: ListParams) {
    const raw = await apiClient.get<unknown>(
        `/roles?${query(params)}`,
    );

    return parsePage(raw, roleSchema, params.page);
}

export async function listPermissions(params: ListParams) {
    const raw = await apiClient.get<unknown>(
        `/permissions?${query(params)}`,
    );

    return parsePage(raw, permissionSchema, params.page);
}

export async function getRole(id: string) {
    const raw = await apiClient.get<unknown>(
        `/roles/${encodeURIComponent(id)}`,
    );

    return roleDetailSchema.parse(raw);
}

export async function getPermissionCatalogue():
    Promise<PermissionRecord[]> {
    const records = new Map<string, PermissionRecord>();

    // Reuse pemeriksaan kelengkapan, total stabil,
    // duplikat, dan batas keselamatan 100 halaman.
    const options = await collectReferencePages(async (page) => {
        const result = await listPermissions({
            page,
            limit: 100,
            search: "",
        });

        result.data.forEach((item) => {
            records.set(item.id, item);
        });

        return {
            ...result,
            data: result.data.map((p) => ({
                id: p.id,
                name: `${p.resource}.${p.action}`,
            })),
        };
    });

    return options.map((option) => records.get(option.id)!);
}

// Body sukses mutation belum dikonfirmasi.
// Tidak ditebak sebagai record tertentu.
// Setelah sukses, UI refetch endpoint GET.
export async function saveRecord(
    resource: Resource,
    id: string | null,
    input: unknown,
) {
    const schema = resource === "roles"
        ? id
            ? updateRoleSchema
            : createRoleSchema
        : id
            ? updatePermissionSchema
            : createPermissionSchema;

    const payload = schema.parse(input);

    if (id) {
        await apiClient.patch<unknown>(
            `/${resource}/${encodeURIComponent(id)}`,
            payload,
        );
    } else {
        await apiClient.post<unknown>(
            `/${resource}`,
            payload,
        );
    }
}

export async function deleteRecord(
    resource: Resource,
    id: string,
) {
    await apiClient.delete<unknown>(
        `/${resource}/${encodeURIComponent(id)}`,
    );
}

export async function replacePermissions(
    id: string,
    permissionIds: string[],
) {
    assignmentSchema.parse({ permissionIds });

    await assignRolePermissions(id, permissionIds);
}