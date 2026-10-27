'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, UploadCloud, FileText, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { TaskItem, TaskPriority, TaskStatus, CreateTaskInput, UpdateTaskInput } from '../../lib/types';
import { formatBytes } from '../../lib/utils';
import { useToast } from '../ui/ToastContext';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  taskToEdit?: TaskItem | null;
  onSubmit: (data: CreateTaskInput | UpdateTaskInput, fileToUpload?: File | null) => Promise<void>;
}

export function TaskModal({
  isOpen,
  onClose,
  taskToEdit,
  onSubmit
}: TaskModalProps) {
  const { showToast } = useToast();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('MEDIUM');
  const [status, setStatus] = useState<TaskStatus>('TODO');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync state when editing or creating
  useEffect(() => {
    if (taskToEdit) {
      setTitle(taskToEdit.title);
      setDescription(taskToEdit.description || '');
      setPriority(taskToEdit.priority);
      setStatus(taskToEdit.status);
    } else {
      setTitle('');
      setDescription('');
      setPriority('MEDIUM');
      setStatus('TODO');
    }
    setSelectedFile(null);
    setUploadProgress(0);
    setErrorMsg('');
  }, [taskToEdit, isOpen]);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
    if (!allowedTypes.includes(file.type.toLowerCase())) {
      setErrorMsg('Invalid file type. Only PDF, PNG, and JPEG files are allowed.');
      showToast('Only PDF, PNG, and JPEG files are supported.', 'error');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg(`File size (${formatBytes(file.size)}) exceeds the 5 MB maximum limit.`);
      showToast('File exceeds 5 MB limit.', 'error');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setErrorMsg('');
    setSelectedFile(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg('Task title is required.');
      return;
    }
    if (title.length > 120) {
      setErrorMsg('Title cannot exceed 120 characters.');
      return;
    }
    if (description.length > 2000) {
      setErrorMsg('Description cannot exceed 2000 characters.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      await onSubmit(
        {
          title: title.trim(),
          description: description.trim(),
          priority,
          status
        },
        selectedFile
      );
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save task.');
      showToast(err.message || 'Operation failed.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
      <div
        className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {taskToEdit ? 'Edit Task' : 'Create New Task'}
            </h3>
            <p className="text-xs text-slate-500">
              {taskToEdit ? 'Update details or replace attached document' : 'Define task properties and attach documents (S3)'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 flex items-start gap-2 text-rose-700 dark:text-rose-300">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Title */}
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <label className="font-semibold text-slate-700 dark:text-slate-300">
                Title <span className="text-rose-500">*</span>
              </label>
              <span className={`text-[10px] ${title.length > 100 ? 'text-amber-500' : 'text-slate-400'}`}>
                {title.length}/120
              </span>
            </div>
            <input
              type="text"
              required
              maxLength={120}
              placeholder="e.g. Set up DynamoDB Table and GSI indexes"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          {/* Description */}
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <label className="font-semibold text-slate-700 dark:text-slate-300">
                Description (Optional)
              </label>
              <span className="text-[10px] text-slate-400">
                {description.length}/2000
              </span>
            </div>
            <textarea
              rows={3}
              maxLength={2000}
              placeholder="Provide context, acceptance criteria, or execution notes..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none"
            />
          </div>

          {/* Priority & Status Controls */}
          <div className="grid grid-cols-2 gap-4">
            {/* Priority */}
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none font-medium"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </select>
            </div>

            {/* Status */}
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none font-medium"
              >
                <option value="TODO">To Do</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
              </select>
            </div>
          </div>

          {/* Document Upload Zone */}
          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-slate-700 dark:text-slate-300">
                Document Attachment (Private S3)
              </label>
              <span className="text-[10px] text-slate-400">PDF, PNG, JPEG up to 5MB</span>
            </div>

            {/* Existing attachment indicator when editing */}
            {taskToEdit?.attachment && !selectedFile && (
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2 truncate">
                  <FileText className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                  <div className="truncate">
                    <p className="font-medium text-slate-800 dark:text-slate-200 truncate">
                      {taskToEdit.attachment.name}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      {formatBytes(taskToEdit.attachment.size)} • Already stored in private S3
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline flex-shrink-0"
                >
                  Replace
                </button>
              </div>
            )}

            {/* Newly selected file indicator */}
            {selectedFile ? (
              <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 flex items-center justify-between">
                <div className="flex items-center gap-2 truncate">
                  <FileText className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                  <div className="truncate">
                    <p className="font-medium text-slate-900 dark:text-white truncate">
                      {selectedFile.name}
                    </p>
                    <p className="text-[10px] text-indigo-600 dark:text-indigo-400">
                      {formatBytes(selectedFile.size)} • Ready to upload via presigned URL
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedFile(null);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                  className="text-xs text-rose-600 font-semibold hover:underline flex-shrink-0"
                >
                  Remove
                </button>
              </div>
            ) : (
              /* Dropzone button */
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-600 rounded-xl p-4 text-center cursor-pointer transition bg-slate-50/50 dark:bg-slate-950/50 hover:bg-indigo-50/20"
              >
                <UploadCloud className="w-6 h-6 text-slate-400 mx-auto mb-1" />
                <p className="font-medium text-slate-700 dark:text-slate-300">
                  Click or drag file to attach
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Direct upload to private S3 bucket using short-lived presigned URL
                </p>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 shadow-sm shadow-indigo-600/30 transition disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>{selectedFile ? 'Uploading to S3...' : 'Saving...'}</span>
                </>
              ) : (
                <span>{taskToEdit ? 'Save Changes' : 'Create Task'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
