export interface SampleData {
  well: string;
  company: string;
  depthFrom: number;
  depthTo: number;
  boxCode: string;
  timestamp?: Date;
}

export interface OCRResult {
  text: string;
  confidence: number;
}

export interface OCRProvider {
  recognize(image: File | string): Promise<OCRResult>;
}

export interface ParsedSampleData {
  well: string;
  company: string;
  depthFrom: number | null;
  depthTo: number | null;
  boxCode: string;
}
