import { randomUUID } from 'crypto';
import {
  PutCommand,
  GetCommand,
  UpdateCommand,
  DeleteCommand,
  ScanCommand,
  QueryCommand
} from '@aws-sdk/lib-dynamodb';
import {
  docClient,
  TASKS_TABLE,
  getPresignedUploadUrl,
  getPresignedDownloadUrl,
  getObjectMetadata,
  deleteS3Object
} from './aws-clients';
import {
  TaskItem,
  CreateTaskInput,
  UpdateTaskInput,
  ListTasksQuery,
  ListTasksResponse,
  GenerateUploadUrlInput,
  GenerateUploadUrlResponse,
  ConfirmAttachmentInput
} from './types';
import { sanitizeFilename, ValidationError } from './validator';

import fs from 'fs';
import path from 'path';

export class NotFoundError extends Error {
  statusCode: number;
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
    this.statusCode = 404;
  }
}

const PERSISTENT_FILE = path.resolve(__dirname, '../data/local-tasks.json');

function loadLocalTasksFromDisk(): Map<string, TaskItem> {
  const map = new Map<string, TaskItem>();
  try {
    if (fs.existsSync(PERSISTENT_FILE)) {
      const data = fs.readFileSync(PERSISTENT_FILE, 'utf-8');
      const parsed: TaskItem[] = JSON.parse(data);
      if (Array.isArray(parsed)) {
        parsed.forEach((t) => map.set(t.taskId, t));
      }
    }
  } catch (err) {
    console.warn('Could not read local-tasks.json:', err);
  }
  return map;
}

function saveLocalTasksToDisk(map: Map<string, TaskItem>) {
  try {
    const dir = path.dirname(PERSISTENT_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(PERSISTENT_FILE, JSON.stringify(Array.from(map.values()), null, 2), 'utf-8');
  } catch (err) {
    console.warn('Could not save local-tasks.json:', err);
  }
}

// In-memory fallback map for offline local testing with disk persistence
const localStore = loadLocalTasksFromDisk();

const DEFAULT_INITIAL_TASKS: TaskItem[] = [
  {
    taskId: 'task_demo_001',
    title: 'Configure AWS SAM template and DynamoDB table',
    description: 'Ensure CloudTaskTasks table uses on-demand billing, with StatusCreatedAtIndex GSI for efficient queries.',
    priority: 'HIGH',
    status: 'COMPLETED',
    assignee: 'Nikhil Rathore',
    assigneeEmail: 'nikhil@cloudtask.io',
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 20).toISOString()
  },
  {
    taskId: 'task_demo_002',
    title: 'Implement private S3 bucket and presigned upload flow',
    description: 'Enforce PDF, PNG, and JPEG constraints with 5MB ceiling. Direct browser-to-S3 upload with validation.',
    priority: 'HIGH',
    status: 'COMPLETED',
    assignee: 'Priya Patel',
    assigneeEmail: 'priya@cloudtask.io',
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 6).toISOString()
  },
  {
    taskId: 'task_demo_003',
    title: 'Review task management workspace submission checklist',
    description: 'Verify deployment instructions, tests, Mermaid architecture diagram, and security best practices in README.',
    priority: 'MEDIUM',
    status: 'IN_PROGRESS',
    assignee: 'Aarav Sharma',
    assigneeEmail: 'aarav@cloudtask.io',
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 2).toISOString()
  },
  {
    taskId: 'task_demo_004',
    title: 'Deploy to AWS Amplify Hosting via GitHub',
    description: 'Connect repository to Amplify Hosting in ap-south-1 Mumbai, configure build settings, and verify public HTTPS URL.',
    priority: 'HIGH',
    status: 'TODO',
    assignee: 'Rohan Mehta',
    assigneeEmail: 'rohan@cloudtask.io',
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    updatedAt: new Date(Date.now() - 3600000).toISOString()
  }
];

if (localStore.size === 0) {
  DEFAULT_INITIAL_TASKS.forEach((t) => localStore.set(t.taskId, t));
  saveLocalTasksToDisk(localStore);
}

export class TaskService {
  private isLocalMode(): boolean {
    return process.env.USE_LOCAL_STORE === 'true';
  }

