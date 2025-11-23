"use client";

import React from "react";

type Props = {
  open: boolean;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onClose: () => void;
};

const ConfirmModal: React.FC<Props> = ({
  open,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onClose,
}) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/30 p-4">
      <div className="w-full max-w-sm rounded-xl border bg-white p-5 shadow-lg dark:border-white/10 dark:bg-gray-900">
        {title && (
          <div className="mb-2 text-base font-semibold text-gray-800 dark:text-white/90">
            {title}
          </div>
        )}
        <div className="mb-5 text-sm text-gray-600 dark:text-gray-300">{message}</div>
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-lg border px-4 py-2 text-sm dark:border-gray-800"
          >
            {cancelText}
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="rounded-lg bg-error-500 px-4 py-2 text-sm font-medium text-white shadow-theme-xs hover:bg-error-600"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
