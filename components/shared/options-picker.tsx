'use client';

import { useMemo, useRef, useState } from 'react';
import { useOnClickOutside } from '@/hooks/use-on-click-outside';
import { cn } from '@/lib/utils';
import { Check, ChevronDown, X } from 'lucide-react';

export type ProductOption = {
  id: string;
  value: string;
  label: string;
  description?: string | undefined;
};

type OptionPickerProps = {
  value: string | string[];
  options: ProductOption[];
  placeholder: string;
  disabled?: boolean;
  onChange: (nextValue: string | string[]) => void;
  multiple?: boolean;
  className?: string;
};

function normalizeToArray(value: string | string[]): string[] {
  return Array.isArray(value) ? value : value ? [value] : [];
}

export function OptionPicker({
  value,
  options,
  placeholder,
  disabled = false,
  onChange,
  multiple = false,
  className,
}: OptionPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const panelRef = useRef<HTMLDivElement | null>(null);

  useOnClickOutside(panelRef, () => setOpen(false));

  const selectedValues = normalizeToArray(value);
  const selectedMap = useMemo(() => new Set(selectedValues), [selectedValues]);

  const visibleOptions = useMemo(() => {
    const trimmed = search.trim().toLowerCase();
    if (!trimmed) return options;

    return options.filter((option) => {
      const target = `${option.label} ${option.description ?? ''}`.toLowerCase();
      return target.includes(trimmed);
    });
  }, [options, search]);

  const triggerText = useMemo(() => {
    if (selectedValues.length === 0) return placeholder;

    if (!multiple) {
      const first = options.find((option) => option.id === selectedValues[0]);
      return first?.label ?? placeholder;
    }

    if (selectedValues.length === 1) {
      const first = options.find((option) => option.id === selectedValues[0]);
      return first?.label ?? placeholder;
    }

    return `${selectedValues.length} collections selected`;
  }, [multiple, options, placeholder, selectedValues]);

  function selectSingle(nextId: string) {
    onChange(nextId);
    setOpen(false);
    setSearch('');
  }

  function toggleMulti(nextId: string) {
    const nextSet = new Set(selectedValues);

    if (nextSet.has(nextId)) {
      nextSet.delete(nextId);
    } else {
      nextSet.add(nextId);
    }

    onChange(Array.from(nextSet));
  }

  return (
    <div ref={panelRef} className={cn('relative w-full', className)}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((current) => !current)}
        className={cn(
          'flex w-full items-center justify-between border border-gray-200 bg-white px-4 py-3 text-left text-sm text-gray-900 outline-none transition-all',
          'focus:border-black focus:ring-2 focus:ring-black/30',
          disabled ? 'cursor-not-allowed opacity-60' : 'hover:border-gray-300'
        )}
      >
        <span
          className={selectedValues.length === 0 ? 'text-gray-400' : 'text-gray-900 font-medium'}
        >
          {triggerText}
        </span>
        <ChevronDown
          className={`h-4 w-4 text-[#5f6570] transition-transform duration-200 ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>

      {open && (
        <div className="absolute left-0 right-0 z-50 mt-2 border border-neutral-200 bg-white p-2 shadow-lg">
          <InputSearch value={search} onChange={setSearch} />

          <div className="mt-2 max-h-56 overflow-y-auto border border-neutral-100">
            {visibleOptions.length === 0 ? (
              <p className="px-3 py-3 text-center text-sm text-neutral-500">No options found.</p>
            ) : (
              visibleOptions.map((option) => {
                const selected = selectedMap.has(option.id);

                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => (multiple ? toggleMulti(option.id) : selectSingle(option.id))}
                    className={cn(
                      'flex w-full items-center gap-2.5 border-b border-neutral-100 px-3 py-2.5 text-left last:border-b-0 hover:bg-neutral-50 transition-colors',
                      selected && 'bg-neutral-50/80'
                    )}
                  >
                    <span
                      className={cn(
                        'inline-flex h-4 w-4 shrink-0 items-center justify-center border text-[10px] transition-all',
                        selected
                          ? 'border-neutral-900 bg-neutral-900 text-white'
                          : 'border-neutral-300 bg-white text-transparent'
                      )}
                    >
                      <Check className="h-3 w-3 stroke-[3]" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-neutral-900">
                        {option.label}
                      </span>
                      {option.description ? (
                        <span className="block truncate text-xs text-neutral-500">
                          {option.description}
                        </span>
                      ) : null}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function InputSearch({ value, onChange }: { value: string; onChange: (next: string) => void }) {
  return (
    <input
      type="text"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder="Search collections..."
      className="w-full border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-black focus:ring-2 focus:ring-black/30"
    />
  );
}
