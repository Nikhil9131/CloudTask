'use client';

import React from 'react';
import { AlertTriangle, Trash2, X, Loader2 } from 'lucide-react';
import { TaskItem } from '../../lib/types';

interface DeleteConfirmModalProps {
  task: TaskItem | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  isDeleting: boolean;
}

export function DeleteConfirmModal({
  task,
  isOpen,
  onClose,
  onConfirm,
  isDeleting
}: DeleteConfirmModalProps) {
  if (!isOpen || !task) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
      <div
        className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Delete Task
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Are you sure you want to delete <strong className="text-slate-800 dark:text-slate-200">&ldquo;{task.title}&rdquo;</strong>?
            </p>
            {task.attachment && (
              <p className="text-xs text-rose-600 dark:text-rose-400 mt-2 bg-rose-50 dark:bg-rose-950/30 p-2 rounded-lg border border-rose-200 dark:border-rose-900">
                This will also permanently delete the associated file (<strong>{task.attachment.name}</strong>) from the private S3 bucket.
              </p>
            )}
          </div>
        </div>

        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2 text-xs">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 rounded-xl font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl font-semibold text-white bg-rose-600 hover:bg-rose-700 active:bg-rose-800 shadow-sm transition disabled:opacity-50"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Deleting...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-3.5 h-3.5" />
                <span>Yes, Delete Task</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
