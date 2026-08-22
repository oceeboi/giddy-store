'use client';

import { useState, useCallback } from 'react';
import { toast } from '@/components/toast/toast'; // the toaster we built earlier

type UploadedMedia = {
  url: string;
  key: string;
  alt: string;
  type: 'image' | 'video';
  order: number;
  colorId?: string;
};

type UseMediaUploadOptions = {
  productId: string;
  colorId?: string;
  onUploaded?: (media: UploadedMedia) => void;
};

export function useMediaUpload({ productId, colorId, onUploaded }: UseMediaUploadOptions) {
  const [progress, setProgress] = useState<Record<string, number>>({});
  const [isUploading, setIsUploading] = useState(false);

  const uploadFile = useCallback(
    async (file: File, order: number) => {
      const localId = `${file.name}-${Date.now()}`;
      setIsUploading(true);
      setProgress((p) => ({ ...p, [localId]: 0 }));

      try {
        // 1. Ask our server for a presigned URL
        const presignRes = await fetch('/api/uploads/presign', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileName: file.name,
            fileType: file.type,
            fileSize: file.size,
            productId,
            colorId,
          }),
        });

        const presignData = await presignRes.json();
        if (!presignRes.ok || !presignData.ok) {
          throw new Error(presignData.error ?? 'Failed to get upload URL');
        }

        const { uploadUrl, publicUrl, key } = presignData;

        // 2. Upload directly to S3 with progress tracking via XHR
        // (fetch doesn't expose upload progress events — XHR still does)
        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open('PUT', uploadUrl);
          xhr.setRequestHeader('Content-Type', file.type);

          xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
              const percent = Math.round((event.loaded / event.total) * 100);
              setProgress((p) => ({ ...p, [localId]: percent }));
            }
          };

          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) resolve();
            else reject(new Error(`S3 upload failed with status ${xhr.status}`));
          };
          xhr.onerror = () => reject(new Error('Network error during upload'));
          xhr.send(file);
        });

        const media: UploadedMedia = {
          url: publicUrl,
          key,
          alt: file.name.replace(/\.[^/.]+$/, ''),
          type: file.type.startsWith('video') ? 'video' : 'image',
          order,
          colorId,
        };

        onUploaded?.(media);
        return media;
      } finally {
        setIsUploading(false);
        setProgress((p) => {
          const next = { ...p };
          delete next[localId];
          return next;
        });
      }
    },
    [productId, colorId, onUploaded]
  );

  const uploadFiles = useCallback(
    async (files: FileList | File[], startOrder = 0) => {
      const fileArray = Array.from(files);
      return toast.promise(
        Promise.all(fileArray.map((file, i) => uploadFile(file, startOrder + i))),
        {
          pending: `Uploading ${fileArray.length} file${fileArray.length > 1 ? 's' : ''}…`,
          success: (results) => `${results.length} file${results.length > 1 ? 's' : ''} uploaded`,
          error: 'Upload failed',
        }
      );
    },
    [uploadFile]
  );

  return { uploadFiles, uploadFile, progress, isUploading };
}
