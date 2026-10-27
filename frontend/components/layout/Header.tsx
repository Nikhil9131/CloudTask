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
    <header className="h-16 px-4 md:px-6 bg-[#FAF8F2] dark:bg-[#1C1813] border-b border-[#DCD6C0] dark:border-[#332C23] flex items-center justify-between gap-4 sticky top-0 z-10 transition-colors">
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
            className="w-full pl-9 pr-4 py-1.5 text-sm rounded-xl bg-[#F2EFE3] dark:bg-[#231E17] border border-[#DCD6C0] dark:border-[#3D3528] text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#7E6637]/30 focus:border-[#7E6637] transition"
          />
        </div>
      </div>

      {/* Right: Theme Badge, Environment Status, Refresh, and New Task Button */}
      <div className="flex items-center gap-2 md:gap-3">

        {/* Environment Badge */}
        <div
          className={`hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
            isLive
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800'
              : 'bg-[#F2EFE3] text-[#776D5B] border-[#DCD6C0] dark:bg-[#2A241B] dark:text-[#C7BC9F] dark:border-[#3D3528]'
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
              <Laptop className="w-3.5 h-3.5 text-[#7E6637]" />
              <span>Offline / Local Preview</span>
            </>
          )}
        </div>

        {/* Refresh Button */}
        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-[#F2EFE3] dark:hover:bg-[#2A241B] border border-transparent hover:border-[#DCD6C0] dark:hover:border-[#3D3528] transition disabled:opacity-50"
          title="Refresh data from server"
          aria-label="Refresh tasks"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-[#7E6637]' : ''}`} />
        </button>

        {/* Create Task Button */}
        <button
          onClick={onOpenCreateModal}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold text-[#EEEBDA] bg-[#241E17] hover:bg-[#383025] active:bg-[#18140F] shadow-sm shadow-[#241E17]/20 transition-all focus:outline-none focus:ring-2 focus:ring-[#7E6637]/40"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">New Task</span>
        </button>
      </div>
    </header>
  );
}
