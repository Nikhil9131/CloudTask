'use client';

import React from 'react';
import {
  CheckSquare,
  Clock,
  PlayCircle,
  CheckCircle2,
  TrendingUp,
  AlertTriangle,
  FileText,
  ArrowRight
} from 'lucide-react';
import { TaskItem, TaskPriority } from '../../lib/types';
import { formatRelativeTime } from '../../lib/utils';

interface StatCardsProps {
  tasks: TaskItem[];
  onSelectTask: (task: TaskItem) => void;
  onNavigateToTasks: () => void;
  onNavigateToDocuments: () => void;
}

export function StatCards({
  tasks,
  onSelectTask,
  onNavigateToTasks,
  onNavigateToDocuments
}: StatCardsProps) {
  const total = tasks.length;
  const todoCount = tasks.filter((t) => t.status === 'TODO').length;
  const inProgressCount = tasks.filter((t) => t.status === 'IN_PROGRESS').length;
  const completedCount = tasks.filter((t) => t.status === 'COMPLETED').length;
  const documentsCount = tasks.filter((t) => Boolean(t.attachment)).length;

  const completionRate = total > 0 ? Math.round((completedCount / total) * 100) : 0;

  // Priority Distribution
  const highPriorityCount = tasks.filter((t) => t.priority === 'HIGH').length;
  const medPriorityCount = tasks.filter((t) => t.priority === 'MEDIUM').length;
  const lowPriorityCount = tasks.filter((t) => t.priority === 'LOW').length;

  const highPct = total > 0 ? Math.round((highPriorityCount / total) * 100) : 0;
  const medPct = total > 0 ? Math.round((medPriorityCount / total) * 100) : 0;
  const lowPct = total > 0 ? Math.round((lowPriorityCount / total) * 100) : 0;

  // Recent tasks (up to 5)
  const recentTasks = [...tasks]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* 4 Core Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Tasks */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Total Tasks
            </span>
            <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300">
              <CheckSquare className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {total}
            </span>
            <span className="text-xs text-slate-400 font-medium">Real DynamoDB count</span>
          </div>
        </div>

        {/* To Do (Pending) */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
              Pending (To Do)
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/60 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {todoCount}
            </span>
            <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">
              {total > 0 ? `${Math.round((todoCount / total) * 100)}% of total` : '0%'}
            </span>
          </div>
        </div>

        {/* In Progress */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-sky-600 dark:text-sky-400 uppercase tracking-wider">
              In Progress
            </span>
            <div className="w-9 h-9 rounded-xl bg-sky-50 dark:bg-sky-950/60 flex items-center justify-center text-sky-600 dark:text-sky-400">
              <PlayCircle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {inProgressCount}
            </span>
            <span className="text-xs text-sky-600 dark:text-sky-400 font-medium">
              {total > 0 ? `${Math.round((inProgressCount / total) * 100)}% active` : '0%'}
            </span>
          </div>
        </div>

        {/* Completed */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              Completed
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {completedCount}
            </span>
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
              {completionRate}% success
            </span>
          </div>
        </div>
      </div>

      {/* Row 2: Analytics Breakdown + Priority Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Completion Progress Gauge */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                Completion Rate
              </h3>
              <TrendingUp className="w-4 h-4 text-emerald-500" />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Aggregate ratio of finished deliverables
            </p>
          </div>

          <div className="my-6">
            <div className="flex items-baseline justify-between mb-2">
              <span className="text-4xl font-extrabold text-slate-900 dark:text-white">
                {completionRate}%
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {completedCount} of {total} completed
              </span>
            </div>
            {/* Progress Track */}
            <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${completionRate}%` }}
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
            <span>Documents in S3: <strong className="text-slate-700 dark:text-slate-300">{documentsCount}</strong></span>
            <button
              onClick={onNavigateToDocuments}
              className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline"
            >
              View documents
            </button>
          </div>
        </div>

        {/* Priority Distribution */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between lg:col-span-2">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                Priority Distribution
              </h3>
              <AlertTriangle className="w-4 h-4 text-amber-500" />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Workload density categorized by severity level
            </p>
          </div>

          <div className="space-y-4 my-4">
            {/* HIGH */}
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" />
                  HIGH PRIORITY
                </span>
                <span className="text-slate-700 dark:text-slate-300">
                  {highPriorityCount} tasks ({highPct}%)
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-rose-500 rounded-full transition-all duration-500"
                  style={{ width: `${highPct}%` }}
                />
              </div>
            </div>

            {/* MEDIUM */}
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
                  MEDIUM PRIORITY
                </span>
                <span className="text-slate-700 dark:text-slate-300">
                  {medPriorityCount} tasks ({medPct}%)
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-amber-500 rounded-full transition-all duration-500"
                  style={{ width: `${medPct}%` }}
                />
              </div>
            </div>

            {/* LOW */}
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-slate-400 inline-block" />
                  LOW PRIORITY
                </span>
                <span className="text-slate-700 dark:text-slate-300">
                  {lowPriorityCount} tasks ({lowPct}%)
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-slate-400 rounded-full transition-all duration-500"
                  style={{ width: `${lowPct}%` }}
                />
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-400">
            DynamoDB query pattern: Filtered by status and priority attributes with secondary index support.
          </div>
        </div>
      </div>

      {/* Row 3: Recent Tasks Table */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base">
              Recent Tasks
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Latest items created or modified in the system
            </p>
          </div>
          <button
            onClick={onNavigateToTasks}
            className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 hover:underline"
          >
            <span>View all tasks</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {recentTasks.length === 0 ? (
          <div className="py-8 text-center text-sm text-slate-400">
            No tasks created yet. Click <strong>New Task</strong> to add one!
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {recentTasks.map((task) => (
              <div
                key={task.taskId}
                onClick={() => onSelectTask(task)}
                className="py-3 flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/80 dark:hover:bg-slate-800/50 rounded-xl px-2 transition -mx-2"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-2 h-2 rounded-full flex-shrink-0 ${
                      task.status === 'COMPLETED'
                        ? 'bg-emerald-500'
                        : task.status === 'IN_PROGRESS'
                        ? 'bg-sky-500'
                        : 'bg-amber-500'
                    }`}
                  />
                  <div className="truncate">
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">
                      {task.title}
                    </p>
                    <p className="text-xs text-slate-400 truncate">
                      {task.description || 'No description provided.'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {task.attachment && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      <FileText className="w-3 h-3 text-indigo-500" />
                      Attachment
                    </span>
                  )}
                  <span
                    className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                      task.priority === 'HIGH'
                        ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                        : task.priority === 'MEDIUM'
                        ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                        : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                    }`}
                  >
                    {task.priority}
                  </span>
                  <span className="text-xs text-slate-400 w-16 text-right">
                    {formatRelativeTime(task.createdAt)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
