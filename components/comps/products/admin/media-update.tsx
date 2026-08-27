'use client';

import { useCallback, useRef, useState, useEffect, useMemo } from 'react';
import { UploadCloud, X, Palette, ChevronDown, Check } from 'lucide-react';
import { useMediaUpload } from '@/hooks/use-media-upload';
import Image from 'next/image';
import { cn } from '@/lib/utils';

export type MediaItem = {
  id?: string; // Database ID for existing media
  url: string;
  key?: string; // Storage key or temporary identifier
  alt?: string;
  type?: 'image' | 'video';
  order: number;
  colorId?: string; // Database color ID or tempId
  isNew?: boolean; // Flag for backend diffing
};

export type ProductColorItem = {
  id?: string;
  tempId?: string;
  name: string;
  hexCode?: string;
};

type ProductMediaUploadProps = {
  productId: string;
  colors?: ProductColorItem[];
  value: MediaItem[];
  onChange: (media: MediaItem[]) => void;
  disabled?: boolean;
};

export function UpdateProductMediaUpload({
  productId,
  colors = [],
  value = [],
  onChange,
  disabled = false,
}: ProductMediaUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedColorForUpload, setSelectedColorForUpload] = useState<string>('');
  const [isBatchDropdownOpen, setIsBatchDropdownOpen] = useState(false);
  const [openCardDropdownKey, setOpenCardDropdownKey] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  // Helper to resolve canonical color key (id or tempId)
  const getColorKey = (color: ProductColorItem) => color.id || color.tempId || '';

  // Helper to resolve canonical media key (id, key, or fallback url)
  const getMediaKey = (media: MediaItem) => media.id || media.key || media.url;

  // Track valid color keys to detect orphaned media assignments
  const validColorKeys = useMemo(() => new Set(colors.map(getColorKey).filter(Boolean)), [colors]);

  // Auto-cleanup: if a color is removed, unbind its colorId on media items
  useEffect(() => {
    let hasChanges = false;
    const reconciled = value.map((m) => {
      if (m.colorId && !validColorKeys.has(m.colorId)) {
        hasChanges = true;
        return { ...m, colorId: undefined };
      }
      return m;
    });

    if (hasChanges) {
      onChange(reconciled);
    }
  }, [validColorKeys, value, onChange]);

  const { uploadFiles, progress } = useMediaUpload({
    productId,
    colorId: selectedColorForUpload || undefined,
    onUploaded: (media) => {
      onChange([
        ...value,
        {
          ...media,
          colorId: selectedColorForUpload || undefined,
          isNew: true,
        },
      ]);
    },
    folder: 'products',
  });

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files || files.length === 0 || disabled) return;
      uploadFiles(files, value.length);
    },
    [uploadFiles, value.length, disabled]
  );

  const removeMedia = (targetMedia: MediaItem) => {
    if (disabled) return;
    const targetKey = getMediaKey(targetMedia);
    onChange(value.filter((m) => getMediaKey(m) !== targetKey));
  };

  const updateMediaColor = (targetMedia: MediaItem, newColorId: string) => {
    const targetKey = getMediaKey(targetMedia);
    onChange(
      value.map((m) =>
        getMediaKey(m) === targetKey ? { ...m, colorId: newColorId || undefined } : m
      )
    );
    setOpenCardDropdownKey(null);
  };

  const getColorObj = (colorId?: string) => {
    if (!colorId) return null;
    return colors.find((c) => getColorKey(c) === colorId);
  };

  const activeUploads = Object.entries(progress);
  const batchSelectedColor = getColorObj(selectedColorForUpload);

  return (
    <div className="flex flex-col gap-4 font-archivo">
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
              disabled={disabled}
              onClick={() => {
                setIsBatchDropdownOpen(!isBatchDropdownOpen);
                setOpenCardDropdownKey(null);
              }}
              className="w-full flex items-center justify-between bg-white border border-neutral-300 py-1.5 px-2.5 text-xs text-black rounded-none hover:border-black transition-colors disabled:opacity-50"
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
                {colors.map((c) => {
                  const key = getColorKey(c);
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => {
                        setSelectedColorForUpload(key);
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
                      {selectedColorForUpload === key && <Check className="h-3 w-3 text-black" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Drag & Drop Box */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          handleFiles(e.dataTransfer.files);
        }}
        onClick={() => !disabled && inputRef.current?.click()}
        className={cn(
          'flex flex-col items-center justify-center gap-2 rounded-none border-2 border-dashed p-10 text-center transition-colors cursor-pointer',
          isDragging ? 'border-black bg-neutral-50' : 'border-neutral-300 hover:border-neutral-500',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        <UploadCloud className="h-6 w-6 text-neutral-500" />
        <p className="text-sm text-black">
          Drag & drop images or <span className="underline">browse</span>
        </p>
        <p className="text-xs text-neutral-500">JPG, PNG, WEBP, AVIF, MP4 — up to 15MB</p>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif,video/mp4"
          multiple
          disabled={disabled}
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

      {/* Uploaded Media Grid */}
      {value.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-3">
          {value
            .slice()
            .sort((a, b) => a.order - b.order)
            .map((media) => {
              const mediaKey = getMediaKey(media);
              const matchedColor = getColorObj(media.colorId);
              const isCardDropdownOpen = openCardDropdownKey === mediaKey;
              const isVideo = media.type === 'video' || media.url.toLowerCase().endsWith('.mp4');

              return (
                <div
                  key={mediaKey}
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
                        alt={media.alt || 'Product media'}
                        fill
                        sizes="(max-width: 768px) 100vw, 33vw"
                        className="object-cover"
                      />
                    )}

                    {/* Status badge */}
                    <div className="absolute left-1.5 top-1.5 z-10">
                      {media.id ? (
                        <span className="text-[9px] bg-black/70 text-white font-medium px-1.5 py-0.5 backdrop-blur-sm">
                          Saved
                        </span>
                      ) : (
                        <span className="text-[9px] bg-blue-600/90 text-white font-medium px-1.5 py-0.5 backdrop-blur-sm">
                          New
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      disabled={disabled}
                      onClick={() => removeMedia(media)}
                      aria-label="Remove media"
                      className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center bg-black text-white hover:bg-neutral-800 transition-colors z-10 disabled:opacity-50"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {/* Inline Color Assignment Dropdown */}
                  {colors.length > 0 && (
                    <div className="p-2 border-t border-neutral-200 bg-neutral-50 flex items-center justify-between gap-1.5 relative">
                      <span className="text-[10px] text-neutral-500 font-medium shrink-0">
                        Color:
                      </span>

                      <div className="relative w-full">
                        <button
                          type="button"
                          disabled={disabled}
                          onClick={() => {
                            setOpenCardDropdownKey(isCardDropdownOpen ? null : mediaKey);
                            setIsBatchDropdownOpen(false);
                          }}
                          className="w-full flex items-center justify-between bg-white border border-neutral-300 py-1 px-1.5 text-[10px] text-black truncate rounded-none hover:border-black transition-colors disabled:opacity-50"
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
                              onClick={() => updateMediaColor(media, '')}
                              className="w-full text-left px-2 py-1.5 text-[10px] text-neutral-700 hover:bg-neutral-100 flex items-center justify-between"
                            >
                              <span>General (None)</span>
                              {!media.colorId && <Check className="h-3 w-3 text-black" />}
                            </button>
                            {colors.map((c) => {
                              const key = getColorKey(c);
                              return (
                                <button
                                  key={key}
                                  type="button"
                                  onClick={() => updateMediaColor(media, key)}
                                  className="w-full text-left px-2 py-1.5 text-[10px] text-neutral-700 hover:bg-neutral-100 flex items-center justify-between"
                                >
                                  <span className="flex items-center gap-1.5 truncate">
                                    <span
                                      className="h-2 w-2 rounded-full border border-neutral-300 shrink-0"
                                      style={{ backgroundColor: c.hexCode ?? '#ccc' }}
                                    />
                                    {c.name}
                                  </span>
                                  {media.colorId === key && (
                                    <Check className="h-3 w-3 text-black" />
                                  )}
                                </button>
                              );
                            })}
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
