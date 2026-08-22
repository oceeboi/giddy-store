'use client';

import { createContext, useCallback, useContext, useReducer, useRef, ReactNode } from 'react';

export type ToastType = 'pending' | 'success' | 'error' | 'info';

export type ToastAction = {
  label: string;
  onClick: () => void;
};

export type ToastOptions = {
  id?: string;
  description?: string;
  duration?: number; // ms. Use Infinity to require manual/promise dismissal.
  action?: ToastAction;
  onOpen?: () => void;
  onClose?: () => void; // fires on ANY removal (auto, manual, promise-resolved)
  onDismiss?: () => void; // fires ONLY on user-initiated close (X button / click)
  onAutoClose?: () => void; // fires ONLY when duration expires naturally
};

export type Toast = Required<Pick<ToastOptions, 'id'>> &
  Omit<ToastOptions, 'id'> & {
    type: ToastType;
    message: string;
    createdAt: number;
    pausedAt?: number;
    remaining: number; // ms remaining, recalculated on hover pause/resume
  };

type ToasterConfig = {
  position:
    'top-right' | 'top-left' | 'top-center' | 'bottom-right' | 'bottom-left' | 'bottom-center';
  maxVisible: number;
  defaultDurations: Record<ToastType, number>;
};

const DEFAULT_CONFIG: ToasterConfig = {
  position: 'bottom-right',
  maxVisible: 4,
  defaultDurations: {
    pending: Infinity,
    success: 4000,
    error: 6000,
    info: 4000,
  },
};

type State = { toasts: Toast[] };
type Action =
  | { type: 'ADD'; toast: Toast }
  | { type: 'UPDATE'; id: string; patch: Partial<Toast> }
  | { type: 'REMOVE'; id: string }
  | { type: 'PAUSE'; id: string }
  | { type: 'RESUME'; id: string };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'ADD':
      return { toasts: [action.toast, ...state.toasts] };
    case 'UPDATE':
      return {
        toasts: state.toasts.map((t) => (t.id === action.id ? { ...t, ...action.patch } : t)),
      };
    case 'REMOVE':
      return { toasts: state.toasts.filter((t) => t.id !== action.id) };
    case 'PAUSE':
      return {
        toasts: state.toasts.map((t) =>
          t.id === action.id && t.pausedAt === undefined ? { ...t, pausedAt: Date.now() } : t
        ),
      };
    case 'RESUME':
      return {
        toasts: state.toasts.map((t) => {
          if (t.id !== action.id || t.pausedAt === undefined) return t;
          const elapsedWhilePaused = Date.now() - t.pausedAt;
          return { ...t, pausedAt: undefined, createdAt: t.createdAt + elapsedWhilePaused };
        }),
      };
    default:
      return state;
  }
}

type ToastContextValue = {
  toasts: Toast[];
  config: ToasterConfig;
  add: (type: ToastType, message: string, options?: ToastOptions) => string;
  update: (id: string, patch: Partial<Toast>) => void;
  remove: (id: string, reason: 'auto' | 'manual' | 'programmatic') => void;
  pause: (id: string) => void;
  resume: (id: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

// Module-level ref so the imperative `toast.success()` API (called from
// anywhere — event handlers, fetch callbacks, outside the component tree)
// can reach whichever ToastProvider is mounted, without prop-drilling.
export const toastDispatchRef: { current: ToastContextValue | null } = { current: null };

let idCounter = 0;
function generateId() {
  idCounter += 1;
  return `toast_${Date.now()}_${idCounter}`;
}

export function ToastProvider({
  children,
  position = DEFAULT_CONFIG.position,
  maxVisible = DEFAULT_CONFIG.maxVisible,
  durations,
}: {
  children: ReactNode;
  position?: ToasterConfig['position'];
  maxVisible?: number;
  durations?: Partial<Record<ToastType, number>>;
}) {
  const [state, dispatch] = useReducer(reducer, { toasts: [] });
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const config: ToasterConfig = {
    position,
    maxVisible,
    defaultDurations: { ...DEFAULT_CONFIG.defaultDurations, ...durations },
  };

  const clearTimer = useCallback((id: string) => {
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const remove = useCallback(
    (id: string, reason: 'auto' | 'manual' | 'programmatic') => {
      clearTimer(id);
      const toast = state.toasts.find((t) => t.id === id);
      if (toast) {
        toast.onClose?.();
        if (reason === 'auto') toast.onAutoClose?.();
        if (reason === 'manual') toast.onDismiss?.();
      }
      dispatch({ type: 'REMOVE', id });
    },
    [state.toasts, clearTimer]
  );

  const scheduleTimer = useCallback(
    (id: string, duration: number) => {
      clearTimer(id);
      if (!Number.isFinite(duration)) return; // Infinity = no auto-dismiss (e.g. pending toasts)
      const timer = setTimeout(() => remove(id, 'auto'), duration);
      timers.current.set(id, timer);
    },
    [clearTimer, remove]
  );

  const add = useCallback(
    (type: ToastType, message: string, options: ToastOptions = {}) => {
      const id = options.id ?? generateId();
      const duration = options.duration ?? config.defaultDurations[type];
      const toast: Toast = {
        id,
        type,
        message,
        description: options.description,
        action: options.action,
        onOpen: options.onOpen,
        onClose: options.onClose,
        onDismiss: options.onDismiss,
        onAutoClose: options.onAutoClose,
        duration,
        createdAt: Date.now(),
        remaining: duration,
      };
      dispatch({ type: 'ADD', toast });
      toast.onOpen?.();
      scheduleTimer(id, duration);
      return id;
    },
    [config.defaultDurations, scheduleTimer]
  );

  // update() re-arms the timer against the toast's (possibly new) duration —
  // this is how toast.promise() morphs a pending toast into success/error
  // in place, same id, without a flicker of remove+re-add.
  const update = useCallback(
    (id: string, patch: Partial<Toast>) => {
      dispatch({ type: 'UPDATE', id, patch });
      if (patch.duration !== undefined) {
        scheduleTimer(id, patch.duration);
      }
    },
    [scheduleTimer]
  );

  const pause = useCallback(
    (id: string) => {
      clearTimer(id);
      dispatch({ type: 'PAUSE', id });
    },
    [clearTimer]
  );

  const resume = useCallback(
    (id: string) => {
      dispatch({ type: 'RESUME', id });
      const toast = state.toasts.find((t) => t.id === id);
      if (toast && Number.isFinite(toast.duration)) {
        const elapsed = Date.now() - toast.createdAt;
        const remaining = Math.max(toast.duration! - elapsed, 0);
        scheduleTimer(id, remaining);
      }
    },
    [state.toasts, scheduleTimer]
  );

  const value: ToastContextValue = {
    toasts: state.toasts,
    config,
    add,
    update,
    remove,
    pause,
    resume,
  };
  toastDispatchRef.current = value;

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>;
}

export function useToastContext() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToastContext must be used within a ToastProvider');
  return ctx;
}
