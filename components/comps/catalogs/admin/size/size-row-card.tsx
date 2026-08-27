'use client';

import { useState, MouseEvent } from 'react';
import { SizeData } from '@/types/shared/catalog';
import { Sheet } from '@/components/shared';
import { MoreVertical } from 'lucide-react';
import { SizeUpdate } from './size-update';

type SizeRowCardProps = {
  size: SizeData;
  onClick?: (size: SizeData) => void;
};

export function SizeRowCard({ size, onClick }: SizeRowCardProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleCardClick = () => {
    if (onClick) onClick(size);
  };

  const handleSheetTriggerClick = (e: MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleCardClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleCardClick();
        }
      }}
      className="group relative flex w-full cursor-pointer items-center justify-between border border-neutral-200 bg-white p-4 transition-colors hover:border-black dark:border-neutral-800 dark:bg-neutral-950 dark:hover:border-neutral-100"
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-neutral-200 bg-neutral-100 font-mono text-xs font-bold text-black dark:border-neutral-800 dark:bg-neutral-900 dark:text-white">
          {size.name.slice(0, 3)}
        </div>

        <span className="font-archivo text-sm font-semibold uppercase tracking-tight text-neutral-900 truncate dark:text-neutral-100">
          {size.name}
        </span>
      </div>

      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <Sheet.Trigger asChild>
          <button
            type="button"
            onClick={handleSheetTriggerClick}
            className="flex h-8 w-8 items-center justify-center rounded-none border border-transparent text-neutral-500 hover:border-neutral-200 hover:bg-neutral-100 hover:text-black dark:hover:border-neutral-800 dark:hover:bg-neutral-900 dark:hover:text-white shrink-0"
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
