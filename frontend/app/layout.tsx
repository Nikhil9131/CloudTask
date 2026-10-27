import type { Metadata, Viewport } from 'next';
import './globals.css';
import { ToastProvider } from '../components/ui/ToastContext';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1
};

export const metadata: Metadata = {
  title: 'CloudTask | Serverless Task & Document Management',
  description:
    'Production-grade serverless task and document management web application built for Cybernetics Software Pvt. Ltd. Junior Software Developer Assessment.',
  keywords: ['AWS Serverless', 'Next.js', 'DynamoDB', 'Amazon S3', 'API Gateway', 'Tailwind CSS'],
  authors: [{ name: 'Nikhil' }]
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full font-sans antialiased text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-slate-950">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
