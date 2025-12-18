import OpenAI from 'openai';
import { OCRProvider, OCRResult, EXTRACTION_PROMPT } from './types';

export class OpenAIOCRProvider implements OCRProvider {
  name = 'openai';
  private client: OpenAI;

  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async recognize(base64Image: string): Promise<OCRResult> {
    const response = await this.client.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: {
                url: base64Image,
                detail: 'high',
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

    const textContent = response.choices[0]?.message?.content;
    if (!textContent) {
      throw new Error('No response from OpenAI');
    }

    const jsonMatch = textContent.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not parse JSON from response');
    }

    return JSON.parse(jsonMatch[0]);
  }
}
