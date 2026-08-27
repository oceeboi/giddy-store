'use client';

import Image from 'next/image';
import { useState } from 'react';
import { createColumnHelper, tableFeatures } from '@tanstack/react-table';
import { BrandData } from '@/types/shared/catalog';

import { Sheet } from '@/components/shared';
import { MoreVertical, ExternalLink } from 'lucide-react';
import { format_date } from '@/utils/format';
import { BrandUpdate } from '@/components/comps';

export const features = tableFeatures({}); // util method to create sharable TFeatures object/type

const columnHelper = createColumnHelper<typeof features, BrandData>();

export const brandColumns = [
  // 1. Brand Info (Logo & Name)
  columnHelper.accessor('name', {
    header: 'Brand',
    cell: ({ row }) => {
      const brand = row.original;
      return (
        <div className="flex items-center gap-3">
          <div className="relative h-9 w-9 shrink-0 overflow-hidden border border-neutral-200 bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900">
            {brand.logo ? (
              <Image
                src={brand.logo}
                alt={brand.name}
                fill
                className="object-contain p-1"
                sizes="36px"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center font-archivo text-[10px] uppercase text-neutral-400">
                {brand.name.slice(0, 2)}
              </div>
            )}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-archivo text-xs font-semibold uppercase tracking-wider text-black dark:text-white truncate">
              {brand.name}
            </span>
            <span className="font-mono text-[11px] text-neutral-500 truncate">{brand.slug}</span>
          </div>
        </div>
      );
    },
  }),

  // 2. Website Link
  columnHelper.accessor('website', {
    header: 'Website',
    cell: ({ getValue }) => {
      const website = getValue();
      if (!website) {
        return <span className="font-archivo text-xs text-neutral-400">—</span>;
      }

      const cleanDisplay = website.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');

      return (
        <a
          href={website}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="inline-flex items-center gap-1 font-archivo text-xs text-neutral-700 hover:text-black hover:underline dark:text-neutral-300 dark:hover:text-white"
        >
          <span className="truncate max-w-40">{cleanDisplay}</span>
          <ExternalLink className="h-3 w-3 shrink-0 text-neutral-400" />
        </a>
      );
    },
  }),

  // 3. Active Status Badge
  columnHelper.accessor('active', {
    header: 'Status',
    cell: ({ getValue }) => {
      const active = getValue();
      return (
        <span
          className={`font-archivo inline-flex items-center px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
            active
              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
              : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400'
          }`}
        >
          {active ? 'Active' : 'Inactive'}
        </span>
      );
    },
  }),

  // 4. Created Date
  columnHelper.accessor('createdAt', {
    header: 'Added on',
    cell: ({ getValue }) => (
      <span className="font-archivo text-xs text-neutral-500">{format_date(getValue())}</span>
    ),
  }),

  // 5. Row Actions (Sheet Drawer Trigger)
  columnHelper.display({
    id: 'actions',
    header: '',
    cell: ({ row }) => {
      const brand = row.original;
      return <BrandRowActionCell brand={brand} />;
    },
  }),
];

function BrandRowActionCell({ brand }: { brand: BrandData }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <Sheet.Trigger asChild>
          <button
            type="button"
            className="flex h-8 w-8 items-center justify-center rounded-none border border-transparent text-neutral-500 hover:border-neutral-200 hover:bg-neutral-100 hover:text-black dark:hover:border-neutral-800 dark:hover:bg-neutral-900 dark:hover:text-white"
            aria-label="Edit brand"
          >
            <MoreVertical className="h-4 w-4" />
          </button>
        </Sheet.Trigger>

        <Sheet.Content side="right" size="lg" className="h-full bg-white p-0 dark:bg-neutral-950">
          <Sheet.Header className="border-b border-neutral-200 p-6 dark:border-neutral-800">
            <Sheet.Title>
              <span className="font-archivo text-base font-bold uppercase tracking-wider text-black dark:text-white">
                Update Brand
              </span>
            </Sheet.Title>
          </Sheet.Header>

          <div className="p-6 overflow-y-auto max-h-[calc(100vh-80px)]">
            <BrandUpdate id={brand.id} setValue={() => setIsOpen(false)} />
          </div>
        </Sheet.Content>
      </Sheet>
    </div>
  );
}
