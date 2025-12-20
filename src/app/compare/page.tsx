import { ProviderCompare } from '@/components/ProviderCompare';
import Link from 'next/link';

export default function ComparePage() {
  return (
    <main className="min-h-screen">
      <div className="max-w-lg mx-auto px-4 py-6">
        <header className="text-center mb-8">
          <Link href="/" className="text-blue-600 text-sm mb-2 inline-block hover:underline">
            &larr; Back to Scanner
          </Link>
          <h1 className="text-2xl font-bold text-slate-800">Provider Comparison</h1>
          <p className="text-slate-500 text-sm mt-1">
            Test OCR accuracy across all providers
          </p>
        </header>

        <ProviderCompare />

        <div className="mt-8 p-4 bg-blue-50 rounded-xl border border-blue-100">
          <h3 className="font-medium text-blue-800 mb-2">How to switch providers</h3>
          <p className="text-sm text-blue-700">
            Set <code className="bg-blue-100 px-1 rounded">OCR_PROVIDER=gemini</code> in your <code className="bg-blue-100 px-1 rounded">.env.local</code> file and restart the server.
          </p>
        </div>
      </div>
    </main>
  );
}
