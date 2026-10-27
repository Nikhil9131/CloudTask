import {
  TaskItem,
  CreateTaskInput,
  UpdateTaskInput,
  TaskStatus,
  TaskPriority
} from './types';

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/+$/, '');

export function isUsingLiveApi(): boolean {
  return Boolean(API_BASE_URL);
}

export function getApiBaseUrl(): string {
  return API_BASE_URL;
}

// ============================================================================
// Local In-Memory / LocalStorage Mock Store for offline & initial demo review
// ============================================================================
const STORAGE_KEY = 'cloudtask_local_tasks_v1';

const INITIAL_DEMO_TASKS: TaskItem[] = [
  {
    taskId: 'task_demo_001',
    title: 'Configure AWS SAM template and DynamoDB table',
    description: 'Ensure CloudTaskTasks table uses on-demand billing, with StatusCreatedAtIndex GSI for efficient queries.',
    priority: 'HIGH',
    status: 'COMPLETED',
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 20).toISOString()
  },
  {
    taskId: 'task_demo_002',
    title: 'Implement private S3 bucket and presigned upload flow',
    description: 'Enforce PDF, PNG, and JPEG constraints with 5MB ceiling. Direct browser-to-S3 upload with validation.',
    priority: 'HIGH',
    status: 'COMPLETED',
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 6).toISOString()
  },
  {
    taskId: 'task_demo_003',
    title: 'Review Cybernetics Software assessment submission checklist',
    description: 'Verify deployment instructions, tests, Mermaid architecture diagram, and security best practices in README.',
    priority: 'MEDIUM',
    status: 'IN_PROGRESS',
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 2).toISOString()
  },
  {
    taskId: 'task_demo_004',
    title: 'Deploy to AWS Amplify Hosting via GitHub',
    description: 'Connect repository to Amplify Hosting in ap-south-1 Mumbai, configure build settings, and verify public HTTPS URL.',
    priority: 'HIGH',
    status: 'TODO',
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    updatedAt: new Date(Date.now() - 3600000).toISOString()
  }
];

function getLocalTasks(): TaskItem[] {
  if (typeof window === 'undefined') return INITIAL_DEMO_TASKS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_DEMO_TASKS));
      return INITIAL_DEMO_TASKS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_DEMO_TASKS;
  }
}

function saveLocalTasks(tasks: TaskItem[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  } catch (err) {
    console.error('Failed to save to local storage', err);
  }
}

