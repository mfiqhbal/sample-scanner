import { OCRProvider } from './types';
import { ClaudeOCRProvider } from './claude';
import { OpenAIOCRProvider } from './openai';
import { GeminiOCRProvider } from './gemini';

export type OCRProviderType = 'claude' | 'openai' | 'gemini';

export function getOCRProvider(type?: OCRProviderType): OCRProvider {
  const providerType = type || (process.env.OCR_PROVIDER as OCRProviderType) || 'claude';

  switch (providerType) {
    case 'gemini':
      if (!process.env.GEMINI_API_KEY) {
        throw new Error('GEMINI_API_KEY is not configured');
      }
      return new GeminiOCRProvider();

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