  /**
   * Create a new task and persist to DynamoDB (or local store in offline mode)
   */
  async createTask(input: CreateTaskInput): Promise<TaskItem> {
    const now = new Date().toISOString();
    const taskId = `task_${Date.now()}_${randomUUID().substring(0, 8)}`;

    const task: TaskItem = {
      taskId,
      title: input.title,
      description: input.description || '',
      priority: input.priority || 'MEDIUM',
      status: input.status || 'TODO',
      assignee: input.assignee || 'Nikhil Rathore',
      assigneeEmail: input.assigneeEmail || 'nikhil@cloudtask.io',
      createdAt: now,
      updatedAt: now
    };

    if (this.isLocalMode()) {
      localStore.set(taskId, { ...task });
      saveLocalTasksToDisk(localStore);
      return task;
    }

    await docClient.send(
      new PutCommand({
        TableName: TASKS_TABLE,
        Item: task
      })
    );

    return task;
  }

  /**
   * Retrieve a task by taskId, including signed download URL for attachment if present
   */
  async getTask(taskId: string): Promise<TaskItem> {
    if (this.isLocalMode()) {
      const task = localStore.get(taskId);
      if (!task) {
        throw new NotFoundError(`Task with ID '${taskId}' not found.`);
      }
      return { ...task };
    }

    const response = await docClient.send(
      new GetCommand({
        TableName: TASKS_TABLE,
        Key: { taskId }
      })
    );

    if (!response.Item) {
      throw new NotFoundError(`Task with ID '${taskId}' not found.`);
    }

    const task = response.Item as TaskItem;

    if (task.attachment && task.attachment.key) {
      try {
        const downloadUrl = await getPresignedDownloadUrl(task.attachment.key, task.attachment.name);
        task.attachment = {
          ...task.attachment,
          downloadUrl
        };
      } catch (err) {
        console.warn(`Could not generate presigned download URL for task ${taskId}:`, err);
      }
    }

    return task;
  }

  /**
   * List tasks with optional status GSI query, priority filtering, title search, and pagination
   */
  async listTasks(query: ListTasksQuery): Promise<ListTasksResponse> {
    if (this.isLocalMode()) {
      let items = Array.from(localStore.values());

      if (query.status) {
        items = items.filter((t) => t.status === query.status);
      }
      if (query.priority) {
        items = items.filter((t) => t.priority === query.priority);
      }
      if (query.assignee) {
        items = items.filter((t) => t.assignee?.toLowerCase() === query.assignee?.toLowerCase());
      }
      if (query.search && query.search.trim()) {
        const q = query.search.trim().toLowerCase();
        items = items.filter(
          (t) => t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q) || (t.assignee && t.assignee.toLowerCase().includes(q))
        );
      }

      items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      const limit = query.limit || 50;
      return {
        tasks: items.slice(0, limit),
        total: items.length
      };
    }

    const limit = Math.min(Math.max(query.limit || 50, 1), 100);
    let exclusiveStartKey: Record<string, any> | undefined;

    if (query.nextToken) {
      try {
        exclusiveStartKey = JSON.parse(Buffer.from(query.nextToken, 'base64').toString('utf-8'));
      } catch {
        throw new ValidationError('Invalid pagination nextToken.');
      }
    }

    let items: TaskItem[] = [];
    let lastEvaluatedKey: Record<string, any> | undefined;

