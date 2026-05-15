/**
 * BackendStatus — shows a clear error banner when the Express/Supabase
 * backend is unreachable.  Wrap any data-fetching component with this.
 */
import React from 'react';
import { AlertTriangle, RefreshCw, Server } from 'lucide-react';

interface Props {
  error: Error | string | null;
  onRetry?: () => void;
  children?: React.ReactNode;
}

export function BackendStatus({ error, onRetry, children }: Props) {
  if (!error) return <>{children}</>;

  const msg = typeof error === 'string' ? error : error.message;

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="bg-white border border-red-200 rounded-2xl shadow-lg p-8 max-w-lg w-full text-center">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
            <Server className="w-8 h-8 text-red-500" />
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 mb-2">
          <AlertTriangle className="w-5 h-5 text-red-500" />
          <h2 className="text-red-700">Backend Not Reachable</h2>
        </div>

        <p className="text-gray-600 text-sm mb-5">{msg}</p>

        {/* Quick-start instructions */}
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-left mb-5 text-sm">
          <p className="text-gray-700 mb-2">To start the backend locally:</p>
          <ol className="list-decimal list-inside space-y-1 text-gray-600">
            <li>
              Copy <code className="bg-gray-200 px-1 rounded">src/backend/.env.example</code> →{' '}
              <code className="bg-gray-200 px-1 rounded">src/backend/.env</code>
            </li>
            <li>
              Set <code className="bg-gray-200 px-1 rounded">DATABASE_URL</code> to your Supabase
              PostgreSQL connection string
            </li>
            <li>
              Run{' '}
              <code className="bg-gray-200 px-1 rounded">cd src/backend &amp;&amp; npm install &amp;&amp; npm run dev</code>
            </li>
          </ol>
          <p className="text-gray-500 mt-3 text-xs">
            Get your connection string from:{' '}
            <span className="font-medium">Supabase Dashboard → Project Settings → Database → Connection string (URI)</span>
          </p>
        </div>

        {onRetry && (
          <button
            onClick={onRetry}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm text-white"
            style={{ background: '#ee6b20' }}
          >
            <RefreshCw className="w-4 h-4" />
            Retry Connection
          </button>
        )}
      </div>
    </div>
  );
}
