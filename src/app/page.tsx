'use client';

import { useState, useCallback } from 'react';
import { Camera } from '@/components/Camera';
import { ImageUploader } from '@/components/ImageUploader';
import { SampleDataForm } from '@/components/SampleDataForm';
import { useOCR } from '@/hooks/useOCR';
import { ParsedSampleData, SampleData } from '@/types';
import toast from 'react-hot-toast';

type AppState = 'idle' | 'camera' | 'processing' | 'form';

export default function Home() {
  const [state, setState] = useState<AppState>('idle');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [parsedData, setParsedData] = useState<ParsedSampleData | null>(null);

  const { recognize, progress, rawText } = useOCR();

  const handleReset = useCallback(() => {
    setImagePreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setParsedData(null);
    setState('idle');
  }, []);

  const processImage = useCallback(async (image: File | Blob) => {
    const previewUrl = URL.createObjectURL(image);
    setImagePreview(previewUrl);
    setState('processing');

    const result = await recognize(image);

    if (result) {
      setParsedData(result);
      setState('form');

      const missingFields = [];
      if (!result.well) missingFields.push('Well');
      if (result.depthFrom === null) missingFields.push('Depth From');
      if (result.depthTo === null) missingFields.push('Depth To');

      if (missingFields.length > 0) {
        toast(`Could not detect: ${missingFields.join(', ')}. Please fill in manually.`, {
          icon: '⚠️',
          duration: 4000,
        });
      }
    } else {
      toast.error('Failed to process image. Please try again.');
      handleReset();
    }
  }, [recognize, handleReset]);

  const handleCameraCapture = useCallback((blob: Blob) => {
    processImage(blob);
  }, [processImage]);

  const handleFileUpload = useCallback((file: File) => {
    processImage(file);
  }, [processImage]);

  const handleSave = useCallback(async (data: SampleData) => {
    try {
      const response = await fetch('/api/save-to-sheet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to save');
      }

      toast.success('Saved to Google Sheets!');
      handleReset();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save';
      toast.error(message);
      throw error;
    }
  }, [handleReset]);

  return (
    <main className="min-h-screen">
      {state === 'camera' && (
        <Camera
          onCapture={handleCameraCapture}
          onClose={() => setState('idle')}
        />
      )}

      <div className="max-w-lg mx-auto px-4 py-6">
        <header className="text-center mb-8">
          <h1 className="text-2xl font-bold text-slate-800">Sample Scanner</h1>
          <p className="text-slate-500 text-sm mt-1">
            Scan labels & save to Google Sheets
          </p>
        </header>

        {state === 'idle' && (
          <div className="space-y-4">
            <button
              onClick={() => setState('camera')}
              className="w-full flex items-center justify-center gap-3 bg-blue-600 text-white py-4 px-6 rounded-xl font-medium hover:bg-blue-700 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Scan with Camera
            </button>

            <div className="flex items-center gap-4 my-6">
              <div className="flex-1 h-px bg-slate-200" />
              <span className="text-slate-400 text-sm">or</span>
              <div className="flex-1 h-px bg-slate-200" />
            </div>

            <ImageUploader onUpload={handleFileUpload} />

            <div className="mt-8 p-4 bg-slate-100 rounded-xl">
              <h3 className="font-medium text-slate-700 mb-2">Label Format</h3>
              <div className="text-sm text-slate-500 space-y-1">
                <p>• Well: [well name]</p>
                <p>• Company: [company name]</p>
                <p>• Depth: [from] - [to]</p>
                <p>• Box Code: [XXX.XX.XXX]</p>
              </div>
            </div>
          </div>
        )}

        {state === 'processing' && (
          <div className="space-y-6">
            {imagePreview && (
              <div className="rounded-xl overflow-hidden border border-slate-200">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imagePreview}
                  alt="Captured"
                  className="w-full h-auto"
                />
              </div>
            )}

            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
              <div className="flex items-center gap-3 mb-4">
                <svg className="animate-spin h-5 w-5 text-blue-600" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span className="text-slate-700 font-medium">Processing image...</span>
              </div>

              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-sm text-slate-500 mt-2 text-center">{progress}%</p>
            </div>

            <button
              onClick={handleReset}
              className="w-full py-3 text-slate-600 font-medium"
            >
              Cancel
            </button>
          </div>
        )}

        {state === 'form' && parsedData && (
          <div className="space-y-6">
            {imagePreview && (
              <div className="rounded-xl overflow-hidden border border-slate-200">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imagePreview}
                  alt="Captured"
                  className="w-full h-auto"
                />
              </div>
            )}

            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
              <h2 className="font-semibold text-slate-800 mb-4">Extracted Data</h2>
              <SampleDataForm
                initialData={parsedData}
                onSave={handleSave}
                onReset={handleReset}
              />
            </div>

            {rawText && (
              <details className="bg-slate-100 rounded-xl p-4">
                <summary className="text-sm text-slate-500 cursor-pointer">
                  View raw OCR text
                </summary>
                <pre className="mt-3 text-xs text-slate-600 whitespace-pre-wrap break-words">
                  {rawText}
                </pre>
              </details>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
