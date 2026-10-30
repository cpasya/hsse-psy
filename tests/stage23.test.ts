import test from "node:test";
import assert from "node:assert/strict";

import { z } from "zod";

import { parsePage } from "../src/lib/pagination";
import { getEmployees } from "../src/features/employees/api";

import {
    collectReferencePages,
} from "../src/features/references/api";

import {
    referencePatch,
    type ReferenceValues,
    type ReferenceAvailability,
} from "../src/features/references/selection";

const id = "00000000-0000-4000-8000-000000000001";
const id2 = "00000000-0000-4000-8000-000000000002";

const item = z.object({
    id: z.string(),
    name: z.string(),
});

const option = {
    id,
    name: "Referensi uji",
};

const empty: ReferenceValues = {
    roleId: "",
    departmentId: "",
    locationId: "",
};

const available = (): Record<
    keyof ReferenceValues,
    ReferenceAvailability
> => ({
    roleId: {
        allowed: true,
        ready: true,
        items: [option],
    },
    departmentId: {
        allowed: true,
        ready: true,
        items: [],
    },
    locationId: {
        allowed: true,
        ready: true,
        items: [],
    },
});

test(
    "Pagination derives totalPages/next from total, not array length",
    () => {
        const page = parsePage(
            {
                data: [option],
                total: 3,
                page: 1,
                limit: 2,
            },
            item,
            1,
        );

        assert.equal(page.totalPages, 2);
        assert.equal(page.hasNextPage, true);
        assert.equal(page.hasPreviousPage, false);

        const last = parsePage(
            {
                data: [option],
                total: 3,
                page: 2,
                limit: 2,
            },
            item,
            2,
        );

        assert.equal(last.hasNextPage, false);
        assert.equal(last.hasPreviousPage, true);
    },
);

test(
    "Empty results and a page invalidated by deletion retain backend totals",
    () => {
        const emptyPage = parsePage(
            {
                data: [],
                total: 0,
                page: 1,
                limit: 2,
            },
            item,
            1,
        );

        assert.equal(emptyPage.totalPages, 1);
        assert.equal(emptyPage.total, 0);
        assert.equal(emptyPage.hasNextPage, false);

        const stale = parsePage(
            {
                data: [],
                total: 1,
                page: 2,
                limit: 2,
            },
            item,
            2,
        );

        // UsersPage menyesuaikan page ke totalPages.
        assert.ok(stale.page > stale.totalPages);
    },
);

test(
    "Invalid/missing metadata is an error, never a fallback empty list",
    () => {
        for (const input of [
            [],
            { data: [] },
            {
                data: [],
                total: -1,
                page: 1,
                limit: 2,
            },
            {
                data: [],
                total: 0,
                page: 1,
                limit: 0,
            },
            {
                data: [],
                total: 0,
                page: 2,
                limit: 2,
            },
        ]) {
            assert.throws(() =>
                parsePage(input, item, 1),
            );
        }
    },
);

test(
    "Employee adapter unwraps BFF exactly once and preserves backend pagination",
    async () => {
        const original = globalThis.fetch;
        let requested = "";

        globalThis.fetch = async (input) => {
            requested = String(input);

            return new Response(
                JSON.stringify({
                    // Wrapper BFF.
                    data: {
                        // Body backend.
                        data: [
                            {
                                id,
                                name: "Uji",
                                email: "test@example.invalid",
                                status: "active",
                            },
                        ],
                        total: 3,
                        page: 1,
                        limit: 2,
                    },
                }),
                {
                    status: 200,
                    headers: {
                        "Content-Type": "application/json",
                    },
                },
            );
        };

        try {
            const result = await getEmployees({
                page: 1,
                limit: 2,
            });

            assert.ok(
                requested.startsWith(
                    "/api/gateway/employees?",
                ),
            );

            assert.equal(result.data.length, 1);
            assert.equal(result.total, 3);
            assert.equal(result.hasNextPage, true);
        } finally {
            globalThis.fetch = original;
        }
    },
);

test(
    "References collect all pages, including an empty catalogue",
    async () => {
        const calls: number[] = [];

        const result = await collectReferencePages(
            async (page) => {
                calls.push(page);

                return parsePage(
                    {
                        data: [
                            {
                                id: page === 1 ? id : id2,
                                name: `Nama ${page}`,
                            },
                        ],
                        total: 2,
                        page,
                        limit: 1,
                    },
                    item,
                    page,
                );
            },
        );

        assert.deepEqual(calls, [1, 2]);
        assert.equal(result.length, 2);

        const emptyCatalogue =
            await collectReferencePages(async () =>
                parsePage(
                    {
                        data: [],
                        total: 0,
                        page: 1,
                        limit: 100,
                    },
                    item,
                    1,
                ),
            );

        assert.deepEqual(emptyCatalogue, []);
    },
);

test(
    "References reject incomplete, duplicate, changing or over-limit catalogues",
    async () => {
        await assert.rejects(
            collectReferencePages(async (page) =>
                parsePage(
                    {
                        data: [option],
                        total: 2,
                        page,
                        limit: 100,
                    },
                    item,
                    page,
                ),
            ),
        );

        await assert.rejects(
            collectReferencePages(async (page) =>
                parsePage(
                    {
                        data: [option],
                        total: 2,
                        page,
                        limit: 1,
                    },
                    item,
                    page,
                ),
            ),
        );

        await assert.rejects(
            collectReferencePages(async (page) =>
                parsePage(
                    {
                        data: [
                            {
                                id: String(page),
                                name: "Uji",
                            },
                        ],
                        total: page === 1 ? 2 : 3,
                        page,
                        limit: 1,
                    },
                    item,
                    page,
                ),
            ),
        );

        await assert.rejects(
            collectReferencePages(async (page) =>
                parsePage(
                    {
                        data: [
                            {
                                id: String(page),
                                name: "Uji",
                            },
                        ],
                        total: 101,
                        page,
                        limit: 1,
                    },
                    item,
                    page,
                ),
            ),
            /100 halaman/,
        );
    },
);

test(
    "Edit preserves unavailable or unreadable existing assignments by omission",
    () => {
        const original = {
            ...empty,
            roleId: id,
        };

        const states = available();

        states.roleId.items = [];
        states.roleId.ready = false;

        assert.deepEqual(
            referencePatch(
                original,
                original,
                true,
                states,
            ),
            {},
        );

        states.roleId.allowed = false;

        assert.deepEqual(
            referencePatch(
                { ...empty, roleId: id2 },
                original,
                true,
                states,
            ),
            {},
        );

        assert.deepEqual(
            referencePatch(
                empty,
                empty,
                false,
                available(),
            ),
            {},
        );
    },
);

test(
    "Reference changes require ready listed UUIDs; explicit clearing sends null",
    () => {
        assert.deepEqual(
            referencePatch(
                { ...empty, roleId: id },
                empty,
                false,
                available(),
            ),
            { roleId: id },
        );

        assert.deepEqual(
            referencePatch(
                empty,
                { ...empty, roleId: id },
                true,
                available(),
            ),
            { roleId: null },
        );

        assert.throws(() =>
            referencePatch(
                { ...empty, roleId: id2 },
                empty,
                false,
                available(),
            ),
        );

        const states = available();
        states.roleId.ready = false;

        assert.throws(() =>
            referencePatch(
                { ...empty, roleId: id },
                empty,
                false,
                states,
            ),
        );
    },
);