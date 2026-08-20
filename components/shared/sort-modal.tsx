'use client';

import { cn } from '@/lib/utils';
import { Check, X } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
type SortType = 'newest' | 'oldest' | 'price_asc' | 'price_desc' | 'name_asc' | 'name_desc';
const SORT_DATA_TYPE: Record<SortType, string> = {
  newest: 'Newest Arrivals',
  oldest: 'Oldest First',
  price_asc: 'Price: Low to High',
  price_desc: 'Price: High to Low',
  name_asc: 'Name: A to Z',
  name_desc: 'Name: Z to A',
};

type GridColumnType = 1 | 2 | 3 | 4;

const GRID_STORAGE_KEY = 'catalog_grid_cols';

const SORT_TYPES = Object.keys(SORT_DATA_TYPE) as SortType[];

interface SortModalProps {
  open: boolean;
  onClose: () => void;
  selectedSort: SortType;
  onSelect: (type: SortType) => void;
}

export function SortModal({ open, onClose, selectedSort, onSelect }: SortModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  // Lock background scroll + restore focus to the trigger on close
  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeBtnRef.current?.focus();

    return () => {
      document.body.style.overflow = originalOverflow;
      previouslyFocused?.focus?.();
    };
  }, [open]);

  // Escape to close + basic focus trap (Tab wraps within the panel)
  useEffect(() => {
    if (!open) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (e.key === 'Tab' && panelRef.current) {
        const focusable = panelRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200"
      onMouseDown={(e) => {
        // Close only on true backdrop clicks, not drags that end outside the panel
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="sort-modal-title"
        className="w-full max-w-md bg-white border border-gray-100 rounded-none shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-2 duration-200"
      >
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <p id="sort-modal-title" className="text-base font-archivo-black text-black">
            Sort by
          </p>
          <button
            ref={closeBtnRef}
            type="button"
            onClick={onClose}
            aria-label="Close sort options"
            className="flex items-center justify-center w-8 h-8 text-gray-600 rounded-none bg-gray-100 transition-colors hover:bg-gray-200 focus-visible:outline focus-visible:outline-black focus-visible:outline-offset-2"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="py-2" role="radiogroup" aria-labelledby="sort-modal-title">
          {SORT_TYPES.map((type) => {
            const isActive = type === selectedSort;
            return (
              <button
                key={type}
                type="button"
                role="radio"
                aria-checked={isActive}
                onClick={() => {
                  onSelect(type);
                  onClose();
                }}
                className={cn(
                  'flex w-full items-center justify-between px-6 py-3.5 text-left text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-black focus-visible:-outline-offset-2',
                  isActive
                    ? 'bg-gray-100 text-black font-archivo-black'
                    : 'text-gray-700 hover:bg-gray-50 font-archivo'
                )}
              >
                <span>{SORT_DATA_TYPE[type]}</span>
                {isActive && <Check className="w-4 h-4 text-black" />}
              </button>
            );
          })}
        </div>
      </div>
    </div>,
    document.body
  );
}
