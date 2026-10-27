'use client';

import React from 'react';
import { Plus, Search, RefreshCw, Menu, Cloud, Laptop, ExternalLink } from 'lucide-react';
import { isUsingLiveApi, getApiBaseUrl } from '../../lib/api';

interface HeaderProps {
  title: string;
  subtitle?: string;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onOpenCreateModal: () => void;
  onRefresh: () => void;
  isLoading?: boolean;
  onOpenMobileMenu: () => void;
}

export function Header({
  title,
  subtitle,
  searchQuery,
  onSearchChange,
  onOpenCreateModal,
  onRefresh,
  isLoading,
  onOpenMobileMenu
}: HeaderProps) {
  const isLive = isUsingLiveApi();
  const apiUrl = getApiBaseUrl();

  return (
    <header className="h-16 px-4 md:px-6 bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4 sticky top-0 z-10">
      {/* Left: Mobile trigger & Page Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileMenu}
          className="md:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-lg md:text-xl font-bold text-slate-900 dark:text-white leading-tight">
            {title}
          </h1>
          {subtitle && (
            <p className="hidden sm:block text-xs text-slate-500 dark:text-slate-400">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Center: Search Bar */}
      <div className="flex-1 max-w-md hidden sm:block">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search tasks by title or details..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-sm rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
          />
        </div>
      </div>

      {/* Right: Environment Status, Refresh, and New Task Button */}
      <div className="flex items-center gap-2 md:gap-3">
        {/* Environment Badge */}
        <div
          className={`hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
            isLive
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800'
              : 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/50 dark:text-indigo-300 dark:border-indigo-800'
          }`}
          title={isLive ? `Connected to API Gateway: ${apiUrl}` : 'Operating in local preview storage mode'}
        >
          {isLive ? (
            <>
              <Cloud className="w-3.5 h-3.5 text-emerald-500" />
              <span>AWS API Gateway (ap-south-1)</span>
            </>
          ) : (
            <>
              <Laptop className="w-3.5 h-3.5 text-indigo-500" />
              <span>Offline / Local Preview</span>
            </>
          )}
        </div>

        {/* Refresh Button */}
        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900 border border-transparent hover:border-slate-200 dark:hover:border-slate-800 transition disabled:opacity-50"
          title="Refresh data from server"
          aria-label="Refresh tasks"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-indigo-600' : ''}`} />
        </button>

        {/* Create Task Button */}
        <button
          onClick={onOpenCreateModal}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 shadow-sm shadow-indigo-600/30 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">New Task</span>
        </button>
      </div>
    </header>
  );
}
