import { handler } from '../src/index';
import { APIGatewayProxyEventV2 } from 'aws-lambda';
import * as awsClients from '../src/aws-clients';

jest.mock('../src/aws-clients', () => {
  return {
    AWS_REGION: 'ap-south-1',
    TASKS_TABLE: 'CloudTaskTasks',
    ATTACHMENTS_BUCKET: 'cloudtask-attachments',
    docClient: {
      send: jest.fn()
    },
    s3Client: {
      send: jest.fn()
    },
    getPresignedUploadUrl: jest.fn().mockResolvedValue('https://mock-s3.amazonaws.com/upload-presigned-url'),
    getPresignedDownloadUrl: jest.fn().mockResolvedValue('https://mock-s3.amazonaws.com/download-presigned-url'),
    getObjectMetadata: jest.fn().mockResolvedValue({ ContentLength: 2048 }),
    deleteS3Object: jest.fn().mockResolvedValue(undefined)
  };
});

function createMockEvent(
  method: string,
  rawPath: string,
  body?: any,
  queryStringParameters?: Record<string, string>
): APIGatewayProxyEventV2 {
  return {
    version: '2.0',
    routeKey: `${method} ${rawPath}`,
    rawPath,
    rawQueryString: '',
    headers: {
      origin: 'https://test-frontend.example.com',
      'content-type': 'application/json'
    },
    queryStringParameters,
    requestContext: {
      accountId: '123456789012',
      apiId: 'test-api',
      domainName: 'test.execute-api.ap-south-1.amazonaws.com',
      domainPrefix: 'test',
      http: {
        method,
        path: rawPath,
        protocol: 'HTTP/1.1',
        sourceIp: '127.0.0.1',
        userAgent: 'Jest'
      },
      requestId: 'test-request-id',
      routeKey: `${method} ${rawPath}`,
      stage: '$default',
      time: new Date().toISOString(),
      timeEpoch: Date.now()
    },
    body: body ? JSON.stringify(body) : undefined,
    isBase64Encoded: false
  };
}

describe('Lambda Handler Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should respond with 204 for CORS OPTIONS preflight request', async () => {
    const event = createMockEvent('OPTIONS', '/tasks');
    const res: any = await handler(event);

    expect(res.statusCode).toBe(204);
    expect(res.headers['Access-Control-Allow-Methods']).toContain('GET');
  });

  it('should return 400 when creating a task with missing title', async () => {
    const event = createMockEvent('POST', '/tasks', { description: 'Missing title' });
    const res: any = await handler(event);

    expect(res.statusCode).toBe(400);
    const parsed = JSON.parse(res.body);
    expect(parsed.success).toBe(false);
    expect(parsed.error).toContain('Task title is required');
  });

  it('should create a task successfully with status 201', async () => {
    (awsClients.docClient.send as jest.Mock).mockResolvedValueOnce({});

    const event = createMockEvent('POST', '/tasks', {
      title: 'Architect CloudTask',
      priority: 'HIGH'
    });
    const res: any = await handler(event);

    expect(res.statusCode).toBe(201);
    const parsed = JSON.parse(res.body);
    expect(parsed.success).toBe(true);
    expect(parsed.data.title).toBe('Architect CloudTask');
    expect(parsed.data.priority).toBe('HIGH');
    expect(parsed.data.status).toBe('TODO');
    expect(parsed.data.taskId).toMatch(/^task_/);
  });

  it('should return 404 when retrieving a non-existent task', async () => {
    (awsClients.docClient.send as jest.Mock).mockResolvedValueOnce({ Item: undefined });

    const event = createMockEvent('GET', '/tasks/task_nonexistent');
    const res: any = await handler(event);

    expect(res.statusCode).toBe(404);
    const parsed = JSON.parse(res.body);
    expect(parsed.success).toBe(false);
    expect(parsed.error).toContain('not found');
  });

  it('should return 200 and presigned upload URL for valid document request', async () => {
    (awsClients.docClient.send as jest.Mock).mockResolvedValueOnce({
      Item: {
        taskId: 'task_123',
        title: 'Document Task',
        priority: 'MEDIUM',
        status: 'TODO',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    });

    const event = createMockEvent('POST', '/tasks/task_123/upload-url', {
      filename: 'spec.pdf',
      contentType: 'application/pdf',
      size: 1024 * 1024
    });

    const res: any = await handler(event);
    expect(res.statusCode).toBe(200);
    const parsed = JSON.parse(res.body);
    expect(parsed.success).toBe(true);
    expect(parsed.data.uploadUrl).toBe('https://mock-s3.amazonaws.com/upload-presigned-url');
    expect(parsed.data.key).toContain('tasks/task_123/');
  });

  it('should delete a task and clean up associated S3 attachment', async () => {
    (awsClients.docClient.send as jest.Mock)
      // First call: GetCommand (task exists with attachment)
      .mockResolvedValueOnce({
        Item: {
          taskId: 'task_del',
          title: 'To Delete',
          attachment: { key: 'tasks/task_del/file.pdf', name: 'file.pdf' }
        }
      })
      // Second call: DeleteCommand
      .mockResolvedValueOnce({});

    const event = createMockEvent('DELETE', '/tasks/task_del');
    const res: any = await handler(event);

    expect(res.statusCode).toBe(200);
    expect(awsClients.deleteS3Object).toHaveBeenCalledWith('tasks/task_del/file.pdf');
  });
});
