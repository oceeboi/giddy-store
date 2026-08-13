'use client';

import * as React from 'react';
import { createPortal } from 'react-dom';
import {
  AnimatePresence,
  motion,
  useDragControls,
  type PanInfo,
  type Variants,
} from 'framer-motion';

interface DrawerContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
  titleId: string;
  descriptionId: string;
}

const DrawerContext = React.createContext<DrawerContextValue | null>(null);

function useDrawerContext(component: string): DrawerContextValue {
  const ctx = React.useContext(DrawerContext);
  if (!ctx) {
    throw new Error(`<Drawer.${component}> must be rendered inside a <Drawer>.`);
  }
  return ctx;
}

interface DrawerProps {
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  defaultOpen?: boolean;
}

const ANIMATION_SECONDS = 0.28;

function DrawerRoot({ children, open, onOpenChange, defaultOpen = false }: DrawerProps) {
  const isControlled = open !== undefined;
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultOpen);
  const actualOpen = isControlled ? (open as boolean) : uncontrolledOpen;

  const setOpen = React.useCallback(
    (next: boolean) => {
      if (!isControlled) setUncontrolledOpen(next);
      onOpenChange?.(next);
    },
    [isControlled, onOpenChange]
  );

  const reactId = React.useId();
  const titleId = `drawer-title-${reactId}`;
  const descriptionId = `drawer-description-${reactId}`;

  const value = React.useMemo<DrawerContextValue>(
    () => ({ open: actualOpen, setOpen, titleId, descriptionId }),
    [actualOpen, setOpen, titleId, descriptionId]
  );

  return <DrawerContext.Provider value={value}>{children}</DrawerContext.Provider>;
}

interface DrawerTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
  children: React.ReactElement | React.ReactNode;
}

function DrawerTrigger({ asChild, children, onClick, ...props }: DrawerTriggerProps) {
  const { setOpen } = useDrawerContext('Trigger');

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    onClick?.(e);
    setOpen(true);
  };

  if (asChild && React.isValidElement(children)) {
    const child = children as React.ReactElement<{ onClick?: (e: React.MouseEvent) => void }>;
    return React.cloneElement(child, {
      onClick: (e: React.MouseEvent) => {
        child.props.onClick?.(e);
        setOpen(true);
      },
    });
  }

  return (
    <button type="button" onClick={handleClick} {...props}>
      {children}
    </button>
  );
}

type DrawerSide = 'top' | 'bottom';
type DrawerSize = 'sm' | 'md' | 'lg' | 'full';

interface DrawerContentProps {
  children: React.ReactNode;
  side?: DrawerSide;
  size?: DrawerSize;
  className?: string;
  disableOutsideClose?: boolean;
  disableEscapeClose?: boolean;
  disableDrag?: boolean;
  hideCloseButton?: boolean;
  /** Enables visual drag handle near the edge where users naturally grab the panel. */
  showHandle?: boolean;
}

const SIDE_POSITION: Record<DrawerSide, React.CSSProperties> = {
  top: { top: 0, left: 0, width: '100%' },
  bottom: { bottom: 0, left: 0, width: '100%' },
};

const SIZE_HEIGHT: Record<DrawerSize, string> = {
  sm: 'min(38dvh, 360px)',
  md: 'min(56dvh, 560px)',
  lg: 'min(76dvh, 760px)',
  full: '100dvh',
};

const HIDDEN_POSITION: Record<DrawerSide, { x: number; y: string }> = {
  top: { x: 0, y: '-100%' },
  bottom: { x: 0, y: '100%' },
};

const DRAG_CONSTRAINTS: Record<
  DrawerSide,
  { left?: number; right?: number; top?: number; bottom?: number }
> = {
  top: { top: -100000, bottom: 0 },
  bottom: { top: 0, bottom: 100000 },
};

function getFocusableElements(container: HTMLElement) {
  return Array.from(
    container.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )
  ).filter((el) => el.offsetParent !== null);
}

