import { GoogleGenerativeAI } from '@google/generative-ai';
import { OCRProvider, OCRResult, EXTRACTION_PROMPT } from './types';

export class GeminiOCRProvider implements OCRProvider {
  name = 'gemini';
  model = 'gemini-2.0-flash';
  private client: GoogleGenerativeAI;

  constructor() {
    this.client = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
  }

  async recognize(base64Image: string): Promise<OCRResult> {
    const model = this.client.getGenerativeModel({ model: 'gemini-2.0-flash' });

    // Extract media type and base64 data from data URI
    const matches = base64Image.match(/^data:(.+);base64,(.+)$/);
    if (!matches) {
      throw new Error('Invalid image format');
    }

    const mimeType = matches[1];
    const base64Data = matches[2];

    const result = await model.generateContent([
      {
        inlineData: {
          mimeType,
          data: base64Data,
        },
      },
      { text: EXTRACTION_PROMPT },
    ]);

    const response = result.response;
    const textContent = response.text();

    if (!textContent) {
      throw new Error('No response from Gemini');
    }

    const jsonMatch = textContent.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not parse JSON from response');
    }

    return JSON.parse(jsonMatch[0]);
  }
}
