/**
 * ============================================================
 * Toast Notification Component
 * ============================================================
 *
 * Lightweight toast system for success/error/info messages.
 * Auto-dismisses after a configurable duration.
 * ============================================================
 */

import { useState, useEffect, useCallback } from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

// ── Toast Container + Hook ──

let toastIdCounter = 0;
let addToastExternal = null;

/**
 * Hook to manage toast state.
 * Returns [toasts, addToast, removeToast].
 */
export function useToast() {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = ++toastIdCounter;
    setToasts((prev) => [...prev, { id, message, type, duration }]);
    return id;
  }, []);

  // Expose addToast for external use
  useEffect(() => {
    addToastExternal = addToast;
    return () => { addToastExternal = null; };
  }, [addToast]);

  return { toasts, addToast, removeToast };
}

/** Fire a toast from anywhere (after ToastContainer is mounted) */
export function toast(message, type = 'info', duration = 4000) {
  if (addToastExternal) {
    return addToastExternal(message, type, duration);
  }
}

toast.success = (msg, dur) => toast(msg, 'success', dur);
toast.error   = (msg, dur) => toast(msg, 'error', dur);
toast.info    = (msg, dur) => toast(msg, 'info', dur);

// ── Single Toast Item ──

function ToastItem({ id, message, type, duration, onRemove }) {
  useEffect(() => {
    const timer = setTimeout(() => onRemove(id), duration);
    return () => clearTimeout(timer);
  }, [id, duration, onRemove]);

  const styles = {
    success: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
    error:   'border-red-500/30 bg-red-500/10 text-red-300',
    info:    'border-brand-500/30 bg-brand-500/10 text-brand-300',
  };

  const icons = {
    success: <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />,
    error:   <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />,
    info:    <Info className="w-5 h-5 text-brand-400 shrink-0" />,
  };

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-xl border backdrop-blur-xl
                  shadow-2xl animate-slide-down ${styles[type]}`}
    >
      {icons[type]}
      <p className="text-sm font-medium flex-1">{message}</p>
      <button
        onClick={() => onRemove(id)}
        className="text-gray-500 hover:text-gray-300 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

// ── Toast Container (mount once in App) ──

export function ToastContainer() {
  const { toasts, removeToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 w-96 max-w-[90vw]">
      {toasts.map((t) => (
        <ToastItem key={t.id} {...t} onRemove={removeToast} />
      ))}
    </div>
  );
}