    if (query.status) {
      const expressionAttributeNames: Record<string, string> = {
        '#status': 'status'
      };
      const expressionAttributeValues: Record<string, any> = {
        ':status': query.status
      };
      const filterConditions: string[] = [];

      if (query.priority) {
        expressionAttributeNames['#priority'] = 'priority';
        expressionAttributeValues[':priority'] = query.priority;
        filterConditions.push('#priority = :priority');
      }

      if (query.assignee) {
        expressionAttributeNames['#assignee'] = 'assignee';
        expressionAttributeValues[':assignee'] = query.assignee;
        filterConditions.push('#assignee = :assignee');
      }

      if (query.search && query.search.trim()) {
        expressionAttributeNames['#title'] = 'title';
        expressionAttributeValues[':search'] = query.search.trim();
        filterConditions.push('contains(#title, :search)');
      }

      const queryParams: any = {
        TableName: TASKS_TABLE,
        IndexName: 'StatusCreatedAtIndex',
        KeyConditionExpression: '#status = :status',
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues,
        ScanIndexForward: false,
        Limit: limit,
        ExclusiveStartKey: exclusiveStartKey
      };

      if (filterConditions.length > 0) {
        queryParams.FilterExpression = filterConditions.join(' AND ');
      }

      const res = await docClient.send(new QueryCommand(queryParams));
      items = (res.Items || []) as TaskItem[];
      lastEvaluatedKey = res.LastEvaluatedKey;
    } else {
      const expressionAttributeNames: Record<string, string> = {};
      const expressionAttributeValues: Record<string, any> = {};
      const filterConditions: string[] = [];

      if (query.priority) {
        expressionAttributeNames['#priority'] = 'priority';
        expressionAttributeValues[':priority'] = query.priority;
        filterConditions.push('#priority = :priority');
      }

      if (query.assignee) {
        expressionAttributeNames['#assignee'] = 'assignee';
        expressionAttributeValues[':assignee'] = query.assignee;
        filterConditions.push('#assignee = :assignee');
      }

      if (query.search && query.search.trim()) {
        expressionAttributeNames['#title'] = 'title';
        expressionAttributeValues[':search'] = query.search.trim();
        filterConditions.push('contains(#title, :search)');
      }

      const scanParams: any = {
        TableName: TASKS_TABLE,
        Limit: limit,
        ExclusiveStartKey: exclusiveStartKey
      };

      if (filterConditions.length > 0) {
        scanParams.FilterExpression = filterConditions.join(' AND ');
        scanParams.ExpressionAttributeNames = expressionAttributeNames;
        scanParams.ExpressionAttributeValues = expressionAttributeValues;
      }

      const res = await docClient.send(new ScanCommand(scanParams));
      items = (res.Items || []) as TaskItem[];
      lastEvaluatedKey = res.LastEvaluatedKey;

      items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    for (const item of items) {
      if (item.attachment && item.attachment.key) {
        try {
          item.attachment.downloadUrl = await getPresignedDownloadUrl(item.attachment.key, item.attachment.name);
        } catch {
          // ignore presigning failure in batch listing
        }
      }
    }

    let nextToken: string | undefined;
    if (lastEvaluatedKey) {
      nextToken = Buffer.from(JSON.stringify(lastEvaluatedKey)).toString('base64');
    }

    return {
      tasks: items,
      nextToken,
      total: items.length
    };
  }

  /**
   * Update task fields (title, description, priority, status, assignee)
   */
  async updateTask(taskId: string, input: UpdateTaskInput): Promise<TaskItem> {
    const existing = await this.getTask(taskId);

    if (this.isLocalMode()) {
      const updated: TaskItem = {
        ...existing,
        ...input,
        updatedAt: new Date().toISOString()
      };
      localStore.set(taskId, updated);
      saveLocalTasksToDisk(localStore);
      return updated;
    }

    const updateParts: string[] = [];
    const expressionAttributeNames: Record<string, string> = {
      '#updatedAt': 'updatedAt'
    };
    const expressionAttributeValues: Record<string, any> = {
      ':updatedAt': new Date().toISOString()
    };

    updateParts.push('#updatedAt = :updatedAt');

    if (input.title !== undefined) {
      expressionAttributeNames['#title'] = 'title';
      expressionAttributeValues[':title'] = input.title;
      updateParts.push('#title = :title');
    }

    if (input.description !== undefined) {
      expressionAttributeNames['#description'] = 'description';
      expressionAttributeValues[':description'] = input.description;
      updateParts.push('#description = :description');
    }

    if (input.priority !== undefined) {
      expressionAttributeNames['#priority'] = 'priority';
      expressionAttributeValues[':priority'] = input.priority;
      updateParts.push('#priority = :priority');
    }

    if (input.status !== undefined) {
      expressionAttributeNames['#status'] = 'status';
      expressionAttributeValues[':status'] = input.status;
      updateParts.push('#status = :status');
    }

    if (input.assignee !== undefined) {
      expressionAttributeNames['#assignee'] = 'assignee';
      expressionAttributeValues[':assignee'] = input.assignee;
      updateParts.push('#assignee = :assignee');
    }

    if (input.assigneeEmail !== undefined) {
      expressionAttributeNames['#assigneeEmail'] = 'assigneeEmail';
      expressionAttributeValues[':assigneeEmail'] = input.assigneeEmail;
      updateParts.push('#assigneeEmail = :assigneeEmail');
    }

    const updateParams = {
      TableName: TASKS_TABLE,
      Key: { taskId },
      UpdateExpression: `SET ${updateParts.join(', ')}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW' as const
    };

    const result = await docClient.send(new UpdateCommand(updateParams));
    return result.Attributes as TaskItem;
  }

  /**
   * Delete a task and clean up any associated S3 attachment
   */
  async deleteTask(taskId: string): Promise<{ deleted: boolean; taskId: string }> {
    const existing = await this.getTask(taskId);

    if (this.isLocalMode()) {
      localStore.delete(taskId);
      saveLocalTasksToDisk(localStore);
      return { deleted: true, taskId };
    }

    if (existing.attachment && existing.attachment.key) {
      try {
        await deleteS3Object(existing.attachment.key);
      } catch (err) {
        console.warn(`Could not clean up S3 object ${existing.attachment.key} for task ${taskId}:`, err);
      }
    }

    await docClient.send(
      new DeleteCommand({
        TableName: TASKS_TABLE,
        Key: { taskId }
      })
    );

    return { deleted: true, taskId };
  }

  /**
   * Authorize and generate a presigned S3 upload URL for a task attachment
   */
  async generateUploadUrl(taskId: string, input: GenerateUploadUrlInput): Promise<GenerateUploadUrlResponse> {
    await this.getTask(taskId);

    const safeName = sanitizeFilename(input.filename);
    const key = `tasks/${taskId}/${Date.now()}_${safeName}`;
    const expiresIn = 300;

    if (this.isLocalMode()) {
      return {
        uploadUrl: `http://localhost:5000/mock-s3-upload?key=${encodeURIComponent(key)}`,
        key,
        expiresIn
      };
    }

