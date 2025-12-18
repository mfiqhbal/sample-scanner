import { NextRequest, NextResponse } from 'next/server';
import { getOCRProvider } from '@/services/ocr';
import { appendToSheet } from '@/services/sheets';
import { SampleData } from '@/types';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const ACCESS_CODE = process.env.TELEGRAM_ACCESS_CODE;

// Store authorized chat IDs (resets on cold start - users just re-unlock)
const authorizedChats = new Set<number>();

interface TelegramUpdate {
  message?: {
    chat: { id: number };
    from?: { first_name?: string };
    photo?: Array<{ file_id: string; file_size?: number }>;
    text?: string;
  };
}

async function sendTelegramMessage(chatId: number, text: string) {
  await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
    }),
  });
}

async function getFileUrl(fileId: string): Promise<string> {
  const response = await fetch(
    `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getFile?file_id=${fileId}`
  );
  const data = await response.json();

  if (!data.ok || !data.result?.file_path) {
    throw new Error('Failed to get file path');
  }

  return `https://api.telegram.org/file/bot${TELEGRAM_BOT_TOKEN}/${data.result.file_path}`;
}

async function downloadImageAsBase64(url: string): Promise<string> {
  const response = await fetch(url);
  const arrayBuffer = await response.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString('base64');

  // Telegram may return non-standard content-types, normalize to accepted types
  const contentType = response.headers.get('content-type') || '';
  const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  const mediaType = validTypes.includes(contentType) ? contentType : 'image/jpeg';

  return `data:${mediaType};base64,${base64}`;
}

export async function POST(request: NextRequest) {
  try {
    if (!TELEGRAM_BOT_TOKEN) {
      console.error('TELEGRAM_BOT_TOKEN not configured');
      return NextResponse.json({ ok: true });
    }

    const update: TelegramUpdate = await request.json();
    const message = update.message;

    if (!message) {
      return NextResponse.json({ ok: true });
    }

    const chatId = message.chat.id;
    const userName = message.from?.first_name || 'User';

    // Handle /start command
    if (message.text === '/start') {
      const isUnlocked = !ACCESS_CODE || authorizedChats.has(chatId);
      const unlockMsg = ACCESS_CODE && !isUnlocked
        ? `\n\n🔒 <b>This bot is protected.</b>\nSend <code>/unlock YOUR_CODE</code> to access.`
        : '';

      await sendTelegramMessage(
        chatId,
        `Hi ${userName}! 👋\n\nSend me a photo of a sample label and I'll extract the data and save it to Google Sheets.\n\n<b>Label format:</b>\n• Well: [name]\n• Company: [name]\n• Depth: [from] - [to]\n• Box Code: [XXX.XX.XXX]${unlockMsg}`
      );
      return NextResponse.json({ ok: true });
    }

    // Handle /unlock command
    if (message.text?.startsWith('/unlock ')) {
      if (!ACCESS_CODE) {
        await sendTelegramMessage(chatId, '🔓 No access code required. You can use the bot freely!');
        return NextResponse.json({ ok: true });
      }

      const code = message.text.replace('/unlock ', '').trim();
      if (code === ACCESS_CODE) {
        authorizedChats.add(chatId);
        await sendTelegramMessage(chatId, '✅ <b>Access granted!</b>\n\nYou can now send photos to scan.');
      } else {
        await sendTelegramMessage(chatId, '❌ Invalid code. Please try again.');
      }
      return NextResponse.json({ ok: true });
    }

    // Check authorization for protected features
    if (ACCESS_CODE && !authorizedChats.has(chatId)) {
      await sendTelegramMessage(
        chatId,
        '🔒 <b>Access required</b>\n\nSend <code>/unlock YOUR_CODE</code> to use this bot.'
      );
      return NextResponse.json({ ok: true });
    }

    // Handle photo
    if (message.photo && message.photo.length > 0) {
      await sendTelegramMessage(chatId, '⏳ Processing image...');

      // Get largest photo (last in array)
      const photo = message.photo[message.photo.length - 1];

      // Download image
      const fileUrl = await getFileUrl(photo.file_id);
      const base64Image = await downloadImageAsBase64(fileUrl);

      // OCR
      const ocrProvider = getOCRProvider();
      const result = await ocrProvider.recognize(base64Image);

      // Validate required fields
      if (!result.well || result.depthFrom === null || result.depthTo === null) {
        await sendTelegramMessage(
          chatId,
          `⚠️ <b>Incomplete data extracted:</b>\n\n` +
          `• Well: ${result.well || '❌ Not found'}\n` +
          `• Company: ${result.company || '-'}\n` +
          `• Depth: ${result.depthFrom ?? '❌'} - ${result.depthTo ?? '❌'}\n` +
          `• Box Code: ${result.boxCode || '-'}\n\n` +
          `Please try again with a clearer photo.`
        );
        return NextResponse.json({ ok: true });
      }

      // Save to Google Sheets
      const data: SampleData = {
        well: result.well,
        company: result.company || '',
        depthFrom: result.depthFrom,
        depthTo: result.depthTo,
        boxCode: result.boxCode || '',
      };

      await appendToSheet(data);

      // Send success message
      await sendTelegramMessage(
        chatId,
        `✅ <b>Saved to Google Sheets!</b>\n\n` +
        `• Well: ${data.well}\n` +
        `• Company: ${data.company || '-'}\n` +
        `• Depth: ${data.depthFrom} - ${data.depthTo}\n` +
        `• Box Code: ${data.boxCode || '-'}`
      );

      return NextResponse.json({ ok: true });
    }

    // Handle other messages
    if (message.text) {
      await sendTelegramMessage(
        chatId,
        '📷 Please send me a photo of a sample label to extract data.'
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Telegram webhook error:', error);
    return NextResponse.json({ ok: true });
  }
}

// GET endpoint for webhook verification
export async function GET() {
  return NextResponse.json({ status: 'Telegram webhook is active' });
}
