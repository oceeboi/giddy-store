'use client';

import { useState } from 'react';
import { createColumnHelper, tableFeatures } from '@tanstack/react-table';
import { SizeData } from '@/types/shared/catalog';
import { Sheet } from '@/components/shared';
import { MoreVertical } from 'lucide-react';
import { SizeUpdate } from '@/components/comps';

export const features = tableFeatures({});

const columnHelper = createColumnHelper<typeof features, SizeData>();

export const sizeColumns = [
  columnHelper.accessor('name', {
    header: 'Size Name',
    cell: ({ row }) => {
      const size = row.original;
      return (
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center border border-neutral-200 bg-neutral-100 font-mono text-xs font-bold text-black dark:border-neutral-800 dark:bg-neutral-900 dark:text-white">
            {size.name.slice(0, 3)}
          </div>
          <span className="font-archivo text-xs font-semibold uppercase tracking-wider text-black dark:text-white">
            {size.name}
          </span>
        </div>
      );
    },
  }),

  columnHelper.display({
    id: 'actions',
    header: '',
    cell: ({ row }) => {
      const size = row.original;
      return <SizeRowActionCell size={size} />;
    },
  }),
];

function SizeRowActionCell({ size }: { size: SizeData }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <Sheet.Trigger asChild>
          <button
            type="button"
            className="flex h-8 w-8 items-center justify-center rounded-none border border-transparent text-neutral-500 hover:border-neutral-200 hover:bg-neutral-100 hover:text-black dark:hover:border-neutral-800 dark:hover:bg-neutral-900 dark:hover:text-white"
            aria-label="Edit size"
          >
            <MoreVertical className="h-4 w-4" />
          </button>
        </Sheet.Trigger>

        <Sheet.Content side="right" size="lg" className="h-full bg-white p-0 dark:bg-neutral-950">
          <Sheet.Header className="border-b border-neutral-200 p-6 dark:border-neutral-800">
            <Sheet.Title>
              <span className="font-archivo text-base font-bold uppercase tracking-wider text-black dark:text-white">
                Update Size
              </span>
            </Sheet.Title>
          </Sheet.Header>

          <div className="p-6 overflow-y-auto max-h-[calc(100vh-80px)]">
            <SizeUpdate id={size.id} setValue={() => setIsOpen(false)} />
          </div>
        </Sheet.Content>
      </Sheet>
    </div>
  );
}
