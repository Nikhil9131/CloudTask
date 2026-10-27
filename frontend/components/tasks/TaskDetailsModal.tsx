'use client';

import React from 'react';
import {
  X,
  Calendar,
  Clock,
  FileText,
  Download,
  ExternalLink,
  Edit3,
  Trash2,
  ShieldCheck,
  Image as ImageIcon
} from 'lucide-react';
import { TaskItem, TaskStatus } from '../../lib/types';
import { formatDate, formatBytes } from '../../lib/utils';

interface TaskDetailsModalProps {
  task: TaskItem | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (task: TaskItem) => void;
  onDelete: (task: TaskItem) => void;
  onStatusChange: (taskId: string, newStatus: TaskStatus) => void;
}

export function TaskDetailsModal({
  task,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  onStatusChange
}: TaskDetailsModalProps) {
  if (!isOpen || !task) return null;

  const isImage = task.attachment?.type.startsWith('image/');
  const isPdf = task.attachment?.type === 'application/pdf';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
      <div
        className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <span
              className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                task.priority === 'HIGH'
                  ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                  : task.priority === 'MEDIUM'
                  ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                  : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
              }`}
            >
              {task.priority} PRIORITY
            </span>

            <select
              value={task.status}
              onChange={(e) => onStatusChange(task.taskId, e.target.value as TaskStatus)}
              className="text-xs font-semibold py-0.5 px-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="TODO">To Do</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
            </select>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
          {/* Title & Description */}
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white leading-snug">
              {task.title}
            </h2>
            <div className="mt-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
              {task.description || 'No detailed description provided for this task.'}
            </div>
          </div>

          {/* Timestamps & Identifiers */}
          <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800 text-slate-500">
            <div className="space-y-1">
              <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                Created At
              </span>
              <p className="font-mono text-[11px]">{formatDate(task.createdAt)}</p>
            </div>
            <div className="space-y-1">
              <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-indigo-500" />
                Last Updated
              </span>
              <p className="font-mono text-[11px]">{formatDate(task.updatedAt)}</p>
            </div>
          </div>

          {/* Attachment Card */}
          <div>
            <h4 className="font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-indigo-500" />
              Attached Document
            </h4>

            {task.attachment ? (
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-slate-50 dark:bg-slate-950">
                <div className="p-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 truncate">
                    <div className="w-9 h-9 rounded-lg bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 flex items-center justify-center flex-shrink-0">
                      {isImage ? <ImageIcon className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                    </div>
                    <div className="truncate">
                      <p className="font-semibold text-slate-900 dark:text-white truncate">
                        {task.attachment.name}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        {formatBytes(task.attachment.size)} • {task.attachment.type}
                      </p>
                    </div>
                  </div>

                  {task.attachment.downloadUrl && (
                    <a
                      href={task.attachment.downloadUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-indigo-50 transition shadow-sm flex-shrink-0"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Open / Download</span>
                    </a>
                  )}
                </div>

                {/* Preview for images */}
                {isImage && task.attachment.downloadUrl && (
                  <div className="border-t border-slate-200 dark:border-slate-800 p-2 bg-slate-100 dark:bg-slate-900 flex justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={task.attachment.downloadUrl}
                      alt={task.attachment.name}
                      className="max-h-60 rounded-lg object-contain shadow-sm"
                    />
                  </div>
                )}

                {/* Info about private S3 storage */}
                <div className="px-4 py-2 border-t border-slate-200/60 dark:border-slate-800/60 bg-slate-100/50 dark:bg-slate-900/50 flex items-center gap-2 text-[10px] text-slate-500">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Stored in private S3 bucket. Access granted via short-lived presigned URL.</span>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-center text-slate-400">
                No document attached to this task. Click <strong>Edit Task</strong> to upload a PDF, PNG, or JPEG.
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <button
            onClick={() => {
              onClose();
              onDelete(task);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete Task</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onClose();
                onEdit(task);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit Details</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
