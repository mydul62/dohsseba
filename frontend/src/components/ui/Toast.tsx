'use client';

import React, { createContext, useContext, useCallback, useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  duration?: number; // ms, 0 = persistent
}

interface ToastContextValue {
  toasts: Toast[];
  toast: (opts: Omit<Toast, 'id'>) => string;
  success: (title: string, description?: string) => string;
  error: (title: string, description?: string) => string;
  warning: (title: string, description?: string) => string;
  info: (title: string, description?: string) => string;
  dismiss: (id: string) => void;
  dismissAll: () => void;
}

// ─── Context ─────────────────────────────────────────────────────────────────

const ToastContext = createContext<ToastContextValue | null>(null);

// ─── Provider ────────────────────────────────────────────────────────────────

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const toast = useCallback(
    ({ type, title, description, duration = 2000 }: Omit<Toast, 'id'>): string => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      setToasts((prev) => {
        // Keep max 5 toasts
        const next = [...prev.slice(-4), { id, type, title, description, duration }];
        return next;
      });

      if (duration > 0) {
        const timer = setTimeout(() => dismiss(id), duration);
        timers.current.set(id, timer);
      }
      return id;
    },
    [dismiss]
  );

  const success = useCallback(
    (title: string, description?: string) => toast({ type: 'success', title, description, duration: 2000 }),
    [toast]
  );
  const error = useCallback(
    (title: string, description?: string) => toast({ type: 'error', title, description, duration: 4000 }),
    [toast]
  );
  const warning = useCallback(
    (title: string, description?: string) => toast({ type: 'warning', title, description, duration: 2500 }),
    [toast]
  );
  const info = useCallback(
    (title: string, description?: string) => toast({ type: 'info', title, description, duration: 2000 }),
    [toast]
  );
  const dismissAll = useCallback(() => {
    timers.current.forEach((t) => clearTimeout(t));
    timers.current.clear();
    setToasts([]);
  }, []);

  // cleanup on unmount
  useEffect(() => {
    return () => {
      timers.current.forEach((t) => clearTimeout(t));
    };
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, toast, success, error, warning, info, dismiss, dismissAll }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
}

// ─── Visual Config ────────────────────────────────────────────────────────────

const TOAST_CONFIG: Record<
  ToastType,
  { icon: React.ReactNode; bg: string; border: string; iconColor: string; bar: string }
> = {
  success: {
    icon: <CheckCircle2 className="w-4 h-4 shrink-0" />,
    bg: 'bg-white',
    border: 'border-emerald-200',
    iconColor: 'text-[#0E7A45] bg-emerald-50',
    bar: 'bg-[#0E7A45]',
  },
  error: {
    icon: <XCircle className="w-4 h-4 shrink-0" />,
    bg: 'bg-white',
    border: 'border-rose-200',
    iconColor: 'text-rose-600 bg-rose-50',
    bar: 'bg-rose-500',
  },
  warning: {
    icon: <AlertTriangle className="w-4 h-4 shrink-0" />,
    bg: 'bg-white',
    border: 'border-amber-200',
    iconColor: 'text-amber-600 bg-amber-50',
    bar: 'bg-amber-500',
  },
  info: {
    icon: <Info className="w-4 h-4 shrink-0" />,
    bg: 'bg-white',
    border: 'border-blue-200',
    iconColor: 'text-blue-600 bg-blue-50',
    bar: 'bg-blue-500',
  },
};

// ─── Single Toast Item ────────────────────────────────────────────────────────

function ToastItem({ toast: t, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
  const cfg = TOAST_CONFIG[t.type];
  const duration = t.duration ?? 2000;
  const [paused, setPaused] = React.useState(false);

  return (
    <motion.div
      layout
      key={t.id}
      initial={{ opacity: 0, y: -40, scale: 0.92 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 380, damping: 28 }}
      role="alert"
      aria-live="polite"
      aria-atomic="true"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      className={`relative w-full max-w-sm rounded-2xl border ${cfg.bg} ${cfg.border} shadow-xl shadow-slate-200/60 overflow-hidden flex items-start gap-3 p-3.5 cursor-default select-none`}
    >
      {/* Progress Bar */}
      {duration > 0 && (
        <motion.div
          className={`absolute bottom-0 left-0 h-[3px] ${cfg.bar}`}
          initial={{ scaleX: 1, originX: 0 }}
          animate={{ scaleX: 0 }}
          transition={{
            duration: duration / 1000,
            ease: 'linear',
            ...(paused ? { pause: true } : {}),
          }}
          style={{ transformOrigin: 'left' }}
        />
      )}

      {/* Icon */}
      <div className={`p-1.5 rounded-xl ${cfg.iconColor} flex items-center justify-center mt-0.5`}>
        {cfg.icon}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 space-y-0.5">
        <p className="text-xs font-extrabold text-slate-800 leading-snug">{t.title}</p>
        {t.description && (
          <p className="text-[11px] text-slate-500 font-medium leading-relaxed">{t.description}</p>
        )}
      </div>

      {/* Close */}
      <button
        onClick={() => onDismiss(t.id)}
        aria-label="Close notification"
        className="shrink-0 p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer mt-0.5"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </motion.div>
  );
}

// ─── Container ────────────────────────────────────────────────────────────────

function ToastContainer({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: string) => void }) {
  return (
    <div
      aria-label="Notifications"
      className="fixed top-5 left-1/2 -translate-x-1/2 z-[9999] flex flex-col gap-2.5 items-center w-[calc(100vw-2rem)] max-w-sm pointer-events-none px-2"
    >
      <AnimatePresence mode="popLayout" initial={false}>
        {toasts.map((t) => (
          <div key={t.id} className="pointer-events-auto w-full">
            <ToastItem toast={t} onDismiss={onDismiss} />
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
}
