# Sample Scanner

A simple web app to scan geological sample labels and automatically save the extracted data to Google Sheets. Supports multiple OCR providers and Telegram bot integration.

## Features

- Camera capture (mobile-friendly, uses rear camera)
- Image upload with drag-and-drop
- AI-powered OCR (Google Gemini, OpenAI GPT-4o-mini, or Claude Haiku)
- Provider comparison tool to test accuracy across all providers
- Smart parsing for Well, Company, Depth range, and Box Code
- Editable form for verification before saving
- Auto-save to Google Sheets
- Telegram Bot - send photo directly to save data

## Tech Stack

- Next.js 14 (App Router)
- Tailwind CSS
- Claude Vision API / OpenAI Vision API
- Google Sheets API
- Telegram Bot API
- react-hot-toast

## Prerequisites

- Node.js 18 or higher
- API Key (Anthropic or OpenAI)
- Google Cloud account
- Google Sheet (for storing data)
- Telegram Bot (optional)

## Setup

### 1. Clone and Install

```bash
cd sample-scanner
npm install
```

### 2. OCR Provider Setup

Choose one or more OCR providers:

#### Option A: Google Gemini (Recommended - Cheapest)
1. Go to https://aistudio.google.com/apikey
2. Sign in with your Google account
3. Click **Create API Key**
4. Copy the key

#### Option B: OpenAI
1. Go to https://platform.openai.com/api-keys
2. Create an account and add billing
3. Click **Create new secret key**
4. Copy the key

#### Option C: Claude (Anthropic)
1. Go to https://console.anthropic.com/
2. Create an account and add billing
3. Go to **API Keys** → **Create Key**
4. Copy the key

### 3. Google Cloud Console Setup

1. **Go to Google Cloud Console**
   - Visit https://console.cloud.google.com

2. **Create or Select a Project**
   - Click the project dropdown at the top
   - Create a new project or select an existing one

3. **Enable Google Sheets API**
   - Go to **APIs & Services** → **Library**
   - Search for "Google Sheets API"
   - Click **Enable**

4. **Create Service Account**
   - Go to **APIs & Services** → **Credentials**
   - Click **Create Credentials** → **Service Account**
   - Name: `sample-scanner-service`
   - Click **Create and Continue**
   - Skip role (just click **Continue**)
   - Click **Done**

5. **Generate JSON Key**
   - Click on the newly created service account
   - Go to **Keys** tab
   - Click **Add Key** → **Create new key**
   - Select **JSON** format
   - Click **Create** (file downloads automatically)

6. **From the JSON file, copy:**
   - `client_email` → use for `GOOGLE_SERVICE_ACCOUNT_EMAIL`
   - `private_key` → use for `GOOGLE_PRIVATE_KEY`

### 4. Create Google Sheet

1. Go to https://sheets.google.com
2. Create a new spreadsheet
3. Add headers in Row 1:
   ```
   Timestamp | Well | Company | Depth From | Depth To | Box Code
   ```
4. Copy the Sheet ID from the URL:
   ```
   https://docs.google.com/spreadsheets/d/{SHEET_ID}/edit
   ```

5. **Share the sheet with service account**
   - Click **Share** button
   - Paste the service account email (e.g., `sample-scanner@your-project.iam.gserviceaccount.com`)
   - Grant **Editor** access
   - Uncheck "Notify people"
   - Click **Share**

### 5. Configure Environment Variables

1. Copy the example file:
   ```bash
   cp .env.local.example .env.local
   ```

2. Edit `.env.local`:
   ```env
   # OCR Provider: "gemini", "openai", or "claude"
   OCR_PROVIDER=gemini

   # Google Gemini API (recommended - cheapest)
   GEMINI_API_KEY=your-gemini-api-key

   # OpenAI API (if using openai)
   OPENAI_API_KEY=sk-xxxxx

   # Claude API (if using claude)
   ANTHROPIC_API_KEY=sk-ant-api03-xxxxx

   # Google Sheets
   GOOGLE_SHEETS_ID=your_sheet_id
   GOOGLE_SERVICE_ACCOUNT_EMAIL=xxx@xxx.iam.gserviceaccount.com
   GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

   # Telegram Bot (optional)
   TELEGRAM_BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrsTUVwxyz
   ```

### 6. Run Locally

```bash
npm run dev
```

