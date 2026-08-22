'use client';

import { useCallback, useRef, useState, useEffect } from 'react';
import { UploadCloud, X, Palette, ChevronDown, Check } from 'lucide-react';
import { useMediaUpload } from '@/hooks/use-media-upload';
import Image from 'next/image';
import { cn } from '@/lib/utils';

type MediaItem = {
  url: string;
  key: string;
  alt: string;
  type: 'image' | 'video';
  order: number;
  colorId?: string;
};

type ProductColorItem = {
  tempId: string;
  name: string;
  hexCode?: string;
};

type ProductMediaUploadProps = {
  productId: string;
  colors?: ProductColorItem[];
  value: MediaItem[];
  onChange: (media: MediaItem[]) => void;
};

export function ProductMediaUpload({
  productId,
  colors = [],
  value,
  onChange,
}: ProductMediaUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedColorForUpload, setSelectedColorForUpload] = useState<string>('');
  const [isBatchDropdownOpen, setIsBatchDropdownOpen] = useState(false);
  const [openCardDropdownKey, setOpenCardDropdownKey] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  const { uploadFiles, progress } = useMediaUpload({
    productId,
    colorId: selectedColorForUpload || undefined,
    onUploaded: (media) => {
      onChange([...value, { ...media, colorId: selectedColorForUpload || undefined }]);
    },
  });

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files || files.length === 0) return;
      uploadFiles(files, value.length);
    },
    [uploadFiles, value.length]
  );

  function removeMedia(key: string) {
    onChange(value.filter((m) => m.key !== key));
  }

  function updateMediaColor(key: string, newColorId: string) {
    onChange(value.map((m) => (m.key === key ? { ...m, colorId: newColorId || undefined } : m)));
    setOpenCardDropdownKey(null);
  }

  const activeUploads = Object.entries(progress);
  const batchSelectedColor = colors.find((c) => c.tempId === selectedColorForUpload);

  return (
    <div className="flex flex-col gap-4">
      {/* Universal Custom Dropdown for Batch Upload Color Association */}
      {colors.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 p-3 border border-neutral-200 bg-neutral-50/50 relative">
          <div className="flex items-center gap-2">
            <Palette className="h-4 w-4 text-neutral-500 shrink-0" />
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-700">
              Assign next uploads to color:
            </span>
          </div>

          <div className="relative w-full sm:w-64">
            <button
              type="button"
              onClick={() => {
                setIsBatchDropdownOpen(!isBatchDropdownOpen);
                setOpenCardDropdownKey(null);
              }}
              className="w-full flex items-center justify-between bg-white border border-neutral-300 py-1.5 px-2.5 text-xs text-black rounded-none hover:border-black transition-colors"
            >
              <span className="truncate flex items-center gap-2">
                {batchSelectedColor ? (
                  <>
                    <span
                      className="h-2.5 w-2.5 rounded-full border border-neutral-300 shrink-0"
                      style={{ backgroundColor: batchSelectedColor.hexCode ?? '#ccc' }}
                    />
                    {batchSelectedColor.name}
                  </>
                ) : (
                  'General Product Media (None)'
                )}
              </span>
              <ChevronDown className="h-3.5 w-3.5 text-neutral-500 shrink-0" />
            </button>

            {isBatchDropdownOpen && (
              <div className="absolute left-0 top-full mt-1 w-full bg-white border border-neutral-300 shadow-md z-20 max-h-48 overflow-y-auto">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedColorForUpload('');
                    setIsBatchDropdownOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 text-xs text-neutral-700 hover:bg-neutral-100 flex items-center justify-between"
                >
                  <span>General Product Media (None)</span>
                  {!selectedColorForUpload && <Check className="h-3 w-3 text-black" />}
                </button>
                {colors.map((c) => (
                  <button
                    key={c.tempId}
                    type="button"
                    onClick={() => {
                      setSelectedColorForUpload(c.tempId);
                      setIsBatchDropdownOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 text-xs text-neutral-700 hover:bg-neutral-100 flex items-center justify-between"
                  >
                    <span className="flex items-center gap-2 truncate">
                      <span
                        className="h-2.5 w-2.5 rounded-full border border-neutral-300 shrink-0"
                        style={{ backgroundColor: c.hexCode ?? '#ccc' }}
                      />
                      {c.name}
                    </span>
                    {selectedColorForUpload === c.tempId && (
                      <Check className="h-3 w-3 text-black" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Drag & Drop Box */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          handleFiles(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        className={cn(
          'flex flex-col items-center justify-center gap-2 rounded-none border-2 border-dashed p-10 text-center transition-colors cursor-pointer',
          isDragging ? 'border-black bg-neutral-50' : 'border-neutral-300 hover:border-neutral-500'
        )}
      >
        <UploadCloud className="h-6 w-6 text-neutral-500" />
        <p className="font-archivo text-sm text-black">
          Drag & drop images or <span className="underline">browse</span>
        </p>
        <p className="font-archivo text-xs text-neutral-500">
          JPG, PNG, WEBP, AVIF, MP4 — up to 15MB
        </p>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif,video/mp4"
          multiple
          hidden
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {activeUploads.length > 0 && (
        <div className="flex flex-col gap-1">
          {activeUploads.map(([id, percent]) => (
            <div key={id} className="h-1 w-full bg-neutral-200">
              <div className="h-full bg-black transition-all" style={{ width: `${percent}%` }} />
            </div>
          ))}
        </div>
      )}

      {/* Uploaded Media Grid with Universal Custom Dropdown & Video Support */}
      {value.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {value
            .sort((a, b) => a.order - b.order)
            .map((media) => {
              const matchedColor = colors.find((c) => c.tempId === media.colorId);
              const isCardDropdownOpen = openCardDropdownKey === media.key;
              const isVideo = media.type === 'video' || media.url.toLowerCase().endsWith('.mp4');

              return (
                <div
                  key={media.key}
                  className="flex flex-col border border-neutral-200 bg-white relative"
                >
                  <div className="relative aspect-square w-full bg-neutral-900">
                    {isVideo ? (
                      <video
                        src={media.url}
                        controls
                        playsInline
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      <Image
                        src={media.url}
                        alt={media.alt}
                        fill
                        sizes="(max-width: 768px) 100vw, 33vw"
                        className="object-cover"
                      />
                    )}
                    <button
                      type="button"
                      onClick={() => removeMedia(media.key)}
                      aria-label="Remove media"
                      className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center bg-black text-white hover:bg-neutral-800 transition-colors z-10"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {/* Inline Universal Custom Dropdown */}
                  {colors.length > 0 && (
                    <div className="p-2 border-t border-neutral-200 bg-neutral-50 flex items-center justify-between gap-1.5 relative">
                      <span className="text-[10px] text-neutral-500 font-medium shrink-0">
                        Color:
                      </span>

                      <div className="relative w-full">
                        <button
                          type="button"
                          onClick={() => {
                            setOpenCardDropdownKey(isCardDropdownOpen ? null : media.key);
                            setIsBatchDropdownOpen(false);
                          }}
                          className="w-full flex items-center justify-between bg-white border border-neutral-300 py-1 px-1.5 text-[10px] text-black truncate rounded-none hover:border-black transition-colors"
                        >
                          <span className="truncate flex items-center gap-1.5">
                            {matchedColor ? (
                              <>
                                <span
                                  className="h-2 w-2 rounded-full border border-neutral-300 shrink-0"
                                  style={{ backgroundColor: matchedColor.hexCode ?? '#ccc' }}
                                />
                                {matchedColor.name}
                              </>
                            ) : (
                              'General (None)'
                            )}
                          </span>
                          <ChevronDown className="h-3 w-3 text-neutral-400 shrink-0 ml-1" />
                        </button>

                        {isCardDropdownOpen && (
                          <div className="absolute left-0 bottom-full mb-1 w-full bg-white border border-neutral-300 shadow-lg z-30 max-h-40 overflow-y-auto">
                            <button
                              type="button"
                              onClick={() => updateMediaColor(media.key, '')}
                              className="w-full text-left px-2 py-1.5 text-[10px] text-neutral-700 hover:bg-neutral-100 flex items-center justify-between"
                            >
                              <span>General (None)</span>
                              {!media.colorId && <Check className="h-3 w-3 text-black" />}
                            </button>
                            {colors.map((c) => (
                              <button
                                key={c.tempId}
                                type="button"
                                onClick={() => updateMediaColor(media.key, c.tempId)}
                                className="w-full text-left px-2 py-1.5 text-[10px] text-neutral-700 hover:bg-neutral-100 flex items-center justify-between"
                              >
                                <span className="flex items-center gap-1.5 truncate">
                                  <span
                                    className="h-2 w-2 rounded-full border border-neutral-300 shrink-0"
                                    style={{ backgroundColor: c.hexCode ?? '#ccc' }}
                                  />
                                  {c.name}
                                </span>
                                {media.colorId === c.tempId && (
                                  <Check className="h-3 w-3 text-black" />
                                )}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
}
