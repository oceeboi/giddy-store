'use client';

import Image from 'next/image';
import { useState } from 'react';
import { CategoryData } from '@/types/shared/catalog';
import { Sheet } from '@/components/shared';
import { MoreVertical } from 'lucide-react';
import { format_date } from '@/utils/format';
import { CategoryUpdate } from './category-update';

type CategoryRowCardProps = {
  category: CategoryData;
};

export function CategoryRowCard({ category }: CategoryRowCardProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="flex items-center justify-between border border-neutral-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-950">
      <div className="flex items-center gap-3 min-w-0">
        <div className="relative h-10 w-10 shrink-0 overflow-hidden border border-neutral-200 bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900">
          {category.image ? (
            <Image
              src={category.image}
              alt={category.name}
              fill
              className="object-cover p-0.5"
              sizes="40px"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center font-archivo text-[10px] uppercase text-neutral-400">
              {category.name.slice(0, 2)}
            </div>
          )}
        </div>

        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-archivo text-xs font-semibold uppercase tracking-wider text-black dark:text-white truncate">
              {category.name}
            </span>
            <span
              className={`font-archivo inline-flex items-center px-1.5 py-0.2 text-[9px] font-semibold uppercase tracking-wider ${
                category.active
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                  : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400'
              }`}
            >
              {category.active ? 'Active' : 'Draft'}
            </span>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-neutral-500 font-archivo truncate">
            <span className="font-mono text-[10px]">/{category.slug}</span>
            <span>•</span>
            <span>{category.parent ? `Parent: ${category.parent.name}` : 'Root'}</span>
            <span>•</span>
            <span>{format_date(category.createdAt)}</span>
          </div>
        </div>
      </div>

      <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <Sheet.Trigger asChild>
            <button
              type="button"
              className="flex h-8 w-8 items-center justify-center rounded-none border border-transparent text-neutral-500 hover:border-neutral-200 hover:bg-neutral-100 hover:text-black dark:hover:border-neutral-800 dark:hover:bg-neutral-900 dark:hover:text-white"
              aria-label="Edit category"
            >
              <MoreVertical className="h-4 w-4" />
            </button>
          </Sheet.Trigger>

          <Sheet.Content side="right" size="lg" className="h-full bg-white p-0 dark:bg-neutral-950">
            <Sheet.Header className="border-b border-neutral-200 p-6 dark:border-neutral-800">
              <Sheet.Title>
                <span className="font-archivo text-base font-bold uppercase tracking-wider text-black dark:text-white">
                  Update Category
                </span>
              </Sheet.Title>
            </Sheet.Header>

            <div className="p-6 overflow-y-auto max-h-[calc(100vh-80px)]">
              <CategoryUpdate id={category.id} setValue={() => setIsOpen(false)} />
            </div>
          </Sheet.Content>
        </Sheet>
      </div>
    </div>
  );
}