Open http://localhost:3000 in your browser.

---

## Telegram Bot Setup

Send photos directly to Telegram bot → Auto OCR → Save to Google Sheets!

### Step 1: Create Bot with BotFather

1. Open Telegram app
2. Search for **@BotFather** (official Telegram bot)
3. Send `/start` to BotFather
4. Send `/newbot`
5. Enter a **name** for your bot (e.g., `Sample Scanner Bot`)
6. Enter a **username** for your bot (must end with `bot`, e.g., `sample_scanner_bot`)
7. BotFather will give you a **token** like:
   ```
   1234567890:ABCdefGHIjklMNOpqrsTUVwxyz
   ```
8. Copy this token!

### Step 2: Add Token to Environment

Add to your `.env.local`:
```env
TELEGRAM_BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrsTUVwxyz
```

### Step 3: Deploy Your App

Telegram webhook needs a public HTTPS URL. Deploy to Vercel (or similar):

1. Push code to GitHub
2. Import to Vercel
3. Add all environment variables
4. Deploy and get your URL (e.g., `https://your-app.vercel.app`)

### Step 4: Set Webhook

Open this URL in your browser (replace with your values):

```
https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook?url=https://your-app.vercel.app/api/telegram
```

Example:
```
https://api.telegram.org/bot1234567890:ABCdefGHIjklMNOpqrsTUVwxyz/setWebhook?url=https://sample-scanner.vercel.app/api/telegram
```

You should see:
```json
{"ok":true,"result":true,"description":"Webhook was set"}
```

### Step 5: Test Your Bot

1. Open Telegram
2. Search for your bot by username
3. Send `/start`
4. Send a photo of a sample label
5. Bot will process and save to Google Sheets!

### Telegram Bot Commands

- `/start` - Show welcome message and instructions

---

## Deployment (Vercel)

1. Push your code to GitHub

2. Import project in Vercel:
   - Go to https://vercel.com/new
   - Import your GitHub repository

3. Add Environment Variables:
   - `OCR_PROVIDER`
   - `GEMINI_API_KEY` (if using Gemini)
   - `OPENAI_API_KEY` (if using OpenAI)
   - `ANTHROPIC_API_KEY` (if using Claude)
   - `GOOGLE_SHEETS_ID`
   - `GOOGLE_SERVICE_ACCOUNT_EMAIL`
   - `GOOGLE_PRIVATE_KEY`
   - `TELEGRAM_BOT_TOKEN` (optional)

4. Deploy

5. Set Telegram webhook (if using bot)

---

## OCR Cost Comparison

For 10,000 images/week (~40,000/month):

| Provider | Model | Weekly (USD) | Monthly (USD) |
|----------|-------|--------------|---------------|
| **Google Gemini** | gemini-2.0-flash | ~$0.50 | **~$2** |
| OpenAI | gpt-4o-mini | ~$3.50 | ~$15 |
| Claude | haiku-3.5 | ~$10.50 | ~$45 |

**Gemini is 22x cheaper than Claude with excellent accuracy for handwritten text.**

### Compare Providers

Visit `/compare` in the app to test all providers on the same image and compare:
- Accuracy of extracted data
- Response time
- Cost per image

### Switch Provider

Change `OCR_PROVIDER` in `.env.local`:
```env
OCR_PROVIDER=gemini   # or "openai" or "claude"
```

---

## Label Format

The app recognizes labels with this format:

```
Well: ABC-123
Company: XYZ Corp
Depth: 2480 - 2490
Box Code: 040.BB.020
```

### Supported Variations

- **Depth formats:**
  - `2480 - 2490`
  - `2480-2490` (no spaces)
  - `2,480 - 2,490` (with commas)

- **Box Code:**
  - `XXX.XX.XXX` pattern
  - Alphanumeric supported (e.g., `040.BB.020`)

---

## Troubleshooting

### "ANTHROPIC_API_KEY is not configured"
- Check `.env.local` has the correct API key
- Restart dev server after changing env vars

### "Unable to access camera"
- Make sure you're using HTTPS
- Check browser permissions for camera access

### Telegram bot not responding
- Verify webhook is set correctly
- Check bot token is correct
- Ensure app is deployed and accessible

### Data not saving to sheet
- Verify sheet is shared with service account email
- Check that sheet has correct column headers
- Ensure Sheet ID is correct

---

## License

MIT
