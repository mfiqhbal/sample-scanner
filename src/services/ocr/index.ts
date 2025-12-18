import { OCRProvider } from './types';
import { ClaudeOCRProvider } from './claude';
import { OpenAIOCRProvider } from './openai';

export type OCRProviderType = 'claude' | 'openai';

export function getOCRProvider(type?: OCRProviderType): OCRProvider {
  const providerType = type || (process.env.OCR_PROVIDER as OCRProviderType) || 'claude';

  switch (providerType) {
    case 'openai':
      if (!process.env.OPENAI_API_KEY) {
        throw new Error('OPENAI_API_KEY is not configured');
      }
      return new OpenAIOCRProvider();

    case 'claude':
    default:
      if (!process.env.ANTHROPIC_API_KEY) {
        throw new Error('ANTHROPIC_API_KEY is not configured');
      }
      return new ClaudeOCRProvider();
  }
}

export type { OCRProvider, OCRResult } from './types';