// ============================================================================
// API Client Implementation
// ============================================================================
export const api = {
  /**
   * Fetch tasks with optional filters
   */
  async getTasks(params?: {
    status?: TaskStatus;
    priority?: TaskPriority;
    search?: string;
    limit?: number;
    nextToken?: string;
  }): Promise<{ tasks: TaskItem[]; nextToken?: string; total: number }> {
    if (!isUsingLiveApi()) {
      let tasks = getLocalTasks();

      if (params?.status) {
        tasks = tasks.filter((t) => t.status === params.status);
      }
      if (params?.priority) {
        tasks = tasks.filter((t) => t.priority === params.priority);
      }
      if (params?.search && params.search.trim()) {
        const q = params.search.trim().toLowerCase();
        tasks = tasks.filter(
          (t) => t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q)
        );
      }

      tasks.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      return { tasks, total: tasks.length };
    }

    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.set('status', params.status);
    if (params?.priority) searchParams.set('priority', params.priority);
    if (params?.search) searchParams.set('search', params.search);
    if (params?.limit) searchParams.set('limit', String(params.limit));
    if (params?.nextToken) searchParams.set('nextToken', params.nextToken);

    const queryString = searchParams.toString();
    const url = `${API_BASE_URL}/tasks${queryString ? `?${queryString}` : ''}`;

    const res = await fetch(url, {
      method: 'GET',
      headers: { Accept: 'application/json' }
    });

    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error || `Failed to fetch tasks (${res.status})`);
    }

    return json.data;
  },

  /**
   * Get single task by taskId
   */
  async getTask(taskId: string): Promise<TaskItem> {
    if (!isUsingLiveApi()) {
      const tasks = getLocalTasks();
      const task = tasks.find((t) => t.taskId === taskId);
      if (!task) throw new Error(`Task '${taskId}' not found.`);
      return task;
    }

    const res = await fetch(`${API_BASE_URL}/tasks/${encodeURIComponent(taskId)}`, {
      method: 'GET',
      headers: { Accept: 'application/json' }
    });

    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error || `Failed to fetch task (${res.status})`);
    }

    return json.data;
  },

  /**
   * Create new task
   */
  async createTask(input: CreateTaskInput): Promise<TaskItem> {
    if (!isUsingLiveApi()) {
      const now = new Date().toISOString();
      const newTask: TaskItem = {
        taskId: `task_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        title: input.title.trim(),
        description: input.description?.trim() || '',
        priority: input.priority || 'MEDIUM',
        status: input.status || 'TODO',
        createdAt: now,
        updatedAt: now
      };
      const tasks = getLocalTasks();
      tasks.unshift(newTask);
      saveLocalTasks(tasks);
      return newTask;
    }

    const res = await fetch(`${API_BASE_URL}/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      body: JSON.stringify(input)
    });

    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error || `Failed to create task (${res.status})`);
    }

    return json.data;
  },

  /**
   * Update task fields
   */
  async updateTask(taskId: string, input: UpdateTaskInput): Promise<TaskItem> {
    if (!isUsingLiveApi()) {
      const tasks = getLocalTasks();
      const index = tasks.findIndex((t) => t.taskId === taskId);
      if (index === -1) throw new Error(`Task '${taskId}' not found.`);

      const updated: TaskItem = {
        ...tasks[index],
        ...input,
        updatedAt: new Date().toISOString()
      };
      tasks[index] = updated;
      saveLocalTasks(tasks);
      return updated;
    }

    const res = await fetch(`${API_BASE_URL}/tasks/${encodeURIComponent(taskId)}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      body: JSON.stringify(input)
    });

    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error || `Failed to update task (${res.status})`);
    }

    return json.data;
  },

  /**
   * Delete task
   */
  async deleteTask(taskId: string): Promise<void> {
    if (!isUsingLiveApi()) {
      const tasks = getLocalTasks();
      const filtered = tasks.filter((t) => t.taskId !== taskId);
      saveLocalTasks(filtered);
      return;
    }

    const res = await fetch(`${API_BASE_URL}/tasks/${encodeURIComponent(taskId)}`, {
      method: 'DELETE',
      headers: { Accept: 'application/json' }
    });

    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error || `Failed to delete task (${res.status})`);
    }
  },

  /**
   * Secure multi-step document upload to private S3:
   * Step 1: Request presigned upload URL from Lambda
   * Step 2: Upload file directly to S3 via PUT
   * Step 3: Confirm upload with Lambda to attach metadata
   */
  async uploadAttachment(
    taskId: string,
    file: File,
    onProgress?: (percent: number) => void
  ): Promise<TaskItem> {
    const ALLOWED_TYPES = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
    const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

    // Client-side validation
    if (!ALLOWED_TYPES.includes(file.type.toLowerCase())) {
      throw new Error('Only PDF, PNG, and JPEG files are supported.');
    }
    if (file.size > MAX_SIZE) {
      throw new Error(`File size (${(file.size / (1024 * 1024)).toFixed(2)} MB) exceeds 5 MB limit.`);
    }

    // Local demo mode simulation
    if (!isUsingLiveApi()) {
      if (onProgress) onProgress(30);
      await new Promise((r) => setTimeout(r, 400));
      if (onProgress) onProgress(80);
      await new Promise((r) => setTimeout(r, 300));

      const tasks = getLocalTasks();
      const index = tasks.findIndex((t) => t.taskId === taskId);
      if (index === -1) throw new Error('Task not found.');

      // Create a local blob URL for previewing
      const localUrl = URL.createObjectURL(file);
      const attachment = {
        key: `tasks/${taskId}/${Date.now()}_${file.name}`,
        name: file.name,
        size: file.size,
        type: file.type,
        uploadedAt: new Date().toISOString(),
        downloadUrl: localUrl
      };

      tasks[index].attachment = attachment;
      tasks[index].updatedAt = new Date().toISOString();
      saveLocalTasks(tasks);
      if (onProgress) onProgress(100);
      return tasks[index];
    }

    // Step 1: Request presigned upload URL
    if (onProgress) onProgress(15);
    const presignedRes = await fetch(
      `${API_BASE_URL}/tasks/${encodeURIComponent(taskId)}/upload-url`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json'
        },
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type,
          size: file.size
        })
      }
    );

    const presignedJson = await presignedRes.json();
    if (!presignedRes.ok || !presignedJson.success) {
      throw new Error(presignedJson.error || 'Failed to authorize document upload with server.');
    }

    const { uploadUrl, key } = presignedJson.data;

    // Step 2: Upload directly to S3 via PUT
    if (onProgress) onProgress(40);
    const s3UploadRes = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': file.type
      },
      body: file
    });

    if (!s3UploadRes.ok) {
      throw new Error(`Direct S3 upload failed with status ${s3UploadRes.status}.`);
    }

    if (onProgress) onProgress(85);

    // Step 3: Confirm with backend to verify object in S3 and save metadata
    const confirmRes = await fetch(
      `${API_BASE_URL}/tasks/${encodeURIComponent(taskId)}/attachment`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json'
        },
        body: JSON.stringify({
          key,
          name: file.name,
          size: file.size,
          type: file.type
        })
      }
    );

    const confirmJson = await confirmRes.json();
    if (!confirmRes.ok || !confirmJson.success) {
      throw new Error(confirmJson.error || 'Failed to confirm attachment with server.');
    }

    if (onProgress) onProgress(100);
    return confirmJson.data;
  }
};
