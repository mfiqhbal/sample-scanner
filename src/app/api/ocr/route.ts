import { NextRequest, NextResponse } from 'next/server';
import { getOCRProvider, OCRProviderType } from '@/services/ocr';

export async function POST(request: NextRequest) {
  try {
    const { image, provider } = await request.json();

    if (!image) {
      return NextResponse.json(
        { error: 'Image is required' },
        { status: 400 }
      );
    }

    // Get OCR provider (from request or environment variable)
    const ocrProvider = getOCRProvider(provider as OCRProviderType);

    // Process image
    const result = await ocrProvider.recognize(image);

    return NextResponse.json({
      success: true,
      provider: ocrProvider.name,
      data: result,
    });
  } catch (error) {
    console.error('OCR error:', error);
    const message = error instanceof Error ? error.message : 'OCR processing failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
