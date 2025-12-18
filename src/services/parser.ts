import { ParsedSampleData } from '@/types';

/**
 * Parse well name from OCR text
 * Handles: "Well: ABC-123", "Well : ABC-123", "Well ABC-123"
 */
export function parseWell(text: string): string {
  const patterns = [
    /Well[:\s]+([^\n\r]+)/i,
    /Well\s*Name[:\s]+([^\n\r]+)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }

  return '';
}

/**
 * Parse company name from OCR text
 * Handles: "Company: XYZ Corp", "Company : XYZ Corp"
 */
export function parseCompany(text: string): string {
  const patterns = [
    /Company[:\s]+([^\n\r]+)/i,
    /Operator[:\s]+([^\n\r]+)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }

  return '';
}

/**
 * Remove commas from number string and parse to number
 * Handles: "2,480" -> 2480, "2480" -> 2480
 */
function parseNumber(str: string): number | null {
  const cleaned = str.replace(/,/g, '').trim();
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

/**
 * Parse depth range from OCR text
 * Handles various formats:
 * - "Depth: 2480 - 2490"
 * - "Depth: 2480-2490" (no spaces)
 * - "Depth: 2,480 - 2,490" (with commas)
 * - "Depth: 2480 to 2490"
 * - "From: 2480 To: 2490"
 */
export function parseDepth(text: string): { from: number | null; to: number | null } {
  // Pattern 1: "Depth: X - Y" or "Depth: X-Y" with optional commas
  const depthRangePattern = /Depth[:\s]+([\d,]+(?:\.\d+)?)\s*[-–—to]+\s*([\d,]+(?:\.\d+)?)/i;
  const match1 = text.match(depthRangePattern);
  if (match1) {
    return {
      from: parseNumber(match1[1]),
      to: parseNumber(match1[2]),
    };
  }

  // Pattern 2: "From: X" and "To: Y" on separate lines or same line
  const fromPattern = /From[:\s]+([\d,]+(?:\.\d+)?)/i;
  const toPattern = /To[:\s]+([\d,]+(?:\.\d+)?)/i;
  const fromMatch = text.match(fromPattern);
  const toMatch = text.match(toPattern);
  if (fromMatch || toMatch) {
    return {
      from: fromMatch ? parseNumber(fromMatch[1]) : null,
      to: toMatch ? parseNumber(toMatch[1]) : null,
    };
  }

  // Pattern 3: Look for two consecutive numbers that might be depth range
  // This is a fallback for poorly formatted text
  const numbersPattern = /([\d,]+(?:\.\d+)?)\s*[-–—]\s*([\d,]+(?:\.\d+)?)/g;
  let match: RegExpExecArray | null;

  // Find the match that looks most like a depth range (typically 3-5 digit numbers)
  while ((match = numbersPattern.exec(text)) !== null) {
    const num1 = parseNumber(match[1]);
    const num2 = parseNumber(match[2]);
    if (num1 !== null && num2 !== null) {
      // Depth values are typically between 100 and 50000
      if (num1 >= 100 && num1 <= 50000 && num2 >= 100 && num2 <= 50000) {
        return { from: num1, to: num2 };
      }
    }
  }

  return { from: null, to: null };
}

/**
 * Parse box code from OCR text
 * Handles format: XXX.XX.XXX (e.g., 001.02.003, 040.BB.020)
 * Supports alphanumeric codes (digits and letters)
 */
export function parseBoxCode(text: string): string {
  const patterns = [
    // Alphanumeric format: XXX.XX.XXX (e.g., 040.BB.020)
    /\b(\d{3}\.[A-Z]{2}\.\d{3})\b/i,
    // Pure numeric format: XXX.XX.XXX (e.g., 001.02.003)
    /\b(\d{3}\.\d{2}\.\d{3})\b/,
    // Mixed alphanumeric: any 3.2.3 pattern
    /\b([A-Z0-9]{3}\.[A-Z0-9]{2}\.[A-Z0-9]{3})\b/i,
    // Box Code prefix
    /Box\s*Code[:\s]+([^\n\r]+)/i,
    // Looser format with spaces instead of dots (OCR error)
    /\b(\d{3}\s+[A-Z]{2}\s+\d{3})\b/i,
    /\b(\d{3}\s+\d{2}\s+\d{3})\b/,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      // Normalize: replace spaces with dots, uppercase
      return match[1].trim().replace(/\s+/g, '.').toUpperCase();
    }
  }

  return '';
}

/**
 * Main function to parse all sample label data from OCR text
 */
export function parseSampleLabel(text: string): ParsedSampleData {
  const depth = parseDepth(text);

  return {
    well: parseWell(text),
    company: parseCompany(text),
    depthFrom: depth.from,
    depthTo: depth.to,
    boxCode: parseBoxCode(text),
  };
}

/**
 * Validate parsed data
 * Returns array of missing/invalid fields
 */
export function validateParsedData(data: ParsedSampleData): string[] {
  const errors: string[] = [];

  if (!data.well) {
    errors.push('Well name is missing');
  }
  if (!data.company) {
    errors.push('Company name is missing');
  }
  if (data.depthFrom === null) {
    errors.push('Depth From is missing');
  }
  if (data.depthTo === null) {
    errors.push('Depth To is missing');
  }
  if (data.depthFrom !== null && data.depthTo !== null && data.depthFrom > data.depthTo) {
    errors.push('Depth From should be less than Depth To');
  }
  if (!data.boxCode) {
    errors.push('Box Code is missing');
  }

  return errors;
}
