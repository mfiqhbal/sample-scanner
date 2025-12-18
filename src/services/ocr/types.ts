export interface OCRResult {
  well: string;
  company: string;
  depthFrom: number | null;
  depthTo: number | null;
  boxCode: string;
}

export interface OCRProvider {
  name: string;
  recognize(base64Image: string): Promise<OCRResult>;
}

export const EXTRACTION_PROMPT = `You are an OCR assistant specialized in reading geological sample labels.

Extract the following information from this label image:
- Well name (after "Well:")
- Company name (after "Company:")
- Depth range (after "Depth:" - extract the two numbers)
- Box code (format like XXX.XX.XXX, e.g., 040.BB.020)

Return ONLY a JSON object in this exact format, no other text:
{
  "well": "extracted well name or empty string",
  "company": "extracted company name or empty string",
  "depthFrom": number or null,
  "depthTo": number or null,
  "boxCode": "extracted box code or empty string"
}

If you cannot read a field clearly, use empty string or null as appropriate.
Be careful with handwritten text - read it as accurately as possible.`;
