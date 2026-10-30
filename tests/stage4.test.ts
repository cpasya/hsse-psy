import test from "node:test";
import assert from "node:assert/strict";

import {
    createRoleSchema,
    updateRoleSchema,
    assignmentSchema,
    createPermissionSchema,
    updatePermissionSchema,
    roleDetailSchema,
    validateSelection,
    assignmentFingerprint,
    type PermissionRecord,
} from "../src/features/access/schemas";

import { getNavItems } from "../src/config/nav";

const id = "00000000-0000-4000-8000-000000000001";
const other = "00000000-0000-4000-8000-000000000002";

const permission: PermissionRecord = {
    id,
    resource: "employees",
    action: "read",
    description: null,
    isActive: true,
    isSystem: true,
    createdAt: "2026-10-25",
    updatedAt: "2026-10-25",
};

const role = {
    id: other,
    name: "test",
    description: null,
    isSystem: false,
    createdAt: "2026-10-25",
    updatedAt: "2026-10-25",
    permissions: [
        {
            id,
            resource: "employees",
            action: "read",
            isActive: true,
        },
    ],
};

test("create role requires UUID permissions and at least one", () => {
    assert.equal(
        createRoleSchema.safeParse({
            name: "test",
            permissionIds: [],
        }).success,
        false,
    );

    assert.equal(
        createRoleSchema.safeParse({
            name: "test",
            permissionIds: ["employees.read"],
        }).success,
        false,
    );

    assert.equal(
        createRoleSchema.safeParse({
            name: "test",
            permissionIds: [id, id],
        }).success,
        false,
    );

    assert.equal(
        createRoleSchema.safeParse({
            name: "test",
            permissionIds: [id],
        }).success,
        true,
    );
});

test("role metadata PATCH cannot carry assignment or system flag", () => {
    assert.equal(
        updateRoleSchema.safeParse({}).success,
        false,
    );

    assert.equal(
        updateRoleSchema.safeParse({
            permissionIds: [id],
        }).success,
        false,
    );

    assert.equal(
        updateRoleSchema.safeParse({
            isSystem: true,
        }).success,
        false,
    );

    assert.equal(
        updateRoleSchema.safeParse({
            description: "",
        }).success,
        true,
    );
});

test("assignment replacement permits explicit empty and rejects extra fields", () => {
    assert.equal(
        assignmentSchema.safeParse({
            permissionIds: [],
        }).success,
        true,
    );

    assert.equal(
        assignmentSchema.safeParse({
            permissionIds: [id],
            name: "test",
        }).success,
        false,
    );
});

test("permission DTO stays strict and PATCH cannot be empty", () => {
    assert.equal(
        createPermissionSchema.safeParse({
            resource: "x",
            action: "read",
        }).success,
        true,
    );

    assert.equal(
        createPermissionSchema.safeParse({
            resource: "x",
            action: "read",
            isSystem: true,
        }).success,
        false,
    );

    assert.equal(
        updatePermissionSchema.safeParse({}).success,
        false,
    );

    assert.equal(
        updatePermissionSchema.safeParse({
            isActive: false,
        }).success,
        true,
    );
});

test("detail role requires existing assignments; missing is not empty", () => {
    assert.equal(
        roleDetailSchema.safeParse(role).success,
        true,
    );

    const { permissions, ...missing } = role;

    assert.equal(
        roleDetailSchema.safeParse(missing).success,
        false,
    );

    assert.equal(
        roleDetailSchema.safeParse({
            ...role,
            permissions: [
                ...permissions,
                ...permissions,
            ],
        }).success,
        false,
    );
});

test("selection preserves existing unknown/inactive but disallows new ones", () => {
    assert.doesNotThrow(() =>
        validateSelection([id], [id], []),
    );

    assert.doesNotThrow(() =>
        validateSelection([], [id], []),
    );

    assert.throws(() =>
        validateSelection([id], [], []),
    );

    assert.throws(() =>
        validateSelection(
            [id],
            [],
            [{ ...permission, isActive: false }],
        ),
    );

    assert.doesNotThrow(() =>
        validateSelection([id], [], [permission]),
    );
});

test("fingerprint notices changed assignments and status", () => {
    const parsed = roleDetailSchema.parse(role);

    assert.notEqual(
        assignmentFingerprint(parsed),
        assignmentFingerprint({
            ...parsed,
            permissions: [],
        }),
    );

    assert.notEqual(
        assignmentFingerprint(parsed),
        assignmentFingerprint({
            ...parsed,
            permissions: [
                {
                    ...parsed.permissions[0],
                    isActive: false,
                },
            ],
        }),
    );
});

test("navigation requires exact effective permission", () => {
    const user = {
        isActive: true,
        permissions: ["roles.read"],
    };

    assert.ok(
        getNavItems(user).some(
            (item) => item.href === "/roles",
        ),
    );

    assert.ok(
        !getNavItems(user).some(
            (item) => item.href === "/permissions",
        ),
    );

    assert.deepEqual(
        getNavItems({
            ...user,
            isActive: false,
        }),
        [],
    );
});