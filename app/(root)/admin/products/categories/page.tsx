'use client';

import { features, categoryColumns } from '@/components/columns/admin/category-column';
import { CategoryRowCard } from '@/components/comps';
import { useAdminCategoriesQuery } from '@/hooks/use-catalog.hook';

import { flexRender, useTable } from '@tanstack/react-table';
import { useTanStackTableDevtools } from '@tanstack/react-table-devtools';

export default function AdminCategoriesPage() {
  const { data, isLoading, isError, error } = useAdminCategoriesQuery();

  const table = useTable(
    {
      key: 'admin-category-table',
      debugTable: false,
      features,
      columns: categoryColumns as any,
      data: data?.categories ?? [],
    },
    (state) => state
  );

  useTanStackTableDevtools(table);

  if (isError) {
    return (
      <div className="rounded-none border border-red-200 bg-red-50 p-6 text-center text-red-700 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-400">
        <p className="font-semibold">Failed to load categories</p>
        <p className="mt-1 text-sm">{error?.message || 'An unexpected error occurred.'}</p>
      </div>
    );
  }

  const categories = data?.categories ?? [];

  return (
    <section className="w-full font-archivo">
      {/* Mobile / small-screen card list */}
      <div className="flex flex-col gap-3 md:hidden">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, idx) => (
            <div
              key={idx}
              className="animate-pulse border border-neutral-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-950"
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 shrink-0 rounded-none bg-neutral-200 dark:bg-neutral-800" />
                <div className="flex flex-1 flex-col gap-2">
                  <div className="h-3.5 w-2/3 rounded-none bg-neutral-200 dark:bg-neutral-800" />
                  <div className="h-3 w-1/3 rounded-none bg-neutral-200 dark:bg-neutral-800" />
                </div>
              </div>
            </div>
          ))
        ) : categories.length === 0 ? (
          <div className="border border-neutral-200 bg-white py-12 text-center text-sm text-neutral-500 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-400">
            No categories found.
          </div>
        ) : (
          categories.map((category) => <CategoryRowCard key={category.id} category={category} />)
        )}
      </div>

      {/* Desktop / tablet table */}
      <div className="hidden md:block overflow-x-auto rounded-none border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950">
        <table className="w-full text-left text-sm text-neutral-600 dark:text-neutral-400">
          <thead className="border-b border-neutral-200 bg-neutral-50/50 text-xs uppercase whitespace-nowrap text-neutral-500 dark:border-neutral-800 dark:bg-neutral-900/50 dark:text-neutral-400">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th key={header.id} className="px-4 py-3.5 font-semibold">
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>

          <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, idx) => (
                <tr key={idx} className="animate-pulse">
                  {categoryColumns.map((_, colIdx) => (
                    <td key={colIdx} className="px-4 py-4">
                      <div className="h-4 w-24 rounded-none bg-neutral-200 dark:bg-neutral-800" />
                    </td>
                  ))}
                </tr>
              ))
            ) : table.getRowModel().rows.length === 0 ? (
              <tr>
                <td
                  colSpan={categoryColumns.length}
                  className="py-12 text-center text-sm text-neutral-500 dark:text-neutral-400"
                >
                  No categories found.
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className="transition-colors hover:bg-neutral-50/50 dark:hover:bg-neutral-900/50"
                >
                  {row.getAllCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-3.5 align-middle">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>

          {table
            .getFooterGroups()
            .some((fg) => fg.headers.some((h) => h.column.columnDef.footer)) && (
            <tfoot className="border-t border-neutral-200 bg-neutral-50/50 dark:border-neutral-800 dark:bg-neutral-900/50">
              {table.getFooterGroups().map((footerGroup) => (
                <tr key={footerGroup.id}>
                  {footerGroup.headers.map((header) => (
                    <th key={header.id} className="px-4 py-3 font-medium">
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.footer, header.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </tfoot>
          )}
        </table>
      </div>
    </section>
  );
}
