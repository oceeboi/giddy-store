'use client';

import { useState } from 'react';
import { Input } from '@/components/shared/form';
import { cn } from '@/lib/utils';
import { Plus, Trash2, Palette } from 'lucide-react';
type ProductColorItem = {
  tempId: string;
  name: string;
  hexCode?: string;
  swatchImage?: string | null | unknown;
};
type ColorPickerManagerProps = {
  value: ProductColorItem[];
  onChange: (nextValues: ProductColorItem[]) => void;
  disabled?: boolean;
  hasError?: boolean;
};

export function ColorPickerManager({
  value = [],
  onChange,
  disabled = false,
  hasError = false,
}: ColorPickerManagerProps) {
  const [nameInput, setNameInput] = useState('');
  const [hexInput, setHexInput] = useState('#000000');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const addColor = () => {
    const trimmedName = nameInput.trim();
    if (!trimmedName) {
      setErrorMessage('Color name is required.');
      return;
    }

    // Validate hex code format if provided
    const hexRegex = /^#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})$/;
    const cleanHex = hexInput.trim();
    if (cleanHex && !hexRegex.test(cleanHex)) {
      setErrorMessage('Invalid hex code format (e.g., #FFFFFF).');
      return;
    }

    // Prevent duplicate color names
    if (value.some((c) => c.name.toLowerCase() === trimmedName.toLowerCase())) {
      setErrorMessage('This color name already exists.');
      return;
    }

    const newColor: ProductColorItem = {
      tempId: crypto.randomUUID(), // Generates the required tempId
      name: trimmedName,
      hexCode: cleanHex || undefined,
      swatchImage: null,
    };

    onChange([...value, newColor]);
    setNameInput('');
    setHexInput('#000000');
    setErrorMessage(null);
  };

  const removeColor = (tempId: string) => {
    if (disabled) return;
    onChange(value.filter((color) => color.tempId !== tempId));
  };

  return (
    <div className={cn('flex flex-col gap-3 w-full')}>
      {/* Visual Color Badges List */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2 p-3 border border-neutral-200 bg-neutral-50/50">
          {value.map((color) => (
            <div
              key={color.tempId}
              className="inline-flex items-center gap-2 bg-white border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-900 shadow-sm"
            >
              {/* Live Color Preview Circle */}
              <span
                className="h-3.5 w-3.5 rounded-full border border-neutral-300 shrink-0"
                style={{ backgroundColor: color.hexCode ?? '#cccccc' }}
              />
              <span>{color.name}</span>
              {color.hexCode && (
                <span className="text-neutral-400 font-mono text-[10px]">({color.hexCode})</span>
              )}
              <button
                type="button"
                disabled={disabled}
                onClick={() => removeColor(color.tempId)}
                className="ml-1 text-neutral-400 hover:text-red-600 transition-colors focus:outline-none"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input Group to Add New Colors */}
      <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
        {/* Color Hex Picker box */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <input
            type="color"
            value={hexInput}
            disabled={disabled}
            onChange={(e) => setHexInput(e.target.value)}
            className="h-10 w-10 cursor-pointer border border-neutral-300 bg-white p-1 disabled:opacity-50 rounded-none"
          />
          <Input
            type="text"
            placeholder="Color Name (e.g. Midnight Black)"
            value={nameInput}
            onChange={(e) => {
              setNameInput(e.target.value);
              if (errorMessage) setErrorMessage(null);
            }}
            disabled={disabled}
            hasError={hasError || !!errorMessage}
            className="w-full sm:w-64 rounded-none"
          />
        </div>

        <button
          type="button"
          disabled={disabled}
          onClick={addColor}
          className="inline-flex items-center justify-center gap-1.5 bg-black text-white px-4 py-2.5 text-xs font-semibold uppercase tracking-wider hover:bg-neutral-900 transition-colors disabled:opacity-50 w-full sm:w-auto"
        >
          <Plus className="h-4 w-4" />
          Add Color
        </button>
      </div>

      {/* Error Feedback */}
      {(errorMessage || hasError) && (
        <p className="text-xs text-red-600 font-medium">
          {errorMessage ?? 'Please check color inputs.'}
        </p>
      )}
      <span className="text-[11px] text-neutral-500">
        Add individual product color options. Each will receive a unique temporary ID (`tempId`) for
        your variant matrix.
      </span>
    </div>
  );
}
