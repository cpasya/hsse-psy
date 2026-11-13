import { z } from "zod";

const text = z.string().trim().min(1, "This field is required");

const ids = z.array(z.string().uuid()).refine(
    (items) => new Set(items).size === items.length,
    "Duplicate permissions",
);

export const roleSchema = z.object({
    id: z.string().uuid(),
    name: text,
    description: z.string().nullable(),
    isSystem: z.boolean(),
    createdAt: z.string(),
    updatedAt: z.string(),
});

export const permissionAtomSchema = z.object({
    id: z.string().uuid(),
    resource: text,
    action: text,
    isActive: z.boolean(),
});

export const permissionSchema = permissionAtomSchema.extend({
    description: z.string().nullable(),
    isSystem: z.boolean(),
    createdAt: z.string(),
    updatedAt: z.string(),
});

export const roleDetailSchema = roleSchema.extend({
    permissions: z.array(permissionAtomSchema).refine(
        (items) =>
            new Set(items.map((item) => item.id)).size === items.length,
        "Role details contain duplicate permissions",
    ),
});

export const createRoleSchema = z.object({
    name: text,
    description: z.string().trim().optional(),
    permissionIds: ids.refine(
        (items) => items.length > 0,
        "Select at least one permission",
    ),
}).strict();

export const updateRoleSchema = createRoleSchema
    .omit({ permissionIds: true })
    .partial()
    .strict()
    .refine(
        (value) => Object.keys(value).length > 0,
        "No changes were submitted",
    );

export const assignmentSchema = z.object({
    permissionIds: ids,
}).strict();

export const createPermissionSchema = z.object({
    resource: text,
    action: text,
    description: z.string().trim().optional(),
    isActive: z.boolean().optional(),
}).strict();

export const updatePermissionSchema = createPermissionSchema
    .partial()
    .strict()
    .refine(
        (value) => Object.keys(value).length > 0,
        "No changes were submitted",
    );

export type RoleRecord = z.infer<typeof roleSchema>;
export type RoleDetail = z.infer<typeof roleDetailSchema>;
export type PermissionRecord = z.infer<typeof permissionSchema>;

export function assignmentFingerprint(role: RoleDetail): string {
    return JSON.stringify({
        updatedAt: role.updatedAt,
        permissions: role.permissions
            .map((p) => `${p.id}:${p.isActive}`)
            .sort(),
    });
}

export function validateSelection(
    selected: string[],
    original: string[],
    catalogue: PermissionRecord[],
) {
    assignmentSchema.parse({ permissionIds: selected });

    const existing = new Set(original);

    const active = new Set(
        catalogue
            .filter((p) => p.isActive)
            .map((p) => p.id),
    );

    const invalid = selected.some(
        (id) => !existing.has(id) && !active.has(id),
    );

    if (invalid) {
        throw new Error(
            "New permissions must be active and come from the complete catalogue",
        );
    }
}
