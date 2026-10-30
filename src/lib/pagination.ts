import { z } from "zod";

export interface PageResult<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasPreviousPage: boolean;
    hasNextPage: boolean;
}

// Input adalah body backend SETELAH apiClient membuka wrapper BFF.
export function parsePage<T>(
    input: unknown,
    itemSchema: z.ZodType<T>,
    requestedPage: number,
): PageResult<T> {
    const result = z
        .object({
            data: z.array(itemSchema),
            total: z.number().int().nonnegative(),
            page: z.number().int().positive(),
            limit: z.number().int().positive(),
        })
        .safeParse(input);

    if (!result.success) {
        throw new Error(
            "Format list tidak cocok: diperlukan { data, total, page, limit }.",
        );
    }

    const value = result.data;

    if (
        value.page !== requestedPage ||
        value.data.length > value.limit ||
        value.data.length > value.total
    ) {
        throw new Error("Metadata pagination backend tidak konsisten.");
    }

    const totalPages = Math.max(
        1,
        Math.ceil(value.total / value.limit),
    );

    if (
        value.total > 0 &&
        value.page <= totalPages &&
        !value.data.length
    ) {
        throw new Error(
            "Halaman kosong tidak cocok dengan total backend. Coba lagi.",
        );
    }

    return {
        ...value,
        totalPages,
        hasPreviousPage: value.page > 1,
        hasNextPage: value.page < totalPages,
    };
}