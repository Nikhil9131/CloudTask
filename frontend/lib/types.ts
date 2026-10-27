export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH';
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'COMPLETED';

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  initials: string;
  color: string;
}

export const WORKSPACE_USERS: User[] = [
  { id: 'usr_1', name: 'Nikhil Rathore', email: 'nikhil@cloudtask.io', role: 'Lead Developer (Admin)', initials: 'NR', color: 'bg-[#7E6637] text-[#FAF8F2]' },
  { id: 'usr_2', name: 'Aarav Sharma', email: 'aarav@cloudtask.io', role: 'Backend Engineer', initials: 'AS', color: 'bg-[#483F2C] text-[#FAF8F2]' },
  { id: 'usr_3', name: 'Priya Patel', email: 'priya@cloudtask.io', role: 'Cloud & DevOps Architect', initials: 'PP', color: 'bg-[#2A5E3A] text-[#FAF8F2]' },
  { id: 'usr_4', name: 'Rohan Mehta', email: 'rohan@cloudtask.io', role: 'Frontend Engineer', initials: 'RM', color: 'bg-[#254562] text-[#FAF8F2]' },
  { id: 'usr_5', name: 'Sneha Verma', email: 'sneha@cloudtask.io', role: 'Product Manager', initials: 'SV', color: 'bg-[#7A3E2E] text-[#FAF8F2]' }
];

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
  assignee?: string;
  assigneeEmail?: string;
  createdAt: string;
  updatedAt: string;
  attachment?: TaskAttachment;
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  priority?: TaskPriority;
  status?: TaskStatus;
  assignee?: string;
  assigneeEmail?: string;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  priority?: TaskPriority;
  status?: TaskStatus;
  assignee?: string;
  assigneeEmail?: string;
}

export interface ListTasksFilter {
  status?: TaskStatus | 'ALL';
  priority?: TaskPriority | 'ALL';
  assignee?: string | 'ALL';
  search?: string;
  sortBy?: 'createdAt_desc' | 'createdAt_asc' | 'priority' | 'title';
  page?: number;
  pageSize?: number;
}
