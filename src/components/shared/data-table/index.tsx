"use client";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  SortingState,
} from "@tanstack/react-table";
import { ChevronLeft, ChevronRight, ArrowUpDown } from "lucide-react";
import { PaginationMeta } from "@/types/api";
import { EmptyState } from "@/components/shared/feedback";
export function DataTable<T>({
  columns,
  data,
  meta,
  onPage,
  sorting = [],
  onSorting,
}: {
  columns: ColumnDef<T>[];
  data: T[];
  meta: PaginationMeta;
  onPage: (n: number) => void;
  sorting?: SortingState;
  onSorting?: (s: SortingState) => void;
}) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    manualSorting: true,
    pageCount: meta.totalPages,
    state: { sorting },
    onSortingChange: (updater) =>
      onSorting?.(typeof updater === "function" ? updater(sorting) : updater),
  });
  return (
    <>
      <div className="table-scroll">
        <table>
          <thead>
            {table.getHeaderGroups().map((group) => (
              <tr key={group.id}>
                {group.headers.map((header) => (
                  <th key={header.id} scope="col">
                    {header.column.getCanSort() && onSorting ? (
                      <button
                        className="table-sort"
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                        <ArrowUpDown size={14} />
                        {header.column.getIsSorted() === "asc"
                          ? " ↑"
                          : header.column.getIsSorted() === "desc"
                            ? " ↓"
                            : ""}
                      </button>
                    ) : (
                      flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {data.length === 0 && <EmptyState message="Belum ada data yang sesuai" />}
      <div className="pagination">
        <span>
          {meta.totalItems} hasil · Halaman {meta.page} dari{" "}
          {Math.max(meta.totalPages, 1)}
        </span>
        <div>
          <button
            aria-label="Halaman sebelumnya"
            className="icon-btn"
            disabled={!meta.hasPreviousPage}
            onClick={() => onPage(meta.page - 1)}
          >
            <ChevronLeft size={18} />
          </button>
          <button
            aria-label="Halaman berikutnya"
            className="icon-btn"
            disabled={!meta.hasNextPage}
            onClick={() => onPage(meta.page + 1)}
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
    </>
  );
}
