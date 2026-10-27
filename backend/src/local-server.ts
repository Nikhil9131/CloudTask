import express, { Request, Response } from 'express';
import cors from 'cors';
import { handler } from './index';
import { APIGatewayProxyEventV2 } from 'aws-lambda';

// If running locally without explicit AWS keys, enable local store fallback
if (!process.env.AWS_ACCESS_KEY_ID) {
  process.env.USE_LOCAL_STORE = 'true';
}

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.raw({ type: '*/*', limit: '10mb' }));

// Mock S3 direct upload endpoint for local testing
app.put('/mock-s3-upload', (req: Request, res: Response) => {
  res.status(200).send({ message: 'File uploaded successfully to local mock storage.' });
});

// Mock S3 file retrieval endpoint
app.get('/mock-s3-file', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/plain');
  res.send('Mock file contents from local storage.');
});

// Bridge all other requests to the Lambda handler for 100% parity
app.all('*', async (req: Request, res: Response) => {
  const event: APIGatewayProxyEventV2 = {
    version: '2.0',
    routeKey: `${req.method} ${req.path}`,
    rawPath: req.path,
    rawQueryString: req.url.includes('?') ? req.url.split('?')[1] : '',
    headers: req.headers as Record<string, string>,
    queryStringParameters: req.query as Record<string, string>,
    requestContext: {
      accountId: '123456789012',
      apiId: 'local-api',
      domainName: 'localhost',
      domainPrefix: 'localhost',
      http: {
        method: req.method,
        path: req.path,
        protocol: 'HTTP/1.1',
        sourceIp: req.ip || '127.0.0.1',
        userAgent: req.headers['user-agent'] || 'local-client'
      },
      requestId: `req_${Date.now()}`,
      routeKey: `${req.method} ${req.path}`,
      stage: '$default',
      time: new Date().toISOString(),
      timeEpoch: Date.now()
    },
    body: typeof req.body === 'object' && !Buffer.isBuffer(req.body) ? JSON.stringify(req.body) : req.body?.toString(),
    isBase64Encoded: false
  };

  try {
    const result: any = await handler(event);
    if (result.headers) {
      for (const [key, value] of Object.entries(result.headers)) {
        res.setHeader(key, value as string);
      }
    }
    res.status(result.statusCode || 200).send(result.body ? JSON.parse(result.body) : '');
  } catch (err) {
    console.error('Local server error:', err);
    res.status(500).json({ success: false, error: 'Internal server error in local server.' });
  }
});

app.listen(PORT, () => {
  console.log(`CloudTask Local API Server running at http://localhost:${PORT}`);
  console.log(`Storage Mode: ${process.env.USE_LOCAL_STORE === 'true' ? 'In-Memory Offline Store' : 'AWS DynamoDB & S3'}`);
});
