export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH';
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'COMPLETED';

export interface TaskAttachment {
  key: string;
  name: string;
  size: number;
  type: string;
  uploadedAt: string;
  downloadUrl?: string;
}

export interface TaskItem {
  taskId: string;
  title: string;
  description: string;
  priority: TaskPriority;
  status: TaskStatus;
  createdAt: string;
  updatedAt: string;
  attachment?: TaskAttachment;
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  priority?: TaskPriority;
  status?: TaskStatus;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  priority?: TaskPriority;
  status?: TaskStatus;
}

export interface ListTasksFilter {
  status?: TaskStatus | 'ALL';
  priority?: TaskPriority | 'ALL';
  search?: string;
  sortBy?: 'createdAt_desc' | 'createdAt_asc' | 'priority' | 'title';
  page?: number;
  pageSize?: number;
}