function DrawerContent({
  children,
  side = 'bottom',
  size = 'md',
  className = '',
  disableOutsideClose = false,
  disableEscapeClose = false,
  disableDrag = false,
  hideCloseButton = false,
  showHandle = true,
}: DrawerContentProps) {
  const { open, setOpen, titleId, descriptionId } = useDrawerContext('Content');

  const panelRef = React.useRef<HTMLDivElement | null>(null);
  const lastFocusedRef = React.useRef<HTMLElement | null>(null);
  const axisSign = side === 'bottom' ? 1 : -1;
  const dragControls = useDragControls();

  const [hasMounted, setHasMounted] = React.useState(false);
  React.useEffect(() => {
    setHasMounted(true);
  }, []);

  React.useEffect(() => {
    if (!open) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = original;
    };
  }, [open]);

  React.useEffect(() => {
    if (open) {
      lastFocusedRef.current = document.activeElement as HTMLElement;
      const raf = requestAnimationFrame(() => {
        const focusable = panelRef.current ? getFocusableElements(panelRef.current) : [];
        (focusable[0] ?? panelRef.current)?.focus();
      });
      return () => cancelAnimationFrame(raf);
    }
    lastFocusedRef.current?.focus?.();
  }, [open]);

  React.useEffect(() => {
    if (!open) return;

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && !disableEscapeClose) {
        setOpen(false);
        return;
      }

      if (e.key === 'Tab' && panelRef.current) {
        const focusable = getFocusableElements(panelRef.current);
        if (focusable.length === 0) return;

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, disableEscapeClose, setOpen]);

  const onPanelPointerDown = (e: React.PointerEvent) => {
    if (disableDrag) return;
    const target = e.target as HTMLElement;
    if (target.closest('button, a, input, textarea, select')) return;
    dragControls.start(e);
  };

  const handleDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const closingOffset = info.offset.y * axisSign;
    const closingVelocity = info.velocity.y * axisSign;
    const panelHeight = panelRef.current?.offsetHeight ?? 1;

    const distanceThreshold = panelHeight * 0.3;
    const flickThreshold = 550;

    if (closingOffset > distanceThreshold || closingVelocity > flickThreshold) {
      setOpen(false);
    }
  };

  const backdropVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  };

  const panelVariants: Variants = {
    hidden: HIDDEN_POSITION[side],
    visible: { x: 0, y: 0 },
  };

  if (!hasMounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <div key="drawer-root" aria-hidden={!open} className="fixed inset-0 lg:hidden z-100">
          <motion.div
            onClick={() => !disableOutsideClose && setOpen(false)}
            className="absolute inset-0 bg-black/40"
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={backdropVariants}
            transition={{ duration: ANIMATION_SECONDS, ease: 'easeOut' }}
          />

          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={descriptionId}
            tabIndex={-1}
            drag={disableDrag ? false : 'y'}
            dragControls={dragControls}
            dragListener={false}
            dragConstraints={DRAG_CONSTRAINTS[side]}
            dragElastic={0}
            dragMomentum={false}
            dragSnapToOrigin
            onDragEnd={handleDragEnd}
            onPointerDown={onPanelPointerDown}
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={panelVariants}
            transition={{ duration: ANIMATION_SECONDS, ease: [0.32, 0.72, 0, 1] }}
            className={`absolute flex flex-col overflow-hidden border border-neutral-300 bg-[#f7f7f7] text-black shadow-none outline-none ${className}`}
            style={{
              ...SIDE_POSITION[side],
              height: SIZE_HEIGHT[size],
              maxHeight: '100dvh',
              touchAction: 'pan-x',
            }}
          >
            {showHandle ? (
              <div className="flex items-center justify-center border-b border-neutral-300 px-4 py-2">
                <span className="h-1 w-12 bg-neutral-400" aria-hidden="true" />
              </div>
            ) : null}

            {!hideCloseButton ? (
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="absolute right-4 top-3 inline-flex size-9 items-center justify-center border border-neutral-400 bg-transparent text-black transition-all duration-200 ease-in-out hover:opacity-60 focus-visible:outline-2 focus-visible:outline-black focus-visible:outline-offset-4"
              >
                <CloseIcon />
              </button>
            ) : null}

            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}

function DrawerHeader({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`border-b border-neutral-300 px-6 pb-4 pt-5 ${className}`}>{children}</div>
  );
}

function DrawerTitle({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const { titleId } = useDrawerContext('Title');

  return (
    <h2
      id={titleId}
      className={`pr-12 font-archivo text-base font-black uppercase tracking-widest text-black md:text-lg ${className}`}
    >
      {children}
    </h2>
  );
}

function DrawerDescription({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const { descriptionId } = useDrawerContext('Description');

  return (
    <p
      id={descriptionId}
      className={`mt-2 text-[10px] uppercase tracking-widest text-neutral-600 ${className}`}
    >
      {children}
    </p>
  );
}

function DrawerBody({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={`min-h-0 flex-1 overflow-y-auto px-6 py-4 ${className}`}>{children}</div>;
}

function DrawerFooter({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`mt-auto flex items-center justify-end gap-2 border-t border-neutral-300 px-6 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] ${className}`}
    >
      {children}
    </div>
  );
}

interface DrawerCloseProps {
  asChild?: boolean;
  children: React.ReactElement | React.ReactNode;
}

function DrawerClose({ asChild, children }: DrawerCloseProps) {
  const { setOpen } = useDrawerContext('Close');

  if (asChild && React.isValidElement(children)) {
    const child = children as React.ReactElement<{ onClick?: (e: React.MouseEvent) => void }>;
    return React.cloneElement(child, {
      onClick: (e: React.MouseEvent) => {
        child.props.onClick?.(e);
        setOpen(false);
      },
    });
  }

  return (
    <button
      type="button"
      onClick={() => setOpen(false)}
      className="inline-flex items-center justify-center border border-neutral-500 bg-transparent px-4 py-2 text-[11px] font-semibold uppercase tracking-widest text-black transition-all duration-200 ease-in-out hover:opacity-60 focus-visible:outline-2 focus-visible:outline-black focus-visible:outline-offset-4"
    >
      {children}
    </button>
  );
}

function CloseIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const Drawer = Object.assign(DrawerRoot, {
  Trigger: DrawerTrigger,
  Content: DrawerContent,
  Header: DrawerHeader,
  Title: DrawerTitle,
  Description: DrawerDescription,
  Body: DrawerBody,
  Footer: DrawerFooter,
  Close: DrawerClose,
});

export { Drawer };
export type { DrawerProps, DrawerContentProps, DrawerSide, DrawerSize };
