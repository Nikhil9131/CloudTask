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
      className={`relative flex flex-col border-r border-[#DCD6C0] dark:border-[#332C23] bg-[#FAF8F2] dark:bg-[#1C1813] transition-all duration-300 z-20 ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-[#DCD6C0] dark:border-[#332C23]">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-10 h-10 rounded-xl bg-[#241E17] dark:bg-[#2A241B] flex items-center justify-center text-[#EEEBDA] font-bold shadow-md shadow-[#241E17]/20 border border-[#3D3528] flex-shrink-0">
            <ShieldCheck className="w-6 h-6 text-[#EEEBDA]" />
          </div>
          {!collapsed && (
            <div className="flex flex-col truncate">
              <span className="font-bold text-slate-900 dark:text-white leading-tight tracking-tight text-base">
                CloudTask
              </span>
              <span className="text-xs text-[#7E6637] dark:text-[#C7BC9F] font-semibold flex items-center gap-1">
                Multi-User Workspace
              </span>
            </div>
          )}
        </div>
        <button
          onClick={onToggleCollapse}
          className="hidden md:flex p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-[#F2EFE3] dark:hover:bg-[#2A241B] transition"
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
                  ? 'bg-[#EEEBDA] text-[#241E17] dark:bg-[#2A241B] dark:text-[#EEEBDA] font-semibold shadow-xs border border-[#DCD6C0] dark:border-[#3D3528]'
                  : 'text-[#5C5343] dark:text-[#C7BC9F] hover:bg-[#F2EFE3] dark:hover:bg-[#251F18] hover:text-[#241E17] dark:hover:text-white'
              } ${collapsed ? 'justify-center px-0' : ''}`}
              title={collapsed ? item.label : undefined}
            >
              <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-[#7E6637] dark:text-[#C7BC9F]' : 'text-[#9B927E]'}`} />
              {!collapsed && (
                <>
                  <span className="flex-1 text-left truncate flex items-center gap-1.5">
                    {item.label}
                    {item.id === 'in_progress' && (item.count || 0) > 0 && (
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" title="Ongoing tasks active" />
                    )}
                  </span>
                  {item.count !== undefined && (
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                        isActive
                          ? 'bg-[#DCD6C0] dark:bg-[#3D3528] text-[#241E17] dark:text-[#EEEBDA]'
                          : 'bg-[#EAE5D4] dark:bg-[#251F18] text-[#5C5343] dark:text-[#C7BC9F]'
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
        <div className="p-4 border-t border-[#DCD6C0] dark:border-[#332C23] text-xs text-slate-500 dark:text-slate-400 space-y-2">
          {/* Active User Indicator */}
          <div className="p-2.5 rounded-xl bg-[#F2EFE3] dark:bg-[#251F18] border border-[#DCD6C0] dark:border-[#332C23] flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#7E6637] text-[#FAF8F2] font-bold text-xs flex items-center justify-center flex-shrink-0 shadow-xs">
              NR
            </div>
            <div className="truncate text-xs flex-1">
              <p className="font-semibold text-slate-800 dark:text-slate-100 truncate leading-tight">Nikhil Rathore</p>
              <p className="text-[10px] text-[#7E6637] dark:text-[#C7BC9F] truncate">Active User • Admin</p>
            </div>
          </div>

          <div className="flex items-center gap-2 font-medium text-slate-700 dark:text-slate-300 pt-1">
            <Server className="w-3.5 h-3.5 text-[#7E6637]" />
            <span>AWS Serverless Stack</span>
          </div>
          <div className="bg-[#F2EFE3] dark:bg-[#251F18] rounded-lg p-2.5 border border-[#DCD6C0] dark:border-[#332C23] space-y-1">
            <div className="flex justify-between">
              <span className="text-[#776D5B]">Workspace:</span>
              <span className="font-mono text-[11px] text-slate-700 dark:text-slate-300">Multi-User</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#776D5B]">Storage:</span>
              <span className="font-mono text-[11px] text-slate-700 dark:text-slate-300">DynamoDB + S3</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#776D5B]">Security:</span>
              <span className="font-mono text-[11px] text-emerald-700 dark:text-emerald-400">Zero Public S3</span>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
