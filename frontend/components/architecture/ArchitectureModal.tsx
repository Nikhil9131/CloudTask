'use client';

import React from 'react';
import {
  Layers,
  Server,
  Database,
  HardDrive,
  Globe,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  Lock,
  ArrowRight,
  Activity
} from 'lucide-react';

export function ArchitectureModal() {
  const components = [
    {
      title: 'Frontend Hosting',
      service: 'AWS Amplify Hosting',
      icon: Globe,
      color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 dark:text-indigo-400',
      description: 'Next.js App Router, React 18, TypeScript, Tailwind CSS. Managed CI/CD with automatic HTTPS certificate and global edge distribution.'
    },
    {
      title: 'API Layer',
      service: 'Amazon API Gateway (HTTP API v2)',
      icon: Activity,
      color: 'text-sky-600 bg-sky-50 dark:bg-sky-950/60 dark:text-sky-400',
      description: 'Low-latency serverless HTTP API routing requests to Lambda with CORS preflight handling, payload limits, and request throttling.'
    },
    {
      title: 'Compute Layer',
      service: 'AWS Lambda (Node.js 20.x)',
      icon: Server,
      color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/60 dark:text-amber-400',
      description: 'Zero server management. Executes task validation, DynamoDB CRUD operations, presigned S3 URL issuance, and attachment verification.'
    },
    {
      title: 'Database',
      service: 'Amazon DynamoDB',
      icon: Database,
      color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 dark:text-emerald-400',
      description: 'Table: CloudTaskTasks. Primary Key: taskId (String). Global Secondary Index: StatusCreatedAtIndex (PK: status, SK: createdAt) for zero-scan filtering.'
    },
    {
      title: 'File Storage',
      service: 'Amazon S3',
      icon: HardDrive,
      color: 'text-purple-600 bg-purple-50 dark:bg-purple-950/60 dark:text-purple-400',
      description: 'Private bucket with BlockPublicAccess enabled on all 4 settings. SSE-S3 AES256 server-side encryption. Direct client PUT via presigned URLs.'
    },
    {
      title: 'Observability',
      service: 'Amazon CloudWatch',
      icon: ShieldCheck,
      color: 'text-rose-600 bg-rose-50 dark:bg-rose-950/60 dark:text-rose-400',
      description: 'Automatic Lambda invocation logging, error metric tracking, and API Gateway request execution tracing.'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Overview Card */}
      <div className="p-6 rounded-2xl bg-[#FAF8F2] dark:bg-[#1C1813] border border-[#DCD6C0] dark:border-[#332C23] shadow-sm space-y-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              CloudTask AWS Serverless Architecture
            </h2>
            <p className="text-xs text-slate-500">
              Multi-User Serverless Workspace • Target Region: ap-south-1 (Mumbai)
            </p>
          </div>
        </div>

        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          CloudTask is built entirely using AWS Serverless primitives. EC2 instances are strictly prohibited and avoided. 
          The architecture follows least-privilege security: browser uploads never stream through Lambda memory, 
          S3 buckets are strictly private, and all access is arbitrated via short-lived AWS SigV4 presigned URLs.
        </p>

        {/* Data Flow Pipeline */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 space-y-3">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            End-to-End Request Pipeline
          </span>
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
            <span className="px-3 py-1.5 rounded-lg bg-[#FAF8F2] dark:bg-[#1C1813] border border-[#DCD6C0] dark:border-[#332C23] text-slate-800 dark:text-slate-200 shadow-sm">
              Browser / Amplify
            </span>
            <ArrowRight className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <span className="px-3 py-1.5 rounded-lg bg-sky-50 dark:bg-sky-950/50 border border-sky-200 dark:border-sky-800 text-sky-700 dark:text-sky-300">
              API Gateway HTTP API
            </span>
            <ArrowRight className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <span className="px-3 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300">
              Lambda (Node.js 20)
            </span>
            <ArrowRight className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <span className="px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300">
              DynamoDB (CloudTaskTasks)
            </span>
          </div>

          <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800/60 flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
            <span className="text-indigo-600 font-bold">Direct S3 Flow:</span>
            <span>Browser</span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
            <span>Presigned Upload URL (Lambda)</span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
            <span>Direct PUT to S3 Bucket</span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
            <span>Metadata Confirmation (Lambda)</span>
          </div>
        </div>
      </div>

      {/* Service Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {components.map((c) => {
          const Icon = c.icon;
          return (
            <div
              key={c.title}
              className="p-5 rounded-2xl bg-[#FAF8F2] dark:bg-[#1C1813] border border-[#DCD6C0] dark:border-[#332C23] shadow-sm space-y-2 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center gap-2.5 mb-2">
                  <div className={`p-2 rounded-xl ${c.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-xs">
                      {c.title}
                    </h3>
                    <p className="font-mono text-[11px] text-slate-400">{c.service}</p>
                  </div>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  {c.description}
                </p>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center gap-1.5 text-[11px] text-emerald-600 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>AWS Best Practice Verified</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Security Principles Callout */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
        <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
          <Lock className="w-4 h-4 text-emerald-500" />
          Security & Assessment Constraints
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-slate-600 dark:text-slate-300">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 space-y-1">
            <span className="font-semibold text-slate-800 dark:text-slate-100">
              1. Zero EC2 Instances
            </span>
            <p className="text-slate-500">
              Compute is 100% ephemeral Lambda. No ongoing server maintenance, patching, or idle compute charges.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 space-y-1">
            <span className="font-semibold text-slate-800 dark:text-slate-100">
              2. S3 Block Public Access
            </span>
            <p className="text-slate-500">
              All 4 public access blocks enabled. No file is publicly accessible directly. Viewing uses time-limited signed URLs.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 space-y-1">
            <span className="font-semibold text-slate-800 dark:text-slate-100">
              3. Least-Privilege IAM Roles
            </span>
            <p className="text-slate-500">
              Lambda execution role is scoped strictly to CloudTaskTasks DynamoDB table and attachments S3 ARN.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 space-y-1">
            <span className="font-semibold text-slate-800 dark:text-slate-100">
              4. Single-User Assessment Scope
            </span>
            <p className="text-slate-500">
              Explicitly documented single-user evaluation. Authentication is deferred for future multi-tenant releases.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
