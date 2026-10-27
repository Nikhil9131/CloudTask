import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { S3Client, PutObjectCommand, GetObjectCommand, HeadObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export const AWS_REGION = process.env.AWS_REGION || 'ap-south-1';
export const TASKS_TABLE = process.env.TASKS_TABLE || 'CloudTaskTasks';
export const ATTACHMENTS_BUCKET = process.env.ATTACHMENTS_BUCKET || 'cloudtask-attachments';

const baseDdbClient = new DynamoDBClient({
  region: AWS_REGION
});

export const docClient = DynamoDBDocumentClient.from(baseDdbClient, {
  marshallOptions: {
    removeUndefinedValues: true,
    convertEmptyValues: false
  }
});

export const s3Client = new S3Client({
  region: AWS_REGION
});

/**
 * Generate a short-lived presigned upload URL (PUT) for browser direct upload.
 * Valid for 5 minutes (300 seconds).
 */
export async function getPresignedUploadUrl(
  key: string,
  contentType: string,
  expiresInSeconds = 300
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: ATTACHMENTS_BUCKET,
    Key: key,
    ContentType: contentType
  });

  return getSignedUrl(s3Client, command, { expiresIn: expiresInSeconds });
}

/**
 * Generate a short-lived presigned download/view URL (GET) for private S3 objects.
 * Valid for 15 minutes (900 seconds).
 */
export async function getPresignedDownloadUrl(
  key: string,
  filename?: string,
  expiresInSeconds = 900
): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: ATTACHMENTS_BUCKET,
    Key: key,
    ResponseContentDisposition: filename ? `inline; filename="${encodeURIComponent(filename)}"` : undefined
  });

  return getSignedUrl(s3Client, command, { expiresIn: expiresInSeconds });
}

/**
 * Check if an object exists in S3 and retrieve its size and metadata.
 */
export async function getObjectMetadata(key: string) {
  const command = new HeadObjectCommand({
    Bucket: ATTACHMENTS_BUCKET,
    Key: key
  });

  return s3Client.send(command);
}

/**
 * Delete an object from S3.
 */
export async function deleteS3Object(key: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: ATTACHMENTS_BUCKET,
    Key: key
  });

  await s3Client.send(command);
}
