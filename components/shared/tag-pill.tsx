'use client';

import { useState, KeyboardEvent } from 'react';
import { Input } from '@/components/shared/form';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

type TagPillInputProps = {
  value: string[];
  onChange: (nextValues: string[]) => void;
  disabled?: boolean;
  placeholder?: string;
  hasError?: boolean;
  footer_label?: string;
};

export function TagPillInput({
  value = [],
  onChange,
  disabled = false,
  placeholder = 'Type feature and press Enter or comma...',
  hasError = false,
  footer_label = 'feature tag',
}: TagPillInputProps) {
  const [inputValue, setInputValue] = useState('');

  // Handle adding tags via Enter, Comma, or Tab
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',' || e.key === 'Tab') {
      e.preventDefault();
      addTag(inputValue);
    }
  };

  const addTag = (rawText: string) => {
    const cleaned = rawText.trim().replace(/^,+|,+$/g, ''); // strip trailing/leading commas
    if (!cleaned) return;

    // Split by commas just in case they pasted a whole comma-separated sentence
    const newItems = cleaned
      .split(',')
      .map((item) => item.trim())
      .filter((item) => item.length > 0 && !value.includes(item)); // Prevent duplicates

    if (newItems.length > 0) {
      onChange([...value, ...newItems]);
      setInputValue('');
    }
  };

  const removeTag = (indexToRemove: number) => {
    if (disabled) return;
    onChange(value.filter((_, index) => index !== indexToRemove));
  };

  return (
    <div className={cn('flex flex-col gap-2 w-full')}>
      {/* Visual Chips Container */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5 p-2 border border-neutral-200 bg-neutral-50/50">
          {value.map((tag, index) => (
            <span
              key={`${tag}-${index}`}
              className="inline-flex items-center gap-1.5 bg-black text-white text-xs px-2.5 py-1 font-medium"
            >
              {tag}
              <button
                type="button"
                disabled={disabled}
                onClick={() => removeTag(index)}
                className="text-neutral-400 hover:text-white transition-colors focus:outline-none"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Input Box */}
      <Input
        type="text"
        placeholder={value.length === 0 ? placeholder : 'Add another...'}
        value={inputValue}
        onChange={(e) => {
          // If they type a comma directly into the input, auto-convert immediately
          if (e.target.value.includes(',')) {
            addTag(e.target.value);
          } else {
            setInputValue(e.target.value);
          }
        }}
        onKeyDown={handleKeyDown}
        onBlur={() => {
          if (inputValue.trim()) {
            addTag(inputValue);
          }
        }}
        hasError={hasError}
        disabled={disabled}
        className="rounded-none"
      />
      <span className="text-[11px] text-neutral-500">
        Press <kbd className="px-1 py-0.5 bg-neutral-100 border border-neutral-200 ">Enter</kbd> or
        type a comma to add a {footer_label}.
      </span>
    </div>
  );
}
