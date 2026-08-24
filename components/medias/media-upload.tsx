'use client';

import { useCallback, useRef, useState, useEffect } from 'react';
import { UploadCloud, X, RefreshCw, Image as ImageIcon } from 'lucide-react';
import { useMediaUpload } from '@/hooks/use-media-upload';
import Image from 'next/image';
import { cn } from '@/lib/utils';

type SingleMediaUploadProps = {
  productId: string;
  folder?: string;
  value: string; // Accepts single URL string
  onChange: (url: string) => void;
  className?: string;
};

export function SingleMediaUpload({
  productId,
  folder = 'general',
  value,
  onChange,
  className,
}: SingleMediaUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const { uploadFiles, progress } = useMediaUpload({
    productId,
    onUploaded: (media) => {
      // Returns single media object, update state with its URL
      onChange(media.url);
    },
    folder,
  });

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files || files.length === 0) return;
      // Pass single file to hook
      uploadFiles(files, 0);
    },
    [uploadFiles]
  );

  function handleRemove() {
    onChange('');
    if (inputRef.current) inputRef.current.value = '';
  }

  // Active uploads calculation for single file
  const activeUploads = Object.entries(progress);
  const currentProgress = activeUploads.length > 0 ? activeUploads[0][1] : 0;
  const isUploading = activeUploads.length > 0;

  return (
    <div className={cn('w-full max-w-sm flex flex-col gap-2', className)}>
      {/* Hidden File Input */}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif"
        hidden
        onChange={(e) => handleFiles(e.target.files)}
      />

      {value ? (
        /* Preview Card State */
        <div className="relative aspect-square w-full border border-neutral-200 bg-white overflow-hidden group">
          <Image
            src={value}
            alt="Uploaded image"
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />

          {/* Action Overlay */}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 z-10">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="flex items-center gap-1 px-3 py-1.5 bg-white text-black text-xs font-medium hover:bg-neutral-100 transition-colors shadow"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Replace
            </button>
            <button
              type="button"
              onClick={handleRemove}
              aria-label="Remove image"
              className="flex items-center gap-1 px-3 py-1.5 bg-black text-white text-xs font-medium hover:bg-neutral-800 transition-colors shadow"
            >
              <X className="h-3.5 w-3.5" />
              Remove
            </button>
          </div>
        </div>
      ) : (
        /* Upload Card / Dropzone State */
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
          onClick={() => !isUploading && inputRef.current?.click()}
          className={cn(
            'relative aspect-square w-full flex flex-col items-center justify-center gap-2 border-2 border-dashed p-6 text-center transition-colors cursor-pointer bg-neutral-50/50',
            isDragging
              ? 'border-black bg-neutral-100'
              : 'border-neutral-300 hover:border-neutral-500',
            isUploading && 'pointer-events-none opacity-80'
          )}
        >
          {isUploading ? (
            <div className="flex flex-col items-center gap-3 w-full px-4">
              <div className="h-10 w-10 rounded-full border-2 border-neutral-200 border-t-black animate-spin" />
              <div className="w-full space-y-1">
                <p className="text-xs text-neutral-600 font-medium">
                  Uploading... {currentProgress}%
                </p>
                <div className="h-1 w-full bg-neutral-200">
                  <div
                    className="h-full bg-black transition-all duration-200"
                    style={{ width: `${currentProgress}%` }}
                  />
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="p-3 bg-white border border-neutral-200 rounded-full shadow-sm">
                <UploadCloud className="h-5 w-5 text-neutral-600" />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold text-black">Upload Image</p>
                <p className="text-[11px] text-neutral-500">
                  Drag & drop or <span className="underline">browse</span>
                </p>
              </div>
              <p className="text-[10px] text-neutral-400 mt-2">JPG, PNG, WEBP, AVIF — up to 15MB</p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
