import test from "node:test";
import assert from "node:assert/strict";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  createEmployeeSchema,
  updateEmployeeSchema,
  assignRolePermissionsSchema,
} from "../src/features/employees/schemas";
import {
  changePasswordSchema,
} from "../src/features/auth/schemas";

import {
  toFrontendProfile,
} from "../src/features/auth/backend-profile";

import {
  loginSchema,
} from "../src/features/auth/schemas";
import { cachedProfile } from "../src/lib/profile-cache";

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

test("Zod resolver maps login validation errors", async () => {
  const result = await zodResolver(loginSchema)(
    { email: "invalid", password: "" },
    undefined,
    {
      criteriaMode: "firstError",
      fields: {},
      shouldUseNativeValidation: false,
    },
  );

  assert.equal(result.errors.email?.message, "Email tidak valid");
  assert.equal(result.errors.password?.message, "Password wajib diisi");
});

test(
  "Initial password change enforces strength and confirmation",
  () => {
    assert.equal(
      changePasswordSchema.safeParse({
        password: "PasswordBaru1!",
        confirmPassword: "PasswordBaru1!",
      }).success,
      true,
    );

    for (const input of [
      {
        password: "passwordbaru1!",
        confirmPassword: "passwordbaru1!",
      },
      {
        password: "PasswordBaru!!",
        confirmPassword: "PasswordBaru!!",
      },
      {
        password: "PasswordBaru12",
        confirmPassword: "PasswordBaru12",
      },
      {
        password: "Pass1!",
        confirmPassword: "Pass1!",
      },
      {
        password: "PasswordBaru1!",
        confirmPassword: "PasswordBeda1!",
      },
    ]) {
      assert.equal(
        changePasswordSchema.safeParse(input).success,
        false,
      );
    }
  },
);

test(
  "Employee create matches the current backend DTO",
  () => {
    const payload = {
      name: "Example",
      email: "test@example.invalid",
      departmentId:
        "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      jobPositionId:
        "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
    };

    assert.equal(
      createEmployeeSchema.safeParse(payload)
        .success,
      true,
    );

    assert.equal(
      createEmployeeSchema.safeParse({
        ...payload,
        departmentId: undefined,
      }).success,
      false,
    );

    assert.equal(
      createEmployeeSchema.safeParse({
        ...payload,
        password: "ExampleTest123!",
      }).success,
      false,
    );

    assert.equal(
      createEmployeeSchema.safeParse({
        ...payload,
        status: "pending",
      }).success,
      false,
    );
  },
);

test(
  "Employee PATCH rejects unsupported identity and reference fields",
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
      {
        roleId:
          "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      },
      {
        locationId:
          "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
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
  "/me requires permissions but tolerates omitted non-access metadata",
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

    const {
      employeeNumber,
      roleId,
      departmentId,
      jobPositionId,
      locationId,
      mustachePassword,
      createdAt,
      updatedAt,
      ...minimal
    } = me;

    const fallback = toFrontendProfile(minimal);

    assert.equal(fallback.employeeId, "");
    assert.equal(fallback.roleId, null);
    assert.equal(fallback.departmentId, null);
    assert.equal(fallback.jobPositionId, null);
    assert.equal(fallback.locationId, null);
    assert.equal(fallback.mustachePassword, false);
    assert.equal(fallback.createdAt, "");
    assert.equal(fallback.updatedAt, "");
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

test("Profile verification deduplicates briefly and supports a forced read", async () => {
  let calls = 0;
  const load = async () => {
    calls += 1;
    return toFrontendProfile(me);
  };

  const token = "test-access-token-" + Date.now();

  await Promise.all([
    cachedProfile(token, load),
    cachedProfile(token, load),
  ]);
  assert.equal(calls, 1);

  await cachedProfile(token, load);
  assert.equal(calls, 1);

  await cachedProfile(token, load, true);
  assert.equal(calls, 2);
});
