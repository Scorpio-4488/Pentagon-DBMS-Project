import { useCallback, useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';

let nextToastId = 0;
let emitToast;

const TOAST_STYLES = {
  success: {
    className: 'border-emerald-200 bg-white text-slate-800',
    icon: <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />,
  },
  error: {
    className: 'border-red-200 bg-white text-slate-800',
    icon: <AlertCircle className="h-5 w-5 shrink-0 text-red-600" />,
  },
  info: {
    className: 'border-brand-200 bg-white text-slate-800',
    icon: <Info className="h-5 w-5 shrink-0 text-brand-600" />,
  },
};

export function useToast() {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const addToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = ++nextToastId;
    setToasts((current) => [...current, { id, message, type, duration }]);
    return id;
  }, []);

  useEffect(() => {
    emitToast = addToast;
    return () => {
      emitToast = null;
    };
  }, [addToast]);

  return { toasts, addToast, removeToast };
}

export function toast(message, type = 'info', duration = 4000) {
  return emitToast?.(message, type, duration);
}

toast.success = (message, duration) => toast(message, 'success', duration);
toast.error = (message, duration) => toast(message, 'error', duration);
toast.info = (message, duration) => toast(message, 'info', duration);

function ToastItem({ id, message, type, duration, onRemove }) {
  useEffect(() => {
    const timeoutId = window.setTimeout(() => onRemove(id), duration);
    return () => window.clearTimeout(timeoutId);
  }, [duration, id, onRemove]);

  const style = TOAST_STYLES[type] ?? TOAST_STYLES.info;

  return (
    <div
      className={`animate-slide-down flex items-center gap-3 rounded-xl border px-4 py-3 shadow-[0_12px_30px_rgba(15,23,42,0.08)] ${style.className}`}
    >
      {style.icon}
      <p className="flex-1 text-sm font-medium leading-6">{message}</p>
      <button
        type="button"
        onClick={() => onRemove(id)}
        className="rounded-md p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

export function ToastContainer() {
  const { removeToast, toasts } = useToast();

  if (toasts.length === 0) {
    return null;
  }

  return (
    <div className="fixed right-4 top-4 z-50 flex w-[min(380px,calc(100vw-2rem))] flex-col gap-2">
      {toasts.map((entry) => (
        <ToastItem key={entry.id} {...entry} onRemove={removeToast} />
      ))}
    </div>
  );
}
