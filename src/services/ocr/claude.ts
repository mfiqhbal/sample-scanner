import Anthropic from '@anthropic-ai/sdk';
import { OCRProvider, OCRResult, EXTRACTION_PROMPT } from './types';

export class ClaudeOCRProvider implements OCRProvider {
  name = 'claude';
  private client: Anthropic;

  constructor() {
    this.client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }

  async recognize(base64Image: string): Promise<OCRResult> {
    const matches = base64Image.match(/^data:(.+);base64,(.+)$/);
    if (!matches) {
      throw new Error('Invalid image format');
    }

    const mediaType = matches[1] as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp';
    const base64Data = matches[2];

    const response = await this.client.messages.create({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mediaType,
                data: base64Data,
              },
            },
            {
              type: 'text',
              text: EXTRACTION_PROMPT,
            },
          ],
        },
      ],
    });

    const textContent = response.content.find((c) => c.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text response from Claude');
    }

    const jsonMatch = textContent.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not parse JSON from response');
    }

    return JSON.parse(jsonMatch[0]);
  }
}
