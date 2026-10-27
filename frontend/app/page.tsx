'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Sidebar, NavTab } from '../components/layout/Sidebar';
import { Header } from '../components/layout/Header';
import { StatCards } from '../components/dashboard/StatCards';
import { TaskList } from '../components/tasks/TaskList';
import { TaskModal } from '../components/tasks/TaskModal';
import { TaskDetailsModal } from '../components/tasks/TaskDetailsModal';
import { DeleteConfirmModal } from '../components/tasks/DeleteConfirmModal';
import { DocumentsView } from '../components/documents/DocumentsView';
import { ArchitectureModal } from '../components/architecture/ArchitectureModal';
import { api, isUsingLiveApi } from '../lib/api';
import { TaskItem, TaskStatus, CreateTaskInput, UpdateTaskInput } from '../lib/types';
import { useToast } from '../components/ui/ToastContext';

export default function CloudTaskApp() {
  const { showToast } = useToast();

  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');

  // Modals state
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<TaskItem | null>(null);
  const [taskToView, setTaskToView] = useState<TaskItem | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<TaskItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch all tasks
  const loadTasks = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await api.getTasks();
      setTasks(res.tasks || []);
    } catch (err: any) {
      console.error('Failed to load tasks:', err);
      showToast(err.message || 'Error connecting to task service.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  // Derived counts for sidebar
  const counts = useMemo(() => {
    return {
      total: tasks.length,
      todo: tasks.filter((t) => t.status === 'TODO').length,
      inProgress: tasks.filter((t) => t.status === 'IN_PROGRESS').length,
      completed: tasks.filter((t) => t.status === 'COMPLETED').length,
      documents: tasks.filter((t) => Boolean(t.attachment)).length
    };
  }, [tasks]);

  // Status Change Handler
  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    try {
      // Optimistic update
      setTasks((prev) =>
        prev.map((t) => (t.taskId === taskId ? { ...t, status: newStatus } : t))
      );

      await api.updateTask(taskId, { status: newStatus });
      showToast(`Task status updated to ${newStatus.replace('_', ' ')}.`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to update status.', 'error');
      loadTasks(); // rollback on error
    }
  };

  // Submit Handler (Create or Edit)
  const handleTaskSubmit = async (
    data: CreateTaskInput | UpdateTaskInput,
    file?: File | null
  ) => {
    if (taskToEdit) {
      // Update existing task
      const updated = await api.updateTask(taskToEdit.taskId, data);
      let finalTask = updated;

      if (file) {
        showToast('Uploading document to private S3 bucket...', 'info');
        finalTask = await api.uploadAttachment(taskToEdit.taskId, file);
      }

      setTasks((prev) =>
        prev.map((t) => (t.taskId === finalTask.taskId ? finalTask : t))
      );
      showToast('Task updated successfully.', 'success');
    } else {
      // Create new task
      const created = await api.createTask(data as CreateTaskInput);
      let finalTask = created;

      if (file) {
        showToast('Uploading document to private S3 bucket...', 'info');
        finalTask = await api.uploadAttachment(created.taskId, file);
      }

      setTasks((prev) => [finalTask, ...prev]);
      showToast('Task created successfully.', 'success');
    }

    setTaskToEdit(null);
  };

  // Delete Handler
  const handleDeleteConfirm = async () => {
    if (!taskToDelete) return;
    setIsDeleting(true);
    try {
      await api.deleteTask(taskToDelete.taskId);
      setTasks((prev) => prev.filter((t) => t.taskId !== taskToDelete.taskId));
      showToast('Task and associated attachment deleted.', 'success');
      setTaskToDelete(null);
      if (taskToView?.taskId === taskToDelete.taskId) {
        setTaskToView(null);
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to delete task.', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  // Header Title & Subtitle based on active tab
  const tabTitles: Record<NavTab, { title: string; subtitle: string }> = {
    dashboard: {
      title: 'Executive Dashboard',
      subtitle: 'Real-time task distribution and S3 storage metrics'
    },
    all: {
      title: 'Task Directory',
      subtitle: 'Complete list of all deliverables, statuses, and priorities'
    },
    todo: {
      title: 'Pending Deliverables',
      subtitle: 'Tasks queued for development and assessment'
    },
    in_progress: {
      title: 'Active Tasks',
      subtitle: 'Deliverables currently in progress'
    },
    completed: {
      title: 'Completed Deliverables',
      subtitle: 'Successfully finished and verified tasks'
    },
    documents: {
      title: 'Document Management',
      subtitle: 'S3 attachments, PDF reports, and image specifications'
    },
    architecture: {
      title: 'AWS Serverless Architecture',
      subtitle: 'Least-privilege security model, IAM policies, and infrastructure design'
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950">
      {/* Desktop & Tablet Sidebar */}
      <div className="hidden md:flex flex-shrink-0">
        <Sidebar
          activeTab={activeTab}
          onTabChange={(tab) => {
            setActiveTab(tab);
          }}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed((c) => !c)}
          counts={counts}
        />
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm md:hidden animate-in fade-in"
          onClick={() => setMobileMenuOpen(false)}
        >
          <div
            className="w-64 h-full bg-white dark:bg-slate-950 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <Sidebar
              activeTab={activeTab}
              onTabChange={(tab) => {
                setActiveTab(tab);
                setMobileMenuOpen(false);
              }}
              collapsed={false}
              onToggleCollapse={() => setMobileMenuOpen(false)}
              counts={counts}
            />
          </div>
        </div>
      )}

      {/* Main Workspace Layout */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <Header
          title={tabTitles[activeTab].title}
          subtitle={tabTitles[activeTab].subtitle}
          searchQuery={globalSearch}
          onSearchChange={setGlobalSearch}
          onOpenCreateModal={() => {
            setTaskToEdit(null);
            setIsTaskModalOpen(true);
          }}
          onRefresh={loadTasks}
          isLoading={isLoading}
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
        />

        {/* Scrollable Page Body */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 space-y-6">
          {/* Dashboard View */}
          {activeTab === 'dashboard' && (
            <StatCards
              tasks={tasks}
              onSelectTask={(task) => setTaskToView(task)}
              onNavigateToTasks={() => setActiveTab('all')}
              onNavigateToDocuments={() => setActiveTab('documents')}
            />
          )}

          {/* All Tasks View */}
          {activeTab === 'all' && (
            <TaskList
              tasks={tasks}
              isLoading={isLoading}
              onSelectTask={(task) => setTaskToView(task)}
              onEditTask={(task) => {
                setTaskToEdit(task);
                setIsTaskModalOpen(true);
              }}
              onDeleteTask={(task) => setTaskToDelete(task)}
              onStatusChange={handleStatusChange}
              onOpenCreateModal={() => {
                setTaskToEdit(null);
                setIsTaskModalOpen(true);
              }}
              initialStatusFilter="ALL"
            />
          )}

          {/* To Do (Pending) Tab */}
          {activeTab === 'todo' && (
            <TaskList
              tasks={tasks}
              isLoading={isLoading}
              onSelectTask={(task) => setTaskToView(task)}
              onEditTask={(task) => {
                setTaskToEdit(task);
                setIsTaskModalOpen(true);
              }}
              onDeleteTask={(task) => setTaskToDelete(task)}
              onStatusChange={handleStatusChange}
              onOpenCreateModal={() => {
                setTaskToEdit(null);
                setIsTaskModalOpen(true);
              }}
              initialStatusFilter="TODO"
            />
          )}

          {/* In Progress Tab */}
          {activeTab === 'in_progress' && (
            <TaskList
              tasks={tasks}
              isLoading={isLoading}
              onSelectTask={(task) => setTaskToView(task)}
              onEditTask={(task) => {
                setTaskToEdit(task);
                setIsTaskModalOpen(true);
              }}
              onDeleteTask={(task) => setTaskToDelete(task)}
              onStatusChange={handleStatusChange}
              onOpenCreateModal={() => {
                setTaskToEdit(null);
                setIsTaskModalOpen(true);
              }}
              initialStatusFilter="IN_PROGRESS"
            />
          )}

          {/* Completed Tab */}
          {activeTab === 'completed' && (
            <TaskList
              tasks={tasks}
              isLoading={isLoading}
              onSelectTask={(task) => setTaskToView(task)}
              onEditTask={(task) => {
                setTaskToEdit(task);
                setIsTaskModalOpen(true);
              }}
              onDeleteTask={(task) => setTaskToDelete(task)}
              onStatusChange={handleStatusChange}
              onOpenCreateModal={() => {
                setTaskToEdit(null);
                setIsTaskModalOpen(true);
              }}
              initialStatusFilter="COMPLETED"
            />
          )}

          {/* Documents Tab */}
          {activeTab === 'documents' && (
            <DocumentsView
              tasks={tasks}
              onSelectTask={(task) => setTaskToView(task)}
            />
          )}

          {/* AWS Architecture Tab */}
          {activeTab === 'architecture' && <ArchitectureModal />}
        </main>
      </div>

      {/* Create / Edit Task Modal */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => {
          setIsTaskModalOpen(false);
          setTaskToEdit(null);
        }}
        taskToEdit={taskToEdit}
        onSubmit={handleTaskSubmit}
      />

      {/* Task Details Modal */}
      <TaskDetailsModal
        isOpen={Boolean(taskToView)}
        task={taskToView}
        onClose={() => setTaskToView(null)}
        onEdit={(task) => {
          setTaskToView(null);
          setTaskToEdit(task);
          setIsTaskModalOpen(true);
        }}
        onDelete={(task) => {
          setTaskToView(null);
          setTaskToDelete(task);
        }}
        onStatusChange={handleStatusChange}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={Boolean(taskToDelete)}
        task={taskToDelete}
        onClose={() => setTaskToDelete(null)}
        onConfirm={handleDeleteConfirm}
        isDeleting={isDeleting}
      />
    </div>
  );
}
