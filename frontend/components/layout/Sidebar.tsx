'use client';

import React from 'react';
import {
  LayoutDashboard,
  CheckSquare,
  Clock,
  PlayCircle,
  CheckCircle2,
  FileText,
  Layers,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Server
} from 'lucide-react';

export type NavTab = 'dashboard' | 'all' | 'todo' | 'in_progress' | 'completed' | 'documents' | 'architecture';

interface SidebarProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  counts: {
    total: number;
    todo: number;
    inProgress: number;
    completed: number;
    documents: number;
  };
}

export function Sidebar({
  activeTab,
  onTabChange,
  collapsed,
  onToggleCollapse,
  counts
}: SidebarProps) {
  const navItems = [
    { id: 'dashboard' as NavTab, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'all' as NavTab, label: 'All Tasks', icon: CheckSquare, count: counts.total },
    { id: 'todo' as NavTab, label: 'To Do', icon: Clock, count: counts.todo },
    { id: 'in_progress' as NavTab, label: 'In Progress', icon: PlayCircle, count: counts.inProgress },
    { id: 'completed' as NavTab, label: 'Completed', icon: CheckCircle2, count: counts.completed },
    { id: 'documents' as NavTab, label: 'Documents', icon: FileText, count: counts.documents },
    { id: 'architecture' as NavTab, label: 'AWS Architecture', icon: Layers }
  ];

  return (
    <aside
      className={`relative flex flex-col border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 transition-all duration-300 z-20 ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold shadow-md shadow-indigo-500/20 flex-shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          {!collapsed && (
            <div className="flex flex-col truncate">
              <span className="font-bold text-slate-900 dark:text-white leading-tight tracking-tight text-base">
                CloudTask
              </span>
              <span className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                Cybernetics Assessment
              </span>
            </div>
          )}
        </div>
        <button
          onClick={onToggleCollapse}
          className="hidden md:flex p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation List */}
      <div className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 font-semibold shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-slate-200'
              } ${collapsed ? 'justify-center px-0' : ''}`}
              title={collapsed ? item.label : undefined}
            >
              <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`} />
              {!collapsed && (
                <>
                  <span className="flex-1 text-left truncate">{item.label}</span>
                  {item.count !== undefined && (
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                        isActive
                          ? 'bg-indigo-200/60 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {item.count}
                    </span>
                  )}
                </>
              )}
            </button>
          );
        })}
      </div>

      {/* Footer Info Box */}
      {!collapsed && (
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 space-y-2">
          <div className="flex items-center gap-2 font-medium text-slate-700 dark:text-slate-300">
            <Server className="w-3.5 h-3.5 text-indigo-500" />
            <span>AWS Serverless Stack</span>
          </div>
          <div className="bg-slate-50 dark:bg-slate-900/80 rounded-lg p-2.5 border border-slate-200/80 dark:border-slate-800 space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-400">Region:</span>
              <span className="font-mono text-[11px] text-slate-700 dark:text-slate-300">ap-south-1</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Storage:</span>
              <span className="font-mono text-[11px] text-slate-700 dark:text-slate-300">DynamoDB + S3</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Security:</span>
              <span className="font-mono text-[11px] text-emerald-600 dark:text-emerald-400">Zero Public S3</span>
            </div>
          </div>
          <p className="text-[11px] leading-tight text-slate-400">
            Candidate Assessment Demo (Single User). Non-sensitive evaluation data.
          </p>
        </div>
      )}
    </aside>
  );
}
