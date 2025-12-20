'use client';

import { useState, useCallback } from 'react';
import { ParsedSampleData } from '@/types';

interface UseOCRReturn {
  recognize: (image: File | Blob | string) => Promise<ParsedSampleData | null>;
  isProcessing: boolean;
  progress: number;
  rawText: string;
  error: string | null;
}

export function useOCR(): UseOCRReturn {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [rawText, setRawText] = useState('');
  const [error, setError] = useState<string | null>(null);

  const recognize = useCallback(async (image: File | Blob | string): Promise<ParsedSampleData | null> => {
    setIsProcessing(true);
    setProgress(10);
    setError(null);
    setRawText('');

    try {
      // Convert to base64 if needed
      let base64Image: string;
      if (typeof image === 'string') {
        base64Image = image;
      } else {
        base64Image = await blobToBase64(image);
      }

      setProgress(30);

      // Call Claude Vision API
      const response = await fetch('/api/ocr', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ image: base64Image }),
      });

      setProgress(80);

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'OCR processing failed');
      }

      const rawOutput = {
        provider: result.provider,
        model: result.model,
        data: result.data,
      };
      setRawText(JSON.stringify(rawOutput, null, 2));
      setProgress(100);

      // Return parsed data from Claude
      return {
        well: result.data.well || '',
        company: result.data.company || '',
        depthFrom: result.data.depthFrom,
        depthTo: result.data.depthTo,
        boxCode: result.data.boxCode || '',
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'OCR processing failed';
      setError(errorMessage);
      console.error('OCR Error:', err);
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  return {
    recognize,
    isProcessing,
    progress,
    rawText,
    error,
  };
}

// Helper function to convert Blob/File to base64
function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to convert blob to base64'));
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
