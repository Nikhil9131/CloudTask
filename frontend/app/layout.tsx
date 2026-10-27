import type { Metadata, Viewport } from 'next';
import './globals.css';
import { ToastProvider } from '../components/ui/ToastContext';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#EEEBDA'
};

export const metadata: Metadata = {
  title: 'CloudTask | Serverless Multi-User Task & Document Management',
  description:
    'Production-grade serverless task and document management web application with multi-user collaboration and private encrypted S3 storage.',
  keywords: ['AWS Serverless', 'Next.js', 'DynamoDB', 'Amazon S3', 'API Gateway', 'Tailwind CSS', 'Vanilla Theme', 'Multi-User'],
  authors: [{ name: 'Nikhil' }]
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full font-sans antialiased text-[#231E17] bg-[#EEEBDA] dark:bg-[#18140F] dark:text-[#EEEBDA]">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
