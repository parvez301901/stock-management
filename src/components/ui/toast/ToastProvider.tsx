"use client";

import React, { createContext, useCallback, useContext, useMemo, useState } from "react";

export type Toast = {
  id: string;
  title?: string;
  message: string;
  variant?: "success" | "error" | "info";
  duration?: number; // ms
};

type ToastContextType = {
  addToast: (toast: Omit<Toast, "id">) => void;
};

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const remove = useCallback((id: string) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  const addToast = useCallback((toast: Omit<Toast, "id">) => {
    const id = Math.random().toString(36).slice(2);
    const t: Toast = { id, duration: 3500, variant: "info", ...toast };
    setToasts((prev) => [...prev, t]);
    if (t.duration) {
      setTimeout(() => remove(id), t.duration);
    }
  }, [remove]);

  const value = useMemo(() => ({ addToast }), [addToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed right-4 top-20 z-[100] flex w-[320px] flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`rounded-lg border px-4 py-3 shadow-sm backdrop-blur-sm dark:border-white/10 ${
              t.variant === "success"
                ? "bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400"
                : t.variant === "error"
                ? "bg-error-50 text-error-700 dark:bg-error-500/10 dark:text-error-400"
                : "bg-white text-gray-800 dark:bg-white/[0.03] dark:text-white/90"
            }`}
          >
            {t.title && <div className="mb-0.5 text-sm font-semibold">{t.title}</div>}
            <div className="text-sm">{t.message}</div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};
