'use client';

import Image from 'next/image';
import { useState, MouseEvent } from 'react';
import { CollectionData } from '@/types/shared/catalog';
import { Sheet } from '@/components/shared';
import { MoreVertical } from 'lucide-react';
import { CollectionUpdate } from './collection-update';

type CollectionRowCardProps = {
  collection: CollectionData;
  onClick?: (collection: CollectionData) => void;
};

export function CollectionRowCard({ collection, onClick }: CollectionRowCardProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleCardClick = () => {
    if (onClick) onClick(collection);
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
      className="group relative flex w-full cursor-pointer flex-col gap-3 border border-neutral-200 bg-white p-4 transition-colors hover:border-black dark:border-neutral-800 dark:bg-neutral-950 dark:hover:border-neutral-100"
    >
      {/* Header: Image, Name, Status & Action Sheet */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative h-10 w-10 shrink-0 overflow-hidden border border-neutral-200 bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900">
            {collection.image ? (
              <Image
                src={collection.image}
                alt={collection.name}
                fill
                className="object-cover p-1"
                sizes="40px"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center font-archivo text-[10px] uppercase text-neutral-400">
                {collection.name.slice(0, 2)}
              </div>
            )}
          </div>

          <div className="flex flex-col min-w-0">
            <span className="font-archivo text-sm font-semibold uppercase tracking-tight text-neutral-900 truncate dark:text-neutral-100">
              {collection.name}
            </span>
            <span className="font-mono text-[11px] text-neutral-500 truncate">
              {collection.slug}
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 shrink-0">
          <span
            className={`font-archivo inline-flex items-center px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
              collection.active
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400'
            }`}
          >
            {collection.active ? 'Active' : 'Inactive'}
          </span>

          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <Sheet.Trigger asChild>
              <button
                type="button"
                onClick={handleSheetTriggerClick}
                className="flex h-8 w-8 items-center justify-center rounded-none border border-transparent text-neutral-500 hover:border-neutral-200 hover:bg-neutral-100 hover:text-black dark:hover:border-neutral-800 dark:hover:bg-neutral-900 dark:hover:text-white"
                aria-label="Edit collection"
              >
                <MoreVertical className="h-4 w-4" />
              </button>
            </Sheet.Trigger>

            <Sheet.Content
              side="right"
              size="lg"
              className="h-full bg-white p-0 dark:bg-neutral-950"
            >
              <Sheet.Header className="border-b border-neutral-200 p-6 dark:border-neutral-800">
                <Sheet.Title>
                  <span className="font-archivo text-base font-bold uppercase tracking-wider text-black dark:text-white">
                    Update Collection
                  </span>
                </Sheet.Title>
              </Sheet.Header>

              <div className="p-6 overflow-y-auto max-h-[calc(100vh-80px)]">
                <CollectionUpdate id={collection.id} setValue={() => setIsOpen(false)} />
              </div>
            </Sheet.Content>
          </Sheet>
        </div>
      </div>

      {/* Description / Summary */}
      {collection.description && (
        <p className="font-archivo text-xs text-neutral-600 dark:text-neutral-400 line-clamp-2">
          {collection.description}
        </p>
      )}
    </div>
  );
}
