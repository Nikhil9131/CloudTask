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
  Image as ImageIcon,
  Users
} from 'lucide-react';
import { TaskItem, TaskStatus, WORKSPACE_USERS } from '../../lib/types';
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in">
      <div
        className="w-full max-w-xl bg-[#FAF8F2] dark:bg-[#1C1813] rounded-2xl shadow-2xl border border-[#DCD6C0] dark:border-[#332C23] overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#DCD6C0] dark:border-[#332C23]">
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

            <div className="flex items-center gap-1.5">
              {task.status === 'IN_PROGRESS' && (
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse flex-shrink-0" />
              )}
              <select
                value={task.status}
                onChange={(e) => onStatusChange(task.taskId, e.target.value as TaskStatus)}
                className={`text-xs font-semibold py-1 px-2.5 rounded-lg border focus:outline-none cursor-pointer ${
                  task.status === 'COMPLETED'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
                    : task.status === 'IN_PROGRESS'
                    ? 'bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-200 dark:border-amber-800 font-bold'
                    : 'bg-[#F2EFE3] text-[#5C5343] border-[#DCD6C0] dark:bg-[#251F18] dark:text-[#C7BC9F] dark:border-[#3D3528]'
                }`}
              >
                <option value="TODO">To Do</option>
                <option value="IN_PROGRESS">In Progress (Ongoing)</option>
                <option value="COMPLETED">Completed</option>
              </select>
            </div>
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
        <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
          {/* Multi-User Assignee Details Card */}
          {(() => {
            const user = WORKSPACE_USERS.find((u) => u.name === task.assignee) || {
              name: task.assignee || 'Unassigned',
              email: task.assigneeEmail || 'support@cloudtask.io',
              role: 'Team Member',
              initials: (task.assignee || 'UN').split(' ').map((p) => p[0]).join('').substring(0, 2).toUpperCase(),
              color: 'bg-[#7E6637] text-white'
            };
            return (
              <div className="p-3.5 rounded-xl bg-[#F2EFE3] dark:bg-[#231E17] border border-[#DCD6C0] dark:border-[#3D3528] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shadow-xs ${user.color}`}>
                    {user.initials}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 dark:text-white text-xs">{user.name}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#EEEBDA] dark:bg-[#2A241B] text-[#7E6637] dark:text-[#C7BC9F] font-semibold border border-[#DCD6C0] dark:border-[#3D3528]">
                        {user.role}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">{user.email}</p>
                  </div>
                </div>
                <span className="text-[10px] font-semibold text-[#7E6637] dark:text-[#C7BC9F] uppercase tracking-wider hidden sm:inline">
                  Assigned Member
                </span>
              </div>
            );
          })()}

          {/* Title & Description */}
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white leading-snug">
              {task.title}
            </h2>
            <div className="mt-3 p-4 rounded-xl bg-[#F2EFE3] dark:bg-[#231E17] border border-[#DCD6C0] dark:border-[#3D3528] text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
              {task.description || 'No detailed description provided for this task.'}
            </div>
          </div>

          {/* Timestamps & Identifiers */}
          <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-[#F2EFE3]/60 dark:bg-[#231E17]/60 border border-[#DCD6C0] dark:border-[#3D3528] text-slate-500">
            <div className="space-y-1">
              <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#7E6637]" />
                Created At
              </span>
              <p className="font-mono text-[11px]">{formatDate(task.createdAt)}</p>
            </div>
            <div className="space-y-1">
              <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#7E6637]" />
                Last Updated
              </span>
              <p className="font-mono text-[11px]">{formatDate(task.updatedAt)}</p>
            </div>
          </div>

          {/* Attachment Card */}
          <div>
            <h4 className="font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-[#7E6637]" />
              Attached Document
            </h4>

            {task.attachment ? (
              <div className="rounded-xl border border-[#DCD6C0] dark:border-[#332C23] overflow-hidden bg-[#F2EFE3] dark:bg-[#231E17]">
                <div className="p-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 truncate">
                    <div className="w-9 h-9 rounded-lg bg-[#EEEBDA] dark:bg-[#2A241B] text-[#7E6637] dark:text-[#C7BC9F] flex items-center justify-center flex-shrink-0 border border-[#DCD6C0] dark:border-[#3D3528]">
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
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-[#241E17] dark:text-[#EEEBDA] bg-[#FAF8F2] dark:bg-[#1C1813] border border-[#DCD6C0] dark:border-[#3D3528] hover:bg-[#EEEBDA] transition shadow-sm flex-shrink-0"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Open / Download</span>
                    </a>
                  )}
                </div>

                {/* Preview for images */}
                {isImage && task.attachment.downloadUrl && (
                  <div className="border-t border-[#DCD6C0] dark:border-[#332C23] p-2 bg-[#FAF8F2] dark:bg-[#1C1813] flex justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={task.attachment.downloadUrl}
                      alt={task.attachment.name}
                      className="max-h-60 rounded-lg object-contain shadow-sm"
                    />
                  </div>
                )}

                {/* Info about private S3 storage */}
                <div className="px-4 py-2 border-t border-[#DCD6C0] dark:border-[#332C23] bg-[#F2EFE3]/50 dark:bg-[#231E17]/50 flex items-center gap-2 text-[10px] text-slate-500">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Stored in private S3 bucket. Access granted via short-lived presigned URL.</span>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl border border-dashed border-[#DCD6C0] dark:border-[#3D3528] text-center text-slate-400">
                No document attached to this task. Click <strong>Edit Task</strong> to upload a PDF, PNG, or JPEG.
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-[#DCD6C0] dark:border-[#332C23] flex items-center justify-between">
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
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 bg-[#F2EFE3] dark:bg-[#251F18] hover:bg-[#EAE5D4] dark:hover:bg-[#2E271F] transition"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit Details</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-[#EEEBDA] bg-[#241E17] hover:bg-[#383025] transition"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
