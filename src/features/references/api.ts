import { z } from "zod";

import { apiClient } from "@/lib/http";
import {
    parsePage,
    type PageResult,
} from "@/lib/pagination";

import type { ReferenceOption } from "./selection";

export type ReferenceResource =
    | "roles"
    | "departments"
    | "job-positions"
    | "locations";

// Picker hanya memerlukan id dan name.
const optionSchema = z.object({
    id: z.string().uuid(),
    name: z.string().trim().min(1),
});

export async function collectReferencePages(
    loadPage: (
        page: number,
    ) => Promise<PageResult<ReferenceOption>>,
): Promise<ReferenceOption[]> {
    const items = new Map<string, ReferenceOption>();

    let expectedTotal: number | undefined;
    let expectedLimit: number | undefined;

    for (let page = 1; page <= 100; page++) {
        const result = await loadPage(page);

        if (
            result.page !== page ||
            (
                expectedTotal !== undefined &&
                result.total !== expectedTotal
            ) ||
            (
                expectedLimit !== undefined &&
                result.limit !== expectedLimit
            )
        ) {
            throw new Error(
                "Daftar referensi berubah saat dimuat. Coba lagi.",
            );
        }

        expectedTotal = result.total;
        expectedLimit = result.limit;

        for (const item of result.data) {
            if (items.has(item.id)) {
                throw new Error(
                    "Referensi duplikat antarhalaman. Muat ulang daftar.",
                );
            }

            items.set(item.id, item);
        }

        if (!result.hasNextPage) {
            if (items.size !== result.total) {
                throw new Error(
                    "Daftar referensi belum lengkap. Coba lagi.",
                );
            }

            return [...items.values()].sort(
                (a, b) =>
                    a.name.localeCompare(b.name, "id") ||
                    a.id.localeCompare(b.id),
            );
        }

        if (!result.data.length) {
            throw new Error(
                "Halaman referensi kosong sebelum daftar selesai.",
            );
        }
    }

    throw new Error(
        "Referensi melebihi 100 halaman. Diperlukan picker server-search; daftar parsial tidak dipakai.",
    );
}

export function getReferenceOptions(
    resource: ReferenceResource,
) {
    return collectReferencePages(async (page) => {
        const raw = await apiClient.get<unknown>(
            `/${resource}?page=${page}&limit=100`,
        );

        return parsePage(raw, optionSchema, page);
    });
}
