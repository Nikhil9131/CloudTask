import { CreateTaskInput, UpdateTaskInput, GenerateUploadUrlInput, TaskPriority, TaskStatus, ConfirmAttachmentInput } from './types';

export const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/jpg'
];

export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
export const ALLOWED_PRIORITIES: TaskPriority[] = ['LOW', 'MEDIUM', 'HIGH'];
export const ALLOWED_STATUSES: TaskStatus[] = ['TODO', 'IN_PROGRESS', 'COMPLETED'];

export class ValidationError extends Error {
  statusCode: number;
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
    this.statusCode = 400;
  }
}

export function validateCreateTaskInput(input: any): CreateTaskInput {
  if (!input || typeof input !== 'object') {
    throw new ValidationError('Request body must be a valid JSON object.');
  }

  const title = typeof input.title === 'string' ? input.title.trim() : '';
  if (!title) {
    throw new ValidationError('Task title is required.');
  }
  if (title.length > 120) {
    throw new ValidationError('Task title cannot exceed 120 characters.');
  }

  let description = '';
  if (input.description !== undefined && input.description !== null) {
    if (typeof input.description !== 'string') {
      throw new ValidationError('Description must be a string.');
    }
    description = input.description.trim();
    if (description.length > 2000) {
      throw new ValidationError('Description cannot exceed 2000 characters.');
    }
  }

  let priority: TaskPriority = 'MEDIUM';
  if (input.priority !== undefined && input.priority !== null) {
    const normPriority = String(input.priority).toUpperCase() as TaskPriority;
    if (!ALLOWED_PRIORITIES.includes(normPriority)) {
      throw new ValidationError(`Priority must be one of: ${ALLOWED_PRIORITIES.join(', ')}.`);
    }
    priority = normPriority;
  }

  let status: TaskStatus = 'TODO';
  if (input.status !== undefined && input.status !== null) {
    const normStatus = String(input.status).toUpperCase() as TaskStatus;
    if (!ALLOWED_STATUSES.includes(normStatus)) {
      throw new ValidationError(`Status must be one of: ${ALLOWED_STATUSES.join(', ')}.`);
    }
    status = normStatus;
  }

  let assignee = typeof input.assignee === 'string' ? input.assignee.trim().substring(0, 100) : '';
  let assigneeEmail = typeof input.assigneeEmail === 'string' ? input.assigneeEmail.trim().substring(0, 150) : '';

  return { title, description, priority, status, assignee, assigneeEmail };
}

export function validateUpdateTaskInput(input: any): UpdateTaskInput {
  if (!input || typeof input !== 'object') {
    throw new ValidationError('Request body must be a valid JSON object.');
  }

  const updates: UpdateTaskInput = {};
  let hasField = false;

  if (input.title !== undefined) {
    if (typeof input.title !== 'string') {
      throw new ValidationError('Task title must be a string.');
    }
    const title = input.title.trim();
    if (!title) {
      throw new ValidationError('Task title cannot be empty.');
    }
    if (title.length > 120) {
      throw new ValidationError('Task title cannot exceed 120 characters.');
    }
    updates.title = title;
    hasField = true;
  }

  if (input.description !== undefined) {
    if (input.description === null) {
      updates.description = '';
    } else if (typeof input.description !== 'string') {
      throw new ValidationError('Description must be a string.');
    } else {
      const description = input.description.trim();
      if (description.length > 2000) {
        throw new ValidationError('Description cannot exceed 2000 characters.');
      }
      updates.description = description;
    }
    hasField = true;
  }

  if (input.priority !== undefined) {
    const normPriority = String(input.priority).toUpperCase() as TaskPriority;
    if (!ALLOWED_PRIORITIES.includes(normPriority)) {
      throw new ValidationError(`Priority must be one of: ${ALLOWED_PRIORITIES.join(', ')}.`);
    }
    updates.priority = normPriority;
    hasField = true;
  }

  if (input.status !== undefined) {
    const normStatus = String(input.status).toUpperCase() as TaskStatus;
    if (!ALLOWED_STATUSES.includes(normStatus)) {
      throw new ValidationError(`Status must be one of: ${ALLOWED_STATUSES.join(', ')}.`);
    }
    updates.status = normStatus;
    hasField = true;
  }

  if (input.assignee !== undefined) {
    updates.assignee = typeof input.assignee === 'string' ? input.assignee.trim().substring(0, 100) : '';
    hasField = true;
  }

  if (input.assigneeEmail !== undefined) {
    updates.assigneeEmail = typeof input.assigneeEmail === 'string' ? input.assigneeEmail.trim().substring(0, 150) : '';
    hasField = true;
  }

  if (!hasField) {
    throw new ValidationError('At least one field (title, description, priority, status, assignee) must be provided for update.');
  }

  return updates;
}

export function validateGenerateUploadUrlInput(input: any): GenerateUploadUrlInput {
  if (!input || typeof input !== 'object') {
    throw new ValidationError('Request body must be a valid JSON object.');
  }

  const filename = typeof input.filename === 'string' ? input.filename.trim() : '';
  if (!filename) {
    throw new ValidationError('Filename is required.');
  }
  if (filename.length > 255) {
    throw new ValidationError('Filename cannot exceed 255 characters.');
  }

  const contentType = typeof input.contentType === 'string' ? input.contentType.trim().toLowerCase() : '';
  if (!contentType || !ALLOWED_MIME_TYPES.includes(contentType)) {
    throw new ValidationError(`Invalid file type '${contentType}'. Only PDF, PNG, and JPEG files are supported.`);
  }

  const size = Number(input.size);
  if (isNaN(size) || size <= 0) {
    throw new ValidationError('File size must be a positive number of bytes.');
  }
  if (size > MAX_FILE_SIZE_BYTES) {
    throw new ValidationError(`File size exceeds maximum limit of 5 MB (${MAX_FILE_SIZE_BYTES} bytes).`);
  }

  return { filename, contentType, size };
}

export function validateConfirmAttachmentInput(input: any): ConfirmAttachmentInput {
  if (!input || typeof input !== 'object') {
    throw new ValidationError('Request body must be a valid JSON object.');
  }

  const key = typeof input.key === 'string' ? input.key.trim() : '';
  if (!key) {
    throw new ValidationError('Attachment S3 object key is required.');
  }

  const name = typeof input.name === 'string' ? input.name.trim() : '';
  if (!name) {
    throw new ValidationError('Attachment name is required.');
  }

  const type = typeof input.type === 'string' ? input.type.trim().toLowerCase() : '';
  if (!type || !ALLOWED_MIME_TYPES.includes(type)) {
    throw new ValidationError(`Invalid file type '${type}'. Only PDF, PNG, and JPEG files are supported.`);
  }

  const size = Number(input.size);
  if (isNaN(size) || size <= 0 || size > MAX_FILE_SIZE_BYTES) {
    throw new ValidationError('Invalid attachment size.');
  }

  return { key, name, type, size };
}

export function sanitizeFilename(filename: string): string {
  // Strip path traversal attempts and keep alphanumeric, hyphens, underscores, dots
  const base = filename.replace(/^.*[\\\/]/, '');
  return base.replace(/[^a-zA-Z0-9._-]/g, '_');
}
