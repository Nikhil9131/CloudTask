# CloudTask Architecture & Technical Specification

## 1. System Overview

CloudTask is a cloud-native, serverless task and document management web application. The system is designed around modern serverless patterns, strict security standards, least-privilege IAM permissions, and responsive user experience.

### Key Architectural Tenets
- **100% Serverless & Ephemeral**: Zero EC2 instances or persistent VMs. Idle cost is zero.
- **Direct-to-S3 Document Transfers**: File bytes never traverse the Lambda runtime, preventing memory bottlenecks, execution timeouts, and unnecessary compute costs.
- **Least-Privilege Security**: IAM roles are scoped to specific resource ARNs with minimal action sets. Public S3 access is blocked at the bucket level.
- **AWS Target Region**: `ap-south-1` (Asia Pacific - Mumbai) for minimal latency in India.

---

## 2. High-Level Architecture Diagram

```mermaid
graph TD
    Client["User Browser (Desktop / Tablet / Mobile)"]

    subgraph AWS_Cloud ["AWS Cloud (Region: ap-south-1)"]
        subgraph Edge_Hosting ["Frontend Edge Hosting"]
            Amplify["AWS Amplify Hosting<br/>(Next.js App Router, SSR/SSG, Global CDN)"]
        end

        subgraph Ingress ["API Gateway Layer"]
            HttpApi["Amazon API Gateway HTTP API (v2)<br/>(CORS, Low Latency, $default stage)"]
        end

        subgraph Compute ["Compute Layer"]
            Lambda["AWS Lambda Function<br/>(Node.js 20.x, TypeScript, 512MB)"]
        end

        subgraph Storage ["Persistence Layer"]
            DynamoDB[("Amazon DynamoDB<br/>Table: CloudTaskTasks<br/>PK: taskId<br/>GSI: StatusCreatedAtIndex")]
            S3[("Amazon S3 Bucket<br/>cloudtask-attachments-*<br/>(Private, AES-256 SSE)")]
        end

        subgraph Monitoring ["Observability"]
            CloudWatch["Amazon CloudWatch<br/>(Logs & Metrics)"]
        end
    end

    Client -->|"1. HTTPS / Assets"| Amplify
    Client -->|"2. REST API Requests"| HttpApi
    HttpApi -->|"3. Proxy Invocations"| Lambda
    Lambda -->|"4. CRUD Queries"| DynamoDB
    Lambda -->|"5. Issue Presigned URL"| S3
    Client -->|"6. Direct Upload / Download (PUT/GET)"| S3
    Lambda -.->|"Logs & Metrics"| CloudWatch
```

---

## 3. Direct Document Upload Sequence (S3 Presigned URL)

To satisfy the 5 MB ceiling and support only PDF, PNG, and JPEG documents without proxying file streams through Lambda, CloudTask utilizes an authorized presigned URL pattern:

```mermaid
sequenceDiagram
    autonumber
    actor User as User Browser
    participant API as API Gateway HTTP API
    participant Lambda as Lambda Handler
    participant S3 as Private S3 Bucket
    participant DDB as DynamoDB Table

    User->>User: Client-side validation (PDF/PNG/JPEG, <= 5 MB)
    User->>API: POST /tasks/{taskId}/upload-url { filename, contentType, size }
    API->>Lambda: Invoke handler with event
    Lambda->>DDB: Verify task exists
    Lambda->>Lambda: Validate MIME type and size ceiling
    Lambda->>S3: Generate short-lived presigned PUT URL (5 min expiry)
    Lambda-->>User: Return { uploadUrl, key, expiresIn: 300 }

    User->>S3: Direct HTTP PUT file bytes to presigned URL
    S3-->>User: HTTP 200 OK (Upload confirmed)

    User->>API: POST /tasks/{taskId}/attachment { key, name, size, type }
    API->>Lambda: Verify & persist attachment
    Lambda->>S3: HeadObject(key) to confirm existence & size
    Lambda->>DDB: Update task item with attachment metadata
    Lambda-->>User: HTTP 200 OK with updated Task object
```

