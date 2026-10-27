import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { TaskService, NotFoundError } from './task-service';
import {
  validateCreateTaskInput,
  validateUpdateTaskInput,
  validateGenerateUploadUrlInput,
  validateConfirmAttachmentInput,
  ValidationError
} from './validator';
import { TaskStatus, TaskPriority } from './types';

const taskService = new TaskService();
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || '*';

function createCorsHeaders(requestOrigin?: string): Record<string, string> {
  const origin = ALLOWED_ORIGIN === '*' ? '*' : (requestOrigin === ALLOWED_ORIGIN ? requestOrigin : ALLOWED_ORIGIN);
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, Accept',
    'Access-Control-Max-Age': '600',
    'Content-Type': 'application/json'
  };
}

function response(statusCode: number, body: Record<string, any>, requestOrigin?: string): APIGatewayProxyResultV2 {
  return {
    statusCode,
    headers: createCorsHeaders(requestOrigin),
    body: JSON.stringify(body)
  };
}

export const handler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  const method = event.requestContext.http.method.toUpperCase();
  const rawPath = event.rawPath || event.requestContext.http.path || '/';
  const requestOrigin = event.headers?.origin;

  // Handle CORS Preflight request
  if (method === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: createCorsHeaders(requestOrigin),
      body: ''
    };
  }

  // Parse path parameters and path structure
  // Supported routes:
  // /tasks or /api/tasks
  // /tasks/{taskId} or /api/tasks/{taskId}
  // /tasks/{taskId}/upload-url or /api/tasks/{taskId}/upload-url
  // /tasks/{taskId}/attachment or /api/tasks/{taskId}/attachment
  const pathParts = rawPath.replace(/^\/+|\/+$/g, '').split('/');
  if (pathParts[0] === 'api') {
    pathParts.shift();
  }

  try {
    // Parse body if present
    let body: any = null;
    if (event.body) {
      try {
        const decoded = event.isBase64Encoded ? Buffer.from(event.body, 'base64').toString('utf-8') : event.body;
        body = JSON.parse(decoded);
      } catch {
        return response(400, { success: false, error: 'Malformed JSON payload in request body.' }, requestOrigin);
      }
    }

    // Route: /tasks
    if (pathParts.length === 1 && pathParts[0] === 'tasks') {
      if (method === 'GET') {
        const query = event.queryStringParameters || {};
        const result = await taskService.listTasks({
          status: query.status as TaskStatus | undefined,
          priority: query.priority as TaskPriority | undefined,
          search: query.search,
          limit: query.limit ? parseInt(query.limit, 10) : undefined,
          nextToken: query.nextToken
        });
        return response(200, { success: true, data: result }, requestOrigin);
      }

      if (method === 'POST') {
        const validated = validateCreateTaskInput(body);
        const created = await taskService.createTask(validated);
        return response(201, { success: true, data: created, message: 'Task created successfully.' }, requestOrigin);
      }

      return response(405, { success: false, error: `Method ${method} not allowed on /tasks.` }, requestOrigin);
    }

    // Routes with taskId: /tasks/{taskId}...
    if (pathParts.length >= 2 && pathParts[0] === 'tasks') {
      const taskId = decodeURIComponent(pathParts[1]);

      if (!taskId) {
        return response(400, { success: false, error: 'Missing taskId parameter.' }, requestOrigin);
      }

      // Route: /tasks/{taskId}
      if (pathParts.length === 2) {
        if (method === 'GET') {
          const task = await taskService.getTask(taskId);
          return response(200, { success: true, data: task }, requestOrigin);
        }

        if (method === 'PUT') {
          const validated = validateUpdateTaskInput(body);
          const updated = await taskService.updateTask(taskId, validated);
          return response(200, { success: true, data: updated, message: 'Task updated successfully.' }, requestOrigin);
        }

        if (method === 'DELETE') {
          const result = await taskService.deleteTask(taskId);
          return response(200, { success: true, data: result, message: 'Task deleted successfully.' }, requestOrigin);
        }

        return response(405, { success: false, error: `Method ${method} not allowed on /tasks/{taskId}.` }, requestOrigin);
      }

      // Route: /tasks/{taskId}/upload-url
      if (pathParts.length === 3 && pathParts[2] === 'upload-url') {
        if (method === 'POST') {
          const validated = validateGenerateUploadUrlInput(body);
          const result = await taskService.generateUploadUrl(taskId, validated);
          return response(200, { success: true, data: result }, requestOrigin);
        }
        return response(405, { success: false, error: `Method ${method} not allowed on /tasks/{taskId}/upload-url.` }, requestOrigin);
      }

      // Route: /tasks/{taskId}/attachment
      if (pathParts.length === 3 && pathParts[2] === 'attachment') {
        if (method === 'POST') {
          const validated = validateConfirmAttachmentInput(body);
          const result = await taskService.confirmAttachment(taskId, validated);
          return response(200, { success: true, data: result, message: 'Attachment saved successfully.' }, requestOrigin);
        }
        return response(405, { success: false, error: `Method ${method} not allowed on /tasks/{taskId}/attachment.` }, requestOrigin);
      }
    }

    // Fallback: Not Found
    return response(404, { success: false, error: `Endpoint ${method} ${rawPath} not found.` }, requestOrigin);

  } catch (error: any) {
    console.error('Unhandled request error:', error);

    if (error instanceof ValidationError) {
      return response(400, { success: false, error: error.message }, requestOrigin);
    }

    if (error instanceof NotFoundError) {
      return response(404, { success: false, error: error.message }, requestOrigin);
    }

    // Default 500 error without exposing stack trace or internals
    return response(500, {
      success: false,
      error: 'An internal server error occurred while processing your request.'
    }, requestOrigin);
  }
};
