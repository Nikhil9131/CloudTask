# CloudTask - Serverless Task & Document Management Platform

> **Serverless Cloud Application Submission**  
> **Target Region**: `ap-south-1` (Mumbai)  
> **Architecture**: 100% Serverless (Zero EC2, DynamoDB, Lambda, S3)  

---

## 1. Project Overview

**CloudTask** is a serverless SaaS task and document management web application. It combines a Next.js App Router frontend with an event-driven AWS serverless backend (API Gateway HTTP API, AWS Lambda, Amazon DynamoDB, and Amazon S3).

The application enables users to organize tasks across configurable statuses (`TODO`, `IN_PROGRESS`, `COMPLETED`) and priorities (`LOW`, `MEDIUM`, `HIGH`), while securely attaching documents (PDF, PNG, JPEG up to 5 MB) directly to a private, encrypted S3 bucket using short-lived AWS SigV4 presigned URLs.

### Key Highlights
- **100% Serverless**: Ephemeral compute with zero EC2 instances or persistent VMs.
- **Direct S3 Uploads**: File uploads bypass the Lambda execution layer via presigned S3 URLs, preventing timeouts and compute overhead.
- **Strict Validation**: Double-sided validation (browser and server) for file types, size ceilings (5 MB), and task attributes.
- **Least-Privilege Security**: Minimal IAM policy scopes and zero public S3 bucket access.
- **Fast Local & Cloud Development**: Built-in local development server and offline preview mode, alongside complete AWS SAM IaC deployment.

---

## 2. AWS Serverless Architecture

```mermaid
graph TD
    User["User Browser<br/>(Desktop / Tablet / Mobile)"]

    subgraph AWS_Cloud ["AWS Cloud (ap-south-1 Mumbai)"]
        subgraph Hosting ["Frontend Hosting"]
            Amplify["AWS Amplify Hosting<br/>(Next.js App Router, Global CDN, HTTPS)"]
        end

        subgraph Ingress ["API Gateway"]
            HttpApi["Amazon API Gateway HTTP API (v2)<br/>(CORS, $default stage)"]
        end

        subgraph Compute ["Compute"]
            Lambda["AWS Lambda Function<br/>(Node.js 20.x, TypeScript, 512MB)"]
        end

        subgraph Storage ["Data & Storage"]
            DynamoDB[("Amazon DynamoDB<br/>Table: CloudTaskTasks<br/>GSI: StatusCreatedAtIndex")]
            S3[("Amazon S3 Bucket<br/>cloudtask-attachments-*<br/>(Private, AES256 SSE)")]
        end

        subgraph Observability ["Monitoring"]
            CloudWatch["Amazon CloudWatch<br/>(Logs & Metrics)"]
        end
    end

    User -->|"1. HTTPS / Next.js Assets"| Amplify
    User -->|"2. REST API Requests"| HttpApi
    HttpApi -->|"3. Proxy Events"| Lambda
    Lambda -->|"4. CRUD Queries"| DynamoDB
    Lambda -->|"5. Generate Presigned URL"| S3
    User -->|"6. Direct Upload / Download (PUT/GET)"| S3
    Lambda -.->|"Logs"| CloudWatch
```

### S3 Direct Upload Flow

```mermaid
sequenceDiagram
    autonumber
    actor Client as Browser
    participant API as API Gateway
    participant Lambda as Lambda Handler
    participant S3 as Private S3 Bucket
    participant DDB as DynamoDB

    Client->>Client: Validate file: PDF, PNG, JPEG only, <= 5 MB
    Client->>API: POST /tasks/{taskId}/upload-url
    API->>Lambda: Parse request & validate
    Lambda->>DDB: Confirm task exists
    Lambda->>S3: Generate presigned PUT URL (5 min expiry)
    Lambda-->>Client: Return { uploadUrl, key, expiresIn: 300 }
    Client->>S3: HTTP PUT file bytes directly to presigned URL
    S3-->>Client: 200 OK
    Client->>API: POST /tasks/{taskId}/attachment { key, name, size, type }
    API->>Lambda: Verify object exists via S3 HeadObject
    Lambda->>DDB: Save attachment metadata to task
    Lambda-->>Client: 200 OK with updated Task object
```

