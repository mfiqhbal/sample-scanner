import { NextRequest, NextResponse } from 'next/server';
import { ClaudeOCRProvider } from '@/services/ocr/claude';
import { OpenAIOCRProvider } from '@/services/ocr/openai';
import { GeminiOCRProvider } from '@/services/ocr/gemini';
import { OCRResult } from '@/services/ocr/types';

interface ProviderResult {
  provider: string;
  success: boolean;
  data?: OCRResult;
  error?: string;
  responseTime: number;
  estimatedCost: string;
}

// Cost per image (approximate, based on typical geological label image)
const COST_PER_IMAGE = {
  gemini: 0.00005,     // ~$0.50 per 10k images (~$2/month)
  openai: 0.00035,     // ~$3.50 per 10k images
  claude: 0.00105,     // ~$10.50 per 10k images
};

export async function POST(request: NextRequest) {
  try {
    const { image } = await request.json();

    if (!image) {
      return NextResponse.json(
        { error: 'Image is required' },
        { status: 400 }
      );
    }

    const results: ProviderResult[] = [];

    // Test each provider that has an API key configured
    const providers = [
      { key: 'GEMINI_API_KEY', name: 'gemini', Provider: GeminiOCRProvider },
      { key: 'OPENAI_API_KEY', name: 'openai', Provider: OpenAIOCRProvider },
      { key: 'ANTHROPIC_API_KEY', name: 'claude', Provider: ClaudeOCRProvider },
    ];

    for (const { key, name, Provider } of providers) {
      if (!process.env[key]) {
        results.push({
          provider: name,
          success: false,
          error: `${key} not configured`,
          responseTime: 0,
          estimatedCost: '$0',
        });
        continue;
      }

      const startTime = Date.now();
      try {
        const provider = new Provider();
        const data = await provider.recognize(image);
        const responseTime = Date.now() - startTime;

        results.push({
          provider: name,
          success: true,
          data,
          responseTime,
          estimatedCost: `$${COST_PER_IMAGE[name as keyof typeof COST_PER_IMAGE].toFixed(6)}`,
        });
      } catch (error) {
        const responseTime = Date.now() - startTime;
        results.push({
          provider: name,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          responseTime,
          estimatedCost: '$0',
        });
      }
    }

    return NextResponse.json({
      success: true,
      results,
      summary: {
        totalProviders: results.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
      },
    });
  } catch (error) {
    console.error('Compare error:', error);
    const message = error instanceof Error ? error.message : 'Comparison failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
