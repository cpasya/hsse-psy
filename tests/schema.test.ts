import test from "node:test";
import assert from "node:assert/strict";

import {
  createEmployeeSchema,
  updateEmployeeSchema,
  assignRolePermissionsSchema,
} from "../src/features/employees/schemas";

import {
  toFrontendProfile,
} from "../src/features/auth/backend-profile";

import {
  loginSchema,
} from "../src/features/auth/schemas";

const me = {
  id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  name: "Example",
  email: "test@example.invalid",

  employeeNumber: null,
  status: "active",

  roleId: null,
  departmentId: null,
  jobPositionId: null,
  locationId: null,

  mustachePassword: false,

  permissions: [
    "employees.read",
    "employees.read",
  ],

  createdAt: "2026-10-25T00:00:00.000Z",
  updatedAt: "2026-10-25T00:00:00.000Z",
};

test(
  "Employee create validates password, UUIDs and rejects legacy fields",
  () => {
    const payload = {
      name: "Example",
      email: "test@example.invalid",
      password: "ExampleTest123!",
      status: "pending",
    };

    assert.equal(
      createEmployeeSchema.safeParse(payload)
        .success,
      true,
    );

    assert.equal(
      createEmployeeSchema.safeParse({
        ...payload,
        password: "short",
      }).success,
      false,
    );

    assert.equal(
      createEmployeeSchema.safeParse({
        ...payload,
        roleId: "admin",
      }).success,
      false,
    );

    assert.equal(
      createEmployeeSchema.safeParse({
        ...payload,
        isActive: true,
      }).success,
      false,
    );
  },
);

test(
  "Employee PATCH rejects email/password and empty changes",
  () => {
    assert.equal(
      updateEmployeeSchema.safeParse({
        status: "active",
      }).success,
      true,
    );

    for (const payload of [
      {},
      {
        email: "other@example.invalid",
      },
      {
        password: "ExampleTest123!",
      },
    ]) {
      assert.equal(
        updateEmployeeSchema.safeParse(payload)
          .success,
        false,
      );
    }
  },
);

test(
  "/me is required as permission source; missing permissions fails",
  () => {
    const profile =
      toFrontendProfile(me);

    assert.deepEqual(
      profile.permissions,
      ["employees.read"],
    );

    assert.equal(
      "role" in profile,
      false,
    );

    assert.equal(
      profile.isActive,
      true,
    );

    assert.equal(
      toFrontendProfile({
        ...me,
        status: "pending",
      }).isActive,
      false,
    );

    const {
      permissions,
      ...missing
    } = me;

    assert.throws(() =>
      toFrontendProfile(missing),
    );

    assert.deepEqual(
      toFrontendProfile({
        ...me,
        permissions: [],
      }).permissions,
      [],
    );
  },
);

test(
  "Login preserves password whitespace; permission assignment needs UUIDs",
  () => {
    assert.equal(
      loginSchema.parse({
        email: "test@example.invalid",
        password: " a ",
      }).password,
      " a ",
    );

    assert.equal(
      assignRolePermissionsSchema.safeParse({
        permissionIds: ["not-a-uuid"],
      }).success,
      false,
    );

    assert.equal(
      assignRolePermissionsSchema.safeParse({
        permissionIds: [],
      }).success,
      true,
    );
  },
);