---

## 3. Technology Stack

| Layer | Technology | Description |
| :--- | :--- | :--- |
| **Frontend Framework** | Next.js 14 (App Router) | React 18, TypeScript, Server & Client Components |
| **Styling** | Tailwind CSS | Modern SaaS design, responsive cards, modals, badges |
| **Iconography** | Lucide React | Clean, consistent icons |
| **Hosting** | AWS Amplify Hosting | Continuous deployment from GitHub with HTTPS |
| **API Gateway** | Amazon API Gateway (HTTP API v2) | Low-latency, cost-effective serverless ingress |
| **Compute** | AWS Lambda | Node.js 20.x runtime, TypeScript compiled via `tsc` |
| **Database** | Amazon DynamoDB | On-demand billing (`PAY_PER_REQUEST`), GSI indexing |
| **Object Storage** | Amazon S3 | Private bucket, AES-256 SSE, Block Public Access |
| **Infrastructure as Code** | AWS SAM | Declarative CloudFormation template (`template.yaml`) |
| **Monitoring** | Amazon CloudWatch | Lambda logs and API execution metrics |
| **Target AWS Region** | `ap-south-1` (Mumbai) | Minimal latency for Indian infrastructure |

---

## 4. Repository Structure

```
cloud task/
├── backend/
│   ├── scripts/
│   │   └── smoke-test.ps1       # Automated PowerShell API smoke test suite
│   ├── src/
│   │   ├── aws-clients.ts       # DynamoDB DocumentClient & S3 presigner
│   │   ├── index.ts             # Main Lambda router with CORS & error handling
│   │   ├── local-server.ts      # Local Express dev server mimicking API Gateway
│   │   ├── task-service.ts      # Core CRUD service and S3 lifecycle logic
│   │   ├── types.ts             # Domain interfaces and request/response DTOs
│   │   └── validator.ts         # Input validation & sanitization functions
│   ├── tests/
│   │   ├── handler.test.ts      # Route & integration tests with mocked AWS SDK
│   │   └── validator.test.ts    # Unit tests for schemas and file constraints
│   ├── .env.example             # Backend environment variable template
│   ├── jest.config.js           # Jest configuration
│   ├── package.json             # Backend dependencies & scripts
│   ├── template.yaml            # AWS SAM Infrastructure as Code definition
│   └── tsconfig.json            # Backend TypeScript configuration
├── frontend/
│   ├── app/
│   │   ├── globals.css          # Global styling, Tailwind directives, variables
│   │   ├── layout.tsx           # Root layout with ToastProvider & SEO metadata
│   │   └── page.tsx             # Main dashboard, tab switcher & modal controllers
│   ├── components/
│   │   ├── architecture/        # In-app interactive architecture documentation
│   │   ├── dashboard/           # Real DynamoDB metrics and priority distribution
│   │   ├── documents/           # Dedicated S3 document repository view
│   │   ├── layout/              # Collapsible sidebar and responsive header
│   │   ├── tasks/               # Task table, card grid, create/edit/view modals
│   │   └── ui/                  # Toast notification system
│   ├── lib/
│   │   ├── api.ts               # API client supporting live AWS & offline demo
│   │   ├── types.ts             # Frontend domain models
│   │   └── utils.ts             # Formatting and class merging helpers
│   ├── .env.example             # Frontend environment variable template
│   ├── next.config.mjs          # Next.js configuration
│   ├── package.json             # Frontend dependencies & scripts
│   ├── tailwind.config.ts       # Tailwind CSS theme extension
│   └── tsconfig.json            # Frontend TypeScript configuration
├── docs/
│   └── architecture.md          # In-depth architectural & security specification
├── .gitignore                   # Monorepo gitignore rules
└── README.md                    # Project documentation & submission instructions
```

