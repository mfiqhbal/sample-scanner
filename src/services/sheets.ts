import { google } from 'googleapis';
import { SampleData } from '@/types';

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

/**
 * Get authenticated Google Sheets client
 */
async function getAuthClient() {
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !privateKey) {
    throw new Error('Missing Google service account credentials');
  }

  const auth = new google.auth.JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: privateKey,
    scopes: SCOPES,
  });

  return auth;
}

/**
 * Append sample data to Google Sheets
 */
export async function appendToSheet(data: SampleData): Promise<void> {
  const sheetId = process.env.GOOGLE_SHEETS_ID;

  if (!sheetId) {
    throw new Error('GOOGLE_SHEETS_ID is not configured');
  }

  const auth = await getAuthClient();
  const sheets = google.sheets({ version: 'v4', auth });

  // Format timestamp
  const timestamp = new Date().toLocaleString('en-MY', {
    timeZone: 'Asia/Kuala_Lumpur',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  // Row data: Timestamp | Well | Company | Depth From | Depth To | Box Code
  const row = [
    timestamp,
    data.well,
    data.company,
    data.depthFrom,
    data.depthTo,
    data.boxCode,
  ];

  await sheets.spreadsheets.values.append({
    spreadsheetId: sheetId,
    range: 'Sheet1!A:F', // Assumes first sheet with columns A-F
    valueInputOption: 'USER_ENTERED',
    insertDataOption: 'INSERT_ROWS',
    requestBody: {
      values: [row],
    },
  });
}

/**
 * Verify connection to Google Sheets
 */
export async function verifyConnection(): Promise<boolean> {
  try {
    const sheetId = process.env.GOOGLE_SHEETS_ID;
    if (!sheetId) return false;

    const auth = await getAuthClient();
    const sheets = google.sheets({ version: 'v4', auth });

    await sheets.spreadsheets.get({
      spreadsheetId: sheetId,
    });

    return true;
  } catch (error) {
    console.error('Sheets connection error:', error);
    return false;
  }
}
