'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  Search,
  Filter,
  ArrowUpDown,
  FileText,
  Edit3,
  Trash2,
  Eye,
  CheckCircle2,
  Clock,
  PlayCircle,
  LayoutGrid,
  List as ListIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  CheckSquare,
  Users,
  User as UserIcon
} from 'lucide-react';
import { TaskItem, TaskPriority, TaskStatus, WORKSPACE_USERS } from '../../lib/types';
import { formatDate, formatRelativeTime, formatBytes } from '../../lib/utils';

interface TaskListProps {
  tasks: TaskItem[];
  isLoading: boolean;
  onSelectTask: (task: TaskItem) => void;
  onEditTask: (task: TaskItem) => void;
  onDeleteTask: (task: TaskItem) => void;
  onStatusChange: (taskId: string, newStatus: TaskStatus) => void;
  onOpenCreateModal: () => void;
  initialStatusFilter?: TaskStatus | 'ALL';
}

export function TaskList({
  tasks,
  isLoading,
  onSelectTask,
  onEditTask,
  onDeleteTask,
  onStatusChange,
  onOpenCreateModal,
  initialStatusFilter = 'ALL'
}: TaskListProps) {
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'ALL'>(initialStatusFilter);
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | 'ALL'>('ALL');
  const [assigneeFilter, setAssigneeFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'createdAt_desc' | 'createdAt_asc' | 'priority' | 'title'>('createdAt_desc');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Synchronize status filter when prop changes (e.g. navigation via sidebar)
  useEffect(() => {
    setStatusFilter(initialStatusFilter);
    setCurrentPage(1);
  }, [initialStatusFilter]);

  // Filter and Sort Pipeline
  const filteredTasks = useMemo(() => {
    return tasks
      .filter((task) => {
        if (statusFilter !== 'ALL' && task.status !== statusFilter) return false;
        if (priorityFilter !== 'ALL' && task.priority !== priorityFilter) return false;
        if (assigneeFilter !== 'ALL') {
          if (!task.assignee || task.assignee !== assigneeFilter) return false;
        }
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchTitle = task.title.toLowerCase().includes(q);
          const matchDesc = task.description.toLowerCase().includes(q);
          const matchAssignee = task.assignee?.toLowerCase().includes(q);
          const matchAttachment = task.attachment?.name.toLowerCase().includes(q);
          if (!matchTitle && !matchDesc && !matchAttachment && !matchAssignee) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'createdAt_desc') {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        if (sortBy === 'createdAt_asc') {
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        }
        if (sortBy === 'priority') {
          const weights: Record<TaskPriority, number> = { HIGH: 3, MEDIUM: 2, LOW: 1 };
          return weights[b.priority] - weights[a.priority];
        }
        if (sortBy === 'title') {
          return a.title.localeCompare(b.title);
        }
        return 0;
      });
  }, [tasks, statusFilter, priorityFilter, assigneeFilter, searchQuery, sortBy]);

  // Pagination slice
  const totalPages = Math.max(1, Math.ceil(filteredTasks.length / pageSize));
  const paginatedTasks = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredTasks.slice(start, start + pageSize);
  }, [filteredTasks, currentPage, pageSize]);

  return (
    <div className="space-y-4">
      {/* Controls Bar */}
      <div className="p-4 rounded-2xl bg-[#FAF8F2] dark:bg-[#1C1813] border border-[#DCD6C0] dark:border-[#332C23] shadow-sm space-y-3">
        {/* Row 1: Search & Status Tabs */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            {(['ALL', 'TODO', 'IN_PROGRESS', 'COMPLETED'] as const).map((st) => (
              <button
                key={st}
                onClick={() => {
                  setStatusFilter(st);
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  statusFilter === st
                    ? 'bg-[#241E17] text-[#EEEBDA] dark:bg-[#EEEBDA] dark:text-[#241E17] shadow-sm'
                    : 'bg-[#F2EFE3] dark:bg-[#251F18] text-[#5C5343] dark:text-[#C7BC9F] hover:bg-[#EAE5D4] dark:hover:bg-[#2E271F]'
                }`}
              >
                {st === 'ALL' && <span>All Statuses</span>}
                {st === 'TODO' && (
                  <>
                    <Clock className="w-3.5 h-3.5 opacity-70" />
                    <span>To Do</span>
                  </>
                )}
                {st === 'IN_PROGRESS' && (
                  <>
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                    <span>In Progress (Ongoing)</span>
                  </>
                )}
                {st === 'COMPLETED' && (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Completed</span>
                  </>
                )}
              </button>
            ))}
          </div>

          {/* Quick Search */}
          <div className="relative w-full md:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Filter tasks or member..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-[#F2EFE3] dark:bg-[#231E17] border border-[#DCD6C0] dark:border-[#3D3528] text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#7E6637]/30"
            />
          </div>
        </div>

        {/* Row 2: Secondary Filters & View Switcher */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#DCD6C0] dark:border-[#332C23] text-xs">
          <div className="flex flex-wrap items-center gap-2">
            {/* Priority Filter */}
            <div className="flex items-center gap-1.5 text-slate-500">
              <Filter className="w-3.5 h-3.5 text-[#7E6637]" />
              <select
                value={priorityFilter}
                onChange={(e) => {
                  setPriorityFilter(e.target.value as any);
                  setCurrentPage(1);
                }}
                className="py-1 px-2 rounded-lg bg-[#F2EFE3] dark:bg-[#231E17] border border-[#DCD6C0] dark:border-[#3D3528] text-slate-700 dark:text-slate-300 focus:outline-none font-medium text-xs"
              >
                <option value="ALL">All Priorities</option>
                <option value="HIGH">High Priority</option>
                <option value="MEDIUM">Medium Priority</option>
                <option value="LOW">Low Priority</option>
              </select>
            </div>

            {/* Multi-User Assignee Filter */}
            <div className="flex items-center gap-1.5 text-slate-500">
              <Users className="w-3.5 h-3.5 text-[#7E6637]" />
              <select
                value={assigneeFilter}
                onChange={(e) => {
                  setAssigneeFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="py-1 px-2 rounded-lg bg-[#F2EFE3] dark:bg-[#231E17] border border-[#DCD6C0] dark:border-[#3D3528] text-slate-700 dark:text-slate-300 focus:outline-none font-medium text-xs"
              >
                <option value="ALL">All Members ({WORKSPACE_USERS.length})</option>
                {WORKSPACE_USERS.map((u) => (
                  <option key={u.id} value={u.name}>
                    {u.name} ({u.role.split(' ')[0]})
                  </option>
                ))}
              </select>
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-1.5 text-slate-500">
              <ArrowUpDown className="w-3.5 h-3.5 text-[#7E6637]" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="py-1 px-2 rounded-lg bg-[#F2EFE3] dark:bg-[#231E17] border border-[#DCD6C0] dark:border-[#3D3528] text-slate-700 dark:text-slate-300 focus:outline-none font-medium text-xs"
              >
                <option value="createdAt_desc">Newest First</option>
                <option value="createdAt_asc">Oldest First</option>
                <option value="priority">Priority (High to Low)</option>
                <option value="title">Title (A-Z)</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-400 text-xs hidden sm:inline">
              Showing {paginatedTasks.length} of {filteredTasks.length}
            </span>

            {/* View Mode Toggle */}
            <div className="flex items-center rounded-lg border border-slate-200 dark:border-slate-800 p-0.5 bg-slate-50 dark:bg-slate-950">
              <button
                onClick={() => setViewMode('table')}
                className={`p-1 rounded-md transition ${
                  viewMode === 'table'
                    ? 'bg-white dark:bg-slate-800 text-indigo-600 shadow-sm'
                    : 'text-slate-400 hover:text-slate-700'
                }`}
                title="Table View"
                aria-label="Table View"
              >
                <ListIcon className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1 rounded-md transition ${
                  viewMode === 'grid'
                    ? 'bg-white dark:bg-slate-800 text-indigo-600 shadow-sm'
                    : 'text-slate-400 hover:text-slate-700'
                }`}
                title="Card Grid View"
                aria-label="Grid View"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="p-6 rounded-2xl bg-[#FAF8F2] dark:bg-[#1C1813] border border-[#DCD6C0] dark:border-[#332C23] space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="animate-pulse flex items-center justify-between gap-4 py-3">
              <div className="flex items-center gap-3 flex-1">
                <div className="w-4 h-4 bg-slate-200 dark:bg-slate-800 rounded" />
                <div className="space-y-1.5 flex-1">
                  <div className="w-1/3 h-4 bg-slate-200 dark:bg-slate-800 rounded" />
                  <div className="w-1/2 h-3 bg-slate-100 dark:bg-slate-800/60 rounded" />
                </div>
              </div>
              <div className="w-20 h-6 bg-slate-200 dark:bg-slate-800 rounded-full" />
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && filteredTasks.length === 0 && (
        <div className="p-12 text-center rounded-2xl bg-[#FAF8F2] dark:bg-[#1C1813] border border-[#DCD6C0] dark:border-[#332C23] shadow-sm space-y-3">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-[#EEEBDA] dark:bg-[#2A241B] text-[#7E6637] dark:text-[#C7BC9F] flex items-center justify-center border border-[#DCD6C0] dark:border-[#3D3528]">
            <CheckSquare className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800 dark:text-white">
            No matching tasks found
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {searchQuery || statusFilter !== 'ALL' || priorityFilter !== 'ALL'
              ? 'Try adjusting your search filters to find what you are looking for.'
              : 'Create your first task to start tracking deliverables, deadlines, and attachments.'}
          </p>
          <div className="pt-2">
            <button
              onClick={onOpenCreateModal}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-[#EEEBDA] bg-[#241E17] hover:bg-[#383025] shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create New Task</span>
            </button>
          </div>
        </div>
      )}

      {/* Table View */}
      {!isLoading && filteredTasks.length > 0 && viewMode === 'table' && (
        <div className="rounded-2xl bg-[#FAF8F2] dark:bg-[#1C1813] border border-[#DCD6C0] dark:border-[#332C23] shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#DCD6C0] dark:border-[#332C23] bg-[#F2EFE3]/80 dark:bg-[#231E17]/80 text-[#5C5343] font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4 w-10">Done</th>
                  <th className="py-3 px-4">Task</th>
                  <th className="py-3 px-4 w-44">Status</th>
                  <th className="py-3 px-4 w-28">Priority</th>
                  <th className="py-3 px-4 w-36">Assignee</th>
                  <th className="py-3 px-4 w-32">Document</th>
                  <th className="py-3 px-4 w-28">Created</th>
                  <th className="py-3 px-4 w-24 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {paginatedTasks.map((task) => (
                  <tr
                    key={task.taskId}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition group"
                  >
                    {/* Mark Complete Checkbox */}
                    <td className="py-3 px-4">
                      <button
                        onClick={() =>
                          onStatusChange(
                            task.taskId,
                            task.status === 'COMPLETED' ? 'TODO' : 'COMPLETED'
                          )
                        }
                        className={`w-5 h-5 rounded-md flex items-center justify-center border transition ${
                          task.status === 'COMPLETED'
                            ? 'bg-emerald-600 border-emerald-600 text-white'
                            : 'border-slate-300 dark:border-slate-700 hover:border-emerald-500 text-transparent'
                        }`}
                        title={task.status === 'COMPLETED' ? 'Mark as Incomplete' : 'Mark as Completed'}
                        aria-label="Toggle task completion"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </button>
                    </td>

                    {/* Title and snippet */}
                    <td className="py-3 px-4">
                      <div
                        onClick={() => onSelectTask(task)}
                        className="cursor-pointer max-w-md"
                      >
                        <div
                          className={`font-semibold text-sm leading-tight transition ${
                            task.status === 'COMPLETED'
                              ? 'line-through text-slate-400 dark:text-slate-500'
                              : 'text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400'
                          }`}
                        >
                          {task.title}
                        </div>
                        {task.description && (
                          <div className="text-slate-500 dark:text-slate-400 truncate mt-0.5 max-w-sm">
                            {task.description}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Status Dropdown with Ongoing Indicator */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <select
                          value={task.status}
                          onChange={(e) => onStatusChange(task.taskId, e.target.value as TaskStatus)}
                          className={`text-[11px] font-semibold py-1 px-2 rounded-lg border focus:outline-none cursor-pointer ${
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
                    </td>

                    {/* Priority Badge */}
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                          task.priority === 'HIGH'
                            ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                            : task.priority === 'MEDIUM'
                            ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                            : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                        }`}
                      >
                        {task.priority}
                      </span>
                    </td>

                    {/* Multi-User Assignee Column */}
                    <td className="py-3 px-4">
                      {(() => {
                        const user = WORKSPACE_USERS.find((u) => u.name === task.assignee) || {
                          name: task.assignee || 'Unassigned',
                          initials: (task.assignee || 'UN').split(' ').map((p) => p[0]).join('').substring(0, 2).toUpperCase(),
                          color: 'bg-[#7E6637] text-white',
                          role: 'Team Member'
                        };
                        return (
                          <div className="flex items-center gap-2 max-w-[140px]" title={`${user.name} • ${task.assigneeEmail || ''}`}>
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] flex-shrink-0 shadow-xs ${user.color}`}>
                              {user.initials}
                            </div>
                            <span className="truncate text-slate-800 dark:text-slate-200 font-medium text-xs">
                              {user.name.split(' ')[0]}
                            </span>
                          </div>
                        );
                      })()}
                    </td>

                    {/* Document Attachment */}
                    <td className="py-3 px-4">
                      {task.attachment ? (
                        <button
                          onClick={() => onSelectTask(task)}
                          className="inline-flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 font-medium hover:underline max-w-[130px] truncate"
                          title={`${task.attachment.name} (${formatBytes(task.attachment.size)})`}
                        >
                          <FileText className="w-3.5 h-3.5 flex-shrink-0" />
                          <span className="truncate">{task.attachment.name}</span>
                        </button>
                      ) : (
                        <span className="text-slate-300 dark:text-slate-700">—</span>
                      )}
                    </td>

                    {/* Created Date */}
                    <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                      {formatRelativeTime(task.createdAt)}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => onSelectTask(task)}
                          className="p-1 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 transition"
                          title="View Details"
                          aria-label="View Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onEditTask(task)}
                          className="p-1 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/50 transition"
                          title="Edit Task"
                          aria-label="Edit Task"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDeleteTask(task)}
                          className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition"
                          title="Delete Task"
                          aria-label="Delete Task"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Grid Card View */}
      {!isLoading && filteredTasks.length > 0 && viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {paginatedTasks.map((task) => (
            <div
              key={task.taskId}
              className="p-5 rounded-2xl bg-[#FAF8F2] dark:bg-[#1C1813] border border-[#DCD6C0] dark:border-[#332C23] shadow-sm flex flex-col justify-between space-y-3 hover:border-[#BDB18F] dark:hover:border-[#7E6637] transition group"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        task.priority === 'HIGH'
                          ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                          : task.priority === 'MEDIUM'
                          ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                          : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                      }`}
                    >
                      {task.priority}
                    </span>
                    {task.status === 'IN_PROGRESS' && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-950/60 dark:text-amber-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                        Ongoing
                      </span>
                    )}
                  </div>
                  <select
                    value={task.status}
                    onChange={(e) => onStatusChange(task.taskId, e.target.value as TaskStatus)}
                    className="text-[10px] font-semibold py-0.5 px-1.5 rounded-md border border-[#DCD6C0] dark:border-[#3D3528] bg-[#F2EFE3] dark:bg-[#251F18] text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer"
                  >
                    <option value="TODO">To Do</option>
                    <option value="IN_PROGRESS">In Progress (Ongoing)</option>
                    <option value="COMPLETED">Completed</option>
                  </select>
                </div>

                <h4
                  onClick={() => onSelectTask(task)}
                  className={`font-bold text-sm leading-snug cursor-pointer group-hover:text-indigo-600 dark:group-hover:text-indigo-400 ${
                    task.status === 'COMPLETED' ? 'line-through text-slate-400' : 'text-slate-900 dark:text-white'
                  }`}
                >
                  {task.title}
                </h4>

                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-3">
                  {task.description || 'No description provided.'}
                </p>

                {/* Multi-User Assignee in Card */}
                {(() => {
                  const user = WORKSPACE_USERS.find((u) => u.name === task.assignee) || {
                    name: task.assignee || 'Unassigned',
                    initials: (task.assignee || 'UN').split(' ').map((p) => p[0]).join('').substring(0, 2).toUpperCase(),
                    color: 'bg-[#7E6637] text-white',
                    role: 'Team Member'
                  };
                  return (
                    <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-[#DCD6C0]/40 dark:border-[#332C23]">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[9px] flex-shrink-0 ${user.color}`}>
                        {user.initials}
                      </div>
                      <span className="text-[11px] text-slate-600 dark:text-slate-300 font-medium truncate">
                        {user.name}
                      </span>
                    </div>
                  );
                })()}
              </div>

              <div className="pt-3 border-t border-[#DCD6C0] dark:border-[#332C23] flex items-center justify-between text-xs text-slate-400">
                <div className="flex items-center gap-1.5">
                  {task.attachment && (
                    <span
                      onClick={() => onSelectTask(task)}
                      className="cursor-pointer inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      Document
                    </span>
                  )}
                  <span>{formatRelativeTime(task.createdAt)}</span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onEditTask(task)}
                    className="p-1 rounded text-slate-400 hover:text-amber-600"
                    title="Edit"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onDeleteTask(task)}
                    className="p-1 rounded text-slate-400 hover:text-rose-600"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination Bar */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-2 text-xs text-slate-500">
          <span>
            Page {currentPage} of {totalPages}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 transition"
              aria-label="Previous Page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 transition"
              aria-label="Next Page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
