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
  colors,
  label = 'color:',
}: ProductColorSelectorProps<T>) {
  const {
    field: { value, onChange },
  } = useController({ control, name });

  const selectedColorObj = colors.find((c) => c.id === value);
  const selectedColorName = selectedColorObj ? selectedColorObj.name : 'None selected';

  return (
    <div className="flex flex-col gap-2 mb-6 select-none">
      <div className="flex flex-row gap-1 items-center">
        <h3 className="text-base items-start uppercase font-medium text-black font-archivo tracking-tight">
          {label}
        </h3>
        <h3 className="text-base items-start uppercase text-[#8B8B8B] font-archivo font-normal tracking-tight">
          {selectedColorName}
        </h3>
      </div>

      <div className="flex gap-3 flex-wrap">
        {colors.map((color) => {
          const isSelected = value === color.id;
          const hex = color.hexCode || '#000000';

          return (
            <button
              key={color.id}
              type="button"
              onClick={() => onChange(color.id)}
              aria-label={color.name}
              aria-pressed={isSelected}
              style={{ borderColor: isSelected ? '#000000' : hex }}
              className={`relative flex items-center justify-center p-px w-7 h-7 rounded-none transition-all duration-200 ease-in-out ${
                isSelected ? 'border-2' : 'border hover:border-neutral-700'
              } focus-visible:outline focus-visible:outline-black focus-visible:outline-offset-2`}
            >
              <div
                className="w-full h-full rounded-none"
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