    const uploadUrl = await getPresignedUploadUrl(key, input.contentType, expiresIn);

    return {
      uploadUrl,
      key,
      expiresIn
    };
  }

  /**
   * Confirm that an S3 attachment has been uploaded and attach metadata to the task
   */
  async confirmAttachment(taskId: string, input: ConfirmAttachmentInput): Promise<TaskItem> {
    const existing = await this.getTask(taskId);

    if (!input.key.startsWith(`tasks/${taskId}/`)) {
      throw new ValidationError('Object key does not belong to the specified task.');
    }

    let actualSize = input.size;

    if (this.isLocalMode()) {
      const attachment = {
        key: input.key,
        name: sanitizeFilename(input.name),
        size: actualSize,
        type: input.type,
        uploadedAt: new Date().toISOString(),
        downloadUrl: `http://localhost:5000/mock-s3-file?key=${encodeURIComponent(input.key)}`
      };
      existing.attachment = attachment;
      existing.updatedAt = new Date().toISOString();
      localStore.set(taskId, existing);
      saveLocalTasksToDisk(localStore);
      return { ...existing };
    }

    try {
      const head = await getObjectMetadata(input.key);
      if (head.ContentLength) {
        actualSize = head.ContentLength;
      }
    } catch (err: any) {
      throw new ValidationError('Uploaded file not found in S3 bucket. Upload might have failed or timed out.');
    }

    if (existing.attachment && existing.attachment.key && existing.attachment.key !== input.key) {
      try {
        await deleteS3Object(existing.attachment.key);
      } catch (err) {
        console.warn(`Could not delete previous attachment ${existing.attachment.key}:`, err);
      }
    }

    const attachment = {
      key: input.key,
      name: sanitizeFilename(input.name),
      size: actualSize,
      type: input.type,
      uploadedAt: new Date().toISOString()
    };

    const updateParams = {
      TableName: TASKS_TABLE,
      Key: { taskId },
      UpdateExpression: 'SET #attachment = :attachment, #updatedAt = :updatedAt',
      ExpressionAttributeNames: {
        '#attachment': 'attachment',
        '#updatedAt': 'updatedAt'
      },
      ExpressionAttributeValues: {
        ':attachment': attachment,
        ':updatedAt': new Date().toISOString()
      },
      ReturnValues: 'ALL_NEW' as const
    };

    const res = await docClient.send(new UpdateCommand(updateParams));
    const updated = res.Attributes as TaskItem;

    if (updated.attachment) {
      updated.attachment.downloadUrl = await getPresignedDownloadUrl(updated.attachment.key, updated.attachment.name);
    }

    return updated;
  }
}
