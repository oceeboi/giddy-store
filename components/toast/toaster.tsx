'use client';

import { createPortal } from 'react-dom';
import { useEffect, useState } from 'react';
import { useToastContext } from './toast-context';
import { ToastItem } from './toast-item';
import { cn } from '@/lib/utils';

const POSITION_CLASSES: Record<string, string> = {
  'top-right': 'top-4 right-4 items-end',
  'top-left': 'top-4 left-4 items-start',
  'top-center': 'top-4 left-1/2 -translate-x-1/2 items-center',
  'bottom-right': 'bottom-4 right-4 items-end',
  'bottom-left': 'bottom-4 left-4 items-start',
  'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2 items-center',
};

export function Toaster() {
  const { toasts, config } = useToastContext();
  const [mounted, setMounted] = useState(false);

  // Avoid SSR/hydration mismatch — document.body doesn't exist on the server.
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  const visible = toasts.slice(0, config.maxVisible);
  const overflowCount = toasts.length - visible.length;

  return createPortal(
    <div
      className={cn(
        'pointer-events-none fixed z-100 flex w-full max-w-sm flex-col gap-2 p-4 sm:p-0',
        POSITION_CLASSES[config.position]
      )}
      style={{ position: 'fixed' }}
    >
      <style>{`
        @keyframes toast-progress {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>

      {visible.map((toast) => (
        <div key={toast.id} className="relative w-full">
          <ToastItem toast={toast} />
        </div>
      ))}

      {overflowCount > 0 && (
        <p className="pointer-events-none font-archivo text-[10px] uppercase tracking-wider text-neutral-500">
          +{overflowCount} more
        </p>
      )}
    </div>,
    document.body
  );
}