---

## 5. API Endpoints Specification

Base URL (when deployed): `https://{apiId}.execute-api.ap-south-1.amazonaws.com`

| Method | Endpoint | Description | Request Body | Response |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/tasks` | List tasks with filtering & pagination | None (Query: `status`, `priority`, `search`, `limit`, `nextToken`) | `{ success: true, data: { tasks: [...], total, nextToken } }` |
| `POST` | `/tasks` | Create a new task (Server generates ID & timestamps) | `{ title, description?, priority?, status? }` | `{ success: true, data: TaskItem }` (201 Created) |
| `GET` | `/tasks/{taskId}` | Retrieve task (includes presigned download URL if attachment exists) | None | `{ success: true, data: TaskItem }` (200 OK) |
| `PUT` | `/tasks/{taskId}` | Update permitted task fields | `{ title?, description?, priority?, status? }` | `{ success: true, data: TaskItem }` (200 OK) |
| `DELETE` | `/tasks/{taskId}` | Delete task and delete associated file in S3 | None | `{ success: true, message: "Task deleted" }` (200 OK) |
| `POST` | `/tasks/{taskId}/upload-url` | Authorize file and return presigned PUT URL | `{ filename, contentType, size }` | `{ success: true, data: { uploadUrl, key, expiresIn } }` (200 OK) |
| `POST` | `/tasks/{taskId}/attachment` | Confirm S3 object existence and save metadata | `{ key, name, size, type }` | `{ success: true, data: TaskItem }` (200 OK) |

---

## 6. Environment Variables

### Frontend Configuration (`frontend/.env.local`)
Create `frontend/.env.local` by copying `frontend/.env.example`:

```bash
NEXT_PUBLIC_API_URL=https://your-api-id.execute-api.ap-south-1.amazonaws.com
```
*Note: If `NEXT_PUBLIC_API_URL` is omitted or empty, the frontend runs in offline preview mode with interactive mock storage.*

### Backend Configuration (`backend/template.yaml` & `backend/.env`)
Configured automatically during AWS SAM deployment:
- `TASKS_TABLE`: DynamoDB table name (`CloudTaskTasks`).
- `ATTACHMENTS_BUCKET`: Private S3 bucket name (`cloudtask-attachments-${AWS::AccountId}-${AWS::Region}`).
- `ALLOWED_ORIGIN`: Allowed CORS origin for frontend domain (`*` or Amplify URL).
- `AWS_REGION`: `ap-south-1`.

---

## 7. Local Development Guide

### Prerequisites
- Node.js 18.x or 20.x or 24.x
- npm 9+
- Windows PowerShell

### Step 1: Install Dependencies & Run Tests
Open Windows PowerShell:

```powershell
# 1. Install and test Backend
cd "c:\Users\nikhi\OneDrive\Desktop\cloud task\backend"
npm install
npm test
npm run build

# 2. Install and verify Frontend
cd "..\frontend"
npm install
npm run lint
npm run build
```

### Step 2: Run Full-Stack Locally
Run the local backend and frontend in separate PowerShell windows:

**Window 1 (Backend Local Server):**
```powershell
cd "c:\Users\nikhi\OneDrive\Desktop\cloud task\backend"
npm run local
# Running at http://localhost:5000
```

**Window 2 (Frontend Dev Server):**
```powershell
cd "c:\Users\nikhi\OneDrive\Desktop\cloud task\frontend"
# Point to local server in .env.local:
# NEXT_PUBLIC_API_URL=http://localhost:5000
npm run dev
# Open http://localhost:3000 in your browser
```

### Step 3: Run Automated Smoke Tests
With the local server running:
```powershell
cd "c:\Users\nikhi\OneDrive\Desktop\cloud task\backend"
powershell -ExecutionPolicy Bypass -File .\scripts\smoke-test.ps1 -BaseUrl "http://localhost:5000"
```
