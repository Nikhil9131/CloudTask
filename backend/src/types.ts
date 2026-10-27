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

export interface ListTasksQuery {
  status?: TaskStatus;
  priority?: TaskPriority;
  search?: string;
  limit?: number;
  nextToken?: string;
}

export interface ListTasksResponse {
  tasks: TaskItem[];
  nextToken?: string;
  total?: number;
}

export interface GenerateUploadUrlInput {
  filename: string;
  contentType: string;
  size: number;
}

export interface GenerateUploadUrlResponse {
  uploadUrl: string;
  key: string;
  expiresIn: number;
}

export interface ConfirmAttachmentInput {
  key: string;
  name: string;
  size: number;
  type: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
