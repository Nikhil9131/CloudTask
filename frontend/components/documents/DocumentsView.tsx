'use client';

import React, { useState, useMemo } from 'react';
import {
  FileText,
  Search,
  Download,
  ShieldCheck,
  ExternalLink,
  HardDrive,
  FileType,
  Image as ImageIcon
} from 'lucide-react';
import { TaskItem } from '../../lib/types';
import { formatBytes, formatDate } from '../../lib/utils';

interface DocumentsViewProps {
  tasks: TaskItem[];
  onSelectTask: (task: TaskItem) => void;
}

export function DocumentsView({ tasks, onSelectTask }: DocumentsViewProps) {
  const [searchQuery, setSearchQuery] = useState('');

  // Extract all tasks with attachments
  const tasksWithDocs = useMemo(() => {
    return tasks.filter((t) => Boolean(t.attachment));
  }, [tasks]);

  const totalBytes = useMemo(() => {
    return tasksWithDocs.reduce((acc, t) => acc + (t.attachment?.size || 0), 0);
  }, [tasksWithDocs]);

  const pdfCount = tasksWithDocs.filter((t) => t.attachment?.type === 'application/pdf').length;
  const imgCount = tasksWithDocs.filter((t) => t.attachment?.type.startsWith('image/')).length;

  const filteredDocs = useMemo(() => {
    if (!searchQuery.trim()) return tasksWithDocs;
    const q = searchQuery.toLowerCase().trim();
    return tasksWithDocs.filter((t) => {
      const matchFile = t.attachment?.name.toLowerCase().includes(q);
      const matchTask = t.title.toLowerCase().includes(q);
      return matchFile || matchTask;
    });
  }, [tasksWithDocs, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Documents */}
        <div className="p-5 rounded-2xl bg-[#FAF8F2] dark:bg-[#1C1813] border border-[#DCD6C0] dark:border-[#332C23] shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Documents
            </span>
            <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
              {tasksWithDocs.length}
            </p>
            <span className="text-[11px] text-slate-400">Stored in private S3</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 flex items-center justify-center">
            <FileText className="w-5 h-5" />
          </div>
        </div>

        {/* Total Storage */}
        <div className="p-5 rounded-2xl bg-[#FAF8F2] dark:bg-[#1C1813] border border-[#DCD6C0] dark:border-[#332C23] shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total S3 Storage
            </span>
            <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
              {formatBytes(totalBytes)}
            </p>
            <span className="text-[11px] text-slate-400">AES256 Server-Side Encrypted</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
            <HardDrive className="w-5 h-5" />
          </div>
        </div>

        {/* File Type Breakdown */}
        <div className="p-5 rounded-2xl bg-[#FAF8F2] dark:bg-[#1C1813] border border-[#DCD6C0] dark:border-[#332C23] shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Format Distribution
            </span>
            <p className="text-base font-bold text-slate-800 dark:text-slate-100 mt-1">
              {pdfCount} PDF • {imgCount} Image{imgCount !== 1 ? 's' : ''}
            </p>
            <span className="text-[11px] text-slate-400">5 MB per-file enforcement</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 flex items-center justify-center">
            <FileType className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter and Document Table */}
      <div className="p-6 rounded-2xl bg-[#FAF8F2] dark:bg-[#1C1813] border border-[#DCD6C0] dark:border-[#332C23] shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Document Repository
            </h3>
            <p className="text-xs text-slate-500">
              Direct access to private S3 files generated with short-lived presigned download URLs
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search documents or tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-[#F2EFE3] dark:bg-[#231E17] border border-[#DCD6C0] dark:border-[#3D3528] text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#7E6637]/30"
            />
          </div>
        </div>

        {filteredDocs.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400 space-y-2">
            <FileText className="w-8 h-8 mx-auto text-slate-300" />
            <p>No documents found matching your filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-3">File Name</th>
                  <th className="py-3 px-3">Associated Task</th>
                  <th className="py-3 px-3 w-24">Size</th>
                  <th className="py-3 px-3 w-28">Type</th>
                  <th className="py-3 px-3 w-36">Uploaded</th>
                  <th className="py-3 px-3 w-28 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredDocs.map((task) => {
                  const att = task.attachment!;
                  const isImage = att.type.startsWith('image/');
                  return (
                    <tr
                      key={task.taskId}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition"
                    >
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          {isImage ? (
                            <ImageIcon className="w-4 h-4 text-sky-500 flex-shrink-0" />
                          ) : (
                            <FileText className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                          )}
                          <span className="font-semibold text-slate-900 dark:text-white truncate max-w-xs">
                            {att.name}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <button
                          onClick={() => onSelectTask(task)}
                          className="text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 truncate max-w-sm block text-left"
                        >
                          {task.title}
                        </button>
                      </td>
                      <td className="py-3 px-3 text-slate-500 whitespace-nowrap">
                        {formatBytes(att.size)}
                      </td>
                      <td className="py-3 px-3">
                        <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {isImage ? 'IMAGE' : 'PDF'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-500 whitespace-nowrap">
                        {formatDate(att.uploadedAt)}
                      </td>
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        {att.downloadUrl ? (
                          <a
                            href={att.downloadUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 transition"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Download</span>
                          </a>
                        ) : (
                          <button
                            onClick={() => onSelectTask(task)}
                            className="text-xs text-indigo-600 hover:underline"
                          >
                            View
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
