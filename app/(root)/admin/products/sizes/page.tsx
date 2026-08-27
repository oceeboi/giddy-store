'use client';

import { features, sizeColumns } from '@/components/columns/admin/size-column';
import { SizeRowCard } from '@/components/comps';
import { useAdminSizesQuery } from '@/hooks/use-catalog.hook';

import { flexRender, useTable } from '@tanstack/react-table';
import { useTanStackTableDevtools } from '@tanstack/react-table-devtools';

export default function SizesPage() {
  const { data, isLoading, isError, error } = useAdminSizesQuery();

  const table = useTable(
    {
      key: 'admin-size-table',
      debugTable: false,
      features,
      columns: sizeColumns as any,
      data: data?.sizes ?? [],
    },
    (state) => state
  );

  useTanStackTableDevtools(table);

  if (isError) {
    return (
      <div className="rounded-none border border-red-200 bg-red-50 p-6 text-center text-red-700 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-400">
        <p className="font-semibold">Failed to load sizes</p>
        <p className="mt-1 text-sm">{error?.message || 'An unexpected error occurred.'}</p>
      </div>
    );
  }

  const sizes = data?.sizes ?? [];
  return (
    <section className="w-full font-archivo">
      {/* Mobile / small-screen card list */}
      <div className="flex flex-col gap-3 md:hidden">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, idx) => (
            <div
              key={idx}
              className="animate-pulse border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950"
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 shrink-0 rounded-none bg-neutral-200 dark:bg-neutral-800" />
                <div className="h-4 w-1/3 rounded-none bg-neutral-200 dark:bg-neutral-800" />
              </div>
            </div>
          ))
        ) : sizes.length === 0 ? (
          <div className="border border-neutral-200 bg-white py-12 text-center text-sm text-neutral-500 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-400">
            No sizes found.
          </div>
        ) : (
          sizes.map((size) => <SizeRowCard key={size.id} size={size} />)
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
                  {sizeColumns.map((_, colIdx) => (
                    <td key={colIdx} className="px-4 py-4">
                      <div className="h-4 w-24 rounded-none bg-neutral-200 dark:bg-neutral-800" />
                    </td>
                  ))}
                </tr>
              ))
            ) : table.getRowModel().rows.length === 0 ? (
              <tr>
                <td
                  colSpan={sizeColumns.length}
                  className="py-12 text-center text-sm text-neutral-500 dark:text-neutral-400"
                >
                  No sizes found.
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