---

## 4. DynamoDB Data Model & Access Patterns

### Table Definition
- **Table Name**: `CloudTaskTasks`
- **Billing Mode**: `PAY_PER_REQUEST` (On-Demand billing, zero idle cost)
- **Partition Key (PK)**: `taskId` (String, e.g. `task_1730000000000_a1b2c3d4`)
- **Encryption**: AWS Managed Key (SSEEnabled: true)

### Secondary Index (GSI)
To support querying tasks by status without scanning the entire table:
- **Index Name**: `StatusCreatedAtIndex`
- **Partition Key**: `status` (String: `TODO` | `IN_PROGRESS` | `COMPLETED`)
- **Sort Key**: `createdAt` (String: ISO-8601 timestamp)
- **Projection**: `ALL`

### Access Patterns Supported

| Business Access Pattern | DynamoDB Operation | Key / Condition |
| :--- | :--- | :--- |
| Create new task | `PutItem` | PK: `taskId` |
| Retrieve task by ID | `GetItem` | PK: `taskId` |
| Update task details | `UpdateItem` | PK: `taskId` |
| Delete task | `DeleteItem` | PK: `taskId` |
| List tasks by status (sorted newest first) | `Query` on `StatusCreatedAtIndex` | PK: `status = :status`, `ScanIndexForward = false` |
| Filter by priority or title search | `Query` with `FilterExpression` | GSI Query + `contains(#title, :search)` |
| Paginate large datasets | `Query` / `Scan` with `Limit` | `ExclusiveStartKey` / `LastEvaluatedKey` |

---

## 5. Amazon S3 Security & Storage Architecture

### Security Controls
1. **Zero Public Access**:
   All 4 settings in `PublicAccessBlockConfiguration` are set to `true`:
   - `BlockPublicAcls: true`
   - `BlockPublicPolicy: true`
   - `IgnorePublicAcls: true`
   - `RestrictPublicBuckets: true`
2. **Server-Side Encryption**:
   - AES256 encryption applied to every object automatically (`SSEAlgorithm: AES256`).
3. **CORS Policy**:
   - Allowed Origins: Configured to frontend origin (or `*` during initial testing).
   - Allowed Methods: `GET`, `PUT`, `HEAD`.
   - MaxAge: 3600 seconds.
4. **Lifecycle Policy**:
   - Incomplete multipart uploads are aborted automatically after 1 day to prevent dangling storage costs.

---

## 6. Least-Privilege AWS IAM Policies

The Lambda function execution role is granted permissions strictly necessary for its operation:

```yaml
Policies:
  # DynamoDB Table and GSI access
  - Statement:
      - Effect: Allow
        Action:
          - dynamodb:GetItem
          - dynamodb:PutItem
          - dynamodb:UpdateItem
          - dynamodb:DeleteItem
          - dynamodb:Scan
          - dynamodb:Query
        Resource:
          - !GetAtt TasksTable.Arn
          - !Sub "${TasksTable.Arn}/index/*"

  # S3 Object access (restricted to the attachments bucket)
  - Statement:
      - Effect: Allow
        Action:
          - s3:PutObject
          - s3:GetObject
          - s3:DeleteObject
          - s3:HeadObject
        Resource:
          - !Sub "${AttachmentsBucket.Arn}/*"
```

---

## 7. Cost & Assessment Scope Analysis

- **AWS Free Tier Friendly**: All selected resources (Lambda 1M free requests/mo, DynamoDB 25GB free, S3 5GB free, API Gateway HTTP API 1M free requests) fall comfortably within AWS Free Tier terms.
- **No EC2 or NAT Gateways**: Eliminates hourly compute charges, VPC endpoint costs, or idling compute charges.
- **Single-User Assessment Notice**: As specified in the assessment requirements, this MVP is evaluated as a single-user system. Multi-tenant isolation and user authentication (e.g. Amazon Cognito or NextAuth) can be layered on top using the existing partition key architecture.
