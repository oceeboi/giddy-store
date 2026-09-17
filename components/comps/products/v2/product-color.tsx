'use client';

import { useController, Control, FieldValues, Path } from 'react-hook-form';

export type ProductColor = {
  id: string;
  name: string;
  hexCode?: string | null;
  swatchImage?: string | null;
};

interface ProductColorSelectorProps<T extends FieldValues> {
  control: Control<T>;
  name: Path<T>;
  colors: ProductColor[];
  label?: string;
}

export function ProductColorSelector<T extends FieldValues>({
  control,
  name,
  colors = [],
  label = 'COLOR:',
}: ProductColorSelectorProps<T>) {
  const {
    field: { value, onChange },
  } = useController({ control, name });

  const selectedColorObj = colors.find((c) => c.id === value);
  const selectedColorName = selectedColorObj ? selectedColorObj.name : 'NONE SELECTED';

  if (!colors || colors.length === 0) return null;

  return (
    <div className="mb-6 flex select-none flex-col gap-2.5 font-archivo">
      {/* Label Row */}
      <div className="flex items-center gap-1.5 text-xs uppercase tracking-wider">
        <span className="font-semibold text-black">{label}</span>
        <span className="font-medium text-[#767676]">{selectedColorName}</span>
      </div>

      {/* Swatches Grid */}
      <div className="flex flex-wrap gap-2.5">
        {colors.map((color) => {
          const isSelected = value === color.id;
          const hex = color.hexCode || '#000000';
          const isWhite = hex.toLowerCase() === '#ffffff' || hex.toLowerCase() === '#fff';

          return (
            <button
              key={color.id}
              type="button"
              onClick={() => onChange(color.id)}
              aria-label={color.name}
              aria-pressed={isSelected}
              className={`group relative flex h-7 w-7 items-center justify-center rounded-none p-0.5 transition-all duration-150 focus-visible:outline focus-visible:outline-1 focus-visible:outline-black ${
                isSelected ? 'ring-1 ring-black ring-offset-2' : 'hover:opacity-80'
              }`}
            >
              {/* Inner Color Box */}
              <div
                className={`h-full w-full rounded-none transition-transform duration-150 group-active:scale-95 ${
                  isWhite ? 'border border-gray-200' : ''
                }`}
                style={{
                  backgroundColor: hex,
                  ...(color.swatchImage
                    ? {
                        backgroundImage: `url(${color.swatchImage})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                      }
                    : {}),
                }}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
