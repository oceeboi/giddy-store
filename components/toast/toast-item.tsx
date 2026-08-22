'use client';

import { AlertCircle, CheckCircle2, Loader2, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Toast, useToastContext } from './toast-context';
import { cn } from '@/lib/utils';

const ICONS: Record<Toast['type'], typeof CheckCircle2> = {
  pending: Loader2,
  success: CheckCircle2,
  error: AlertCircle,
  info: AlertCircle,
};

export function ToastItem({ toast }: { toast: Toast }) {
  const { remove, pause, resume } = useToastContext();
  const [isExiting, setIsExiting] = useState(false);
  const Icon = ICONS[toast.type];

  function handleManualClose() {
    setIsExiting(true);
    // let the exit transition play before unmounting from state
    setTimeout(() => remove(toast.id, 'manual'), 180);
  }

  // Re-trigger the exit animation whenever the toast is removed by the
  // timer/promise path too, not just manual close, so every removal is
  // visually consistent instead of only the X-button path animating out.
  useEffect(() => {
    return () => setIsExiting(false);
  }, [toast.id]);

  const isAssertive = toast.type === 'error';

  return (
    <div
      role={isAssertive ? 'alert' : 'status'}
      aria-live={isAssertive ? 'assertive' : 'polite'}
      onMouseEnter={() => pause(toast.id)}
      onMouseLeave={() => resume(toast.id)}
      className={cn(
        'pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-none border border-black bg-white p-4 transition-all duration-200 ease-out',
        isExiting
          ? 'translate-x-2 opacity-0'
          : 'translate-x-0 opacity-100 animate-in slide-in-from-bottom-2 fade-in'
      )}
    >
      <div className="mt-0.5 shrink-0">
        <Icon
          className={cn(
            'h-4 w-4',
            toast.type === 'pending' && 'animate-spin text-black',
            toast.type === 'success' && 'text-black',
            toast.type === 'error' && 'text-black',
            toast.type === 'info' && 'text-black'
          )}
        />
      </div>

      <div className="min-w-0 flex-1">
        <p className="font-archivo text-xs font-semibold uppercase tracking-wider text-black">
          {toast.message}
        </p>
        {toast.description && (
          <p className="mt-1 font-archivo text-xs text-neutral-600">{toast.description}</p>
        )}
        {toast.action && (
          <button
            type="button"
            onClick={() => {
              toast.action?.onClick();
              handleManualClose();
            }}
            className="mt-2 font-archivo text-xs font-semibold uppercase tracking-wider underline underline-offset-2 hover:text-neutral-600"
          >
            {toast.action.label}
          </button>
        )}
      </div>

      <button
        type="button"
        onClick={handleManualClose}
        aria-label="Dismiss notification"
        className="shrink-0 text-black transition-colors hover:text-neutral-500 focus-visible:outline focus-visible:outline-black focus-visible:outline-offset-2"
      >
        <X className="h-3.5 w-3.5" />
      </button>

      {Number.isFinite(toast.duration) && (
        <span className="absolute inset-x-0 bottom-0 h-0.5 bg-black/10">
          <span
            className="block h-full bg-black"
            style={{
              animation: `toast-progress ${toast.duration}ms linear forwards`,
              animationPlayState: toast.pausedAt ? 'paused' : 'running',
            }}
          />
        </span>
      )}
    </div>
  );
}
