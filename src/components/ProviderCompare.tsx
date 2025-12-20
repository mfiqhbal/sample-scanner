'use client';

import { useState, useRef, useCallback } from 'react';

interface OCRResult {
  well: string;
  company: string;
  depthFrom: number | null;
  depthTo: number | null;
  boxCode: string;
}

interface ProviderResult {
  provider: string;
  success: boolean;
  data?: OCRResult;
  error?: string;
  responseTime: number;
  estimatedCost: string;
}

interface CompareResponse {
  success: boolean;
  results: ProviderResult[];
  summary: {
    totalProviders: number;
    successful: number;
    failed: number;
  };
}

const PROVIDER_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  gemini: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700' },
  openai: { bg: 'bg-violet-50', border: 'border-violet-200', text: 'text-violet-700' },
  claude: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700' },
};

const PROVIDER_LABELS: Record<string, string> = {
  gemini: 'Google Gemini 2.0 Flash',
  openai: 'OpenAI GPT-4o-mini',
  claude: 'Claude Haiku 3.5',
};

export function ProviderCompare() {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isComparing, setIsComparing] = useState(false);
  const [results, setResults] = useState<ProviderResult[] | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;

    // Reset state
    setResults(null);
    setIsComparing(true);

    // Create preview
    const previewUrl = URL.createObjectURL(file);
    setImagePreview(previewUrl);

    // Convert to base64
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;

      try {
        const response = await fetch('/api/compare', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: base64 }),
        });

        const data: CompareResponse = await response.json();
        setResults(data.results);
      } catch (error) {
        console.error('Compare error:', error);
      } finally {
        setIsComparing(false);
      }
    };
    reader.readAsDataURL(file);

    // Reset input
    if (inputRef.current) inputRef.current.value = '';
  }, []);

  const handleReset = useCallback(() => {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(null);
    setResults(null);
    setIsComparing(false);
  }, [imagePreview]);

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      {!imagePreview && (
        <div
          onClick={() => inputRef.current?.click()}
          className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center cursor-pointer hover:border-slate-400 hover:bg-slate-50 transition-colors"
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
          <svg className="w-12 h-12 mx-auto mb-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="font-medium text-slate-600">Upload image to compare providers</p>
          <p className="text-sm text-slate-400 mt-1">Test DeepSeek vs OpenAI vs Claude</p>
        </div>
      )}

      {/* Image Preview */}
      {imagePreview && (
        <div className="rounded-xl overflow-hidden border border-slate-200">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imagePreview} alt="Test image" className="w-full h-auto max-h-64 object-contain bg-slate-100" />
        </div>
      )}

      {/* Loading State */}
      {isComparing && (
        <div className="flex items-center justify-center gap-3 py-8">
          <svg className="animate-spin h-6 w-6 text-blue-600" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span className="text-slate-600">Testing all providers...</span>
        </div>
      )}

      {/* Results */}
      {results && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-slate-800">Comparison Results</h3>
            <button
              onClick={handleReset}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              Test another image
            </button>
          </div>

          <div className="grid gap-4">
            {results.map((result) => {
              const colors = PROVIDER_COLORS[result.provider] || { bg: 'bg-slate-50', border: 'border-slate-200', text: 'text-slate-700' };
              const label = PROVIDER_LABELS[result.provider] || result.provider;

              return (
                <div
                  key={result.provider}
                  className={`rounded-xl border p-4 ${colors.bg} ${colors.border}`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className={`font-semibold ${colors.text}`}>{label}</span>
                      {result.success ? (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Success</span>
                      ) : (
                        <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">Failed</span>
                      )}
                    </div>
                    <div className="text-right text-sm">
                      <div className="text-slate-600">{result.responseTime}ms</div>
                      <div className="text-slate-400">{result.estimatedCost}/image</div>
                    </div>
                  </div>

                  {result.success && result.data ? (
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-slate-500">Well:</span>{' '}
                        <span className="text-slate-800">{result.data.well || '-'}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Company:</span>{' '}
                        <span className="text-slate-800">{result.data.company || '-'}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Depth:</span>{' '}
                        <span className="text-slate-800">
                          {result.data.depthFrom ?? '-'} - {result.data.depthTo ?? '-'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500">Box:</span>{' '}
                        <span className="text-slate-800">{result.data.boxCode || '-'}</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-red-600">{result.error}</p>
                  )}
                </div>
              );
            })}
          </div>

          {/* Cost Summary */}
          <div className="bg-slate-100 rounded-xl p-4">
            <h4 className="font-medium text-slate-700 mb-2">Monthly Cost Estimate (10k images/week)</h4>
            <div className="grid grid-cols-3 gap-4 text-center text-sm">
              <div>
                <div className="font-semibold text-blue-600">$2</div>
                <div className="text-slate-500">Gemini</div>
              </div>
              <div>
                <div className="font-semibold text-violet-600">$15</div>
                <div className="text-slate-500">OpenAI</div>
              </div>
              <div>
                <div className="font-semibold text-amber-600">$45</div>
                <div className="text-slate-500">Claude</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
