# Distro
Distro BeatSweep is a news curation and automation SaaS tool that aggregates recent news, enables AI-powered summarization, and enables direct posting to external platforms such as Telegram and Distro Channels. The platform is designed for journalists, analysts, and content creators valuing full control, privacy, and configurability.

## Setting Up Telegram

Each user brings their own Telegram bot and channel. Here's how to get set up:

### 1. Create a Bot
1. Open Telegram and message **@BotFather**
2. Send `/newbot` and follow the prompts (choose a name and username for your bot)
3. BotFather will give you a **bot token** — copy it (looks like `123456789:ABCdef...`)

### 2. Create a Channel
1. In Telegram, create a new public or private channel
2. Note the channel username (e.g. `@mynewschannel`) or numeric ID (e.g. `-1001234567890`)

### 3. Add the Bot as Admin
1. Open your channel → **Manage Channel** → **Administrators** → **Add Administrator**
2. Search for your bot by its username and select it
3. Enable the **Post Messages** permission and confirm

### 4. Connect in the App
1. In Distro, click any **Send to Telegram** button
2. A setup modal will appear — enter your **Channel ID** and **Bot Token**
3. Click **Save & Continue**

Your credentials are saved locally in your browser and used automatically on every send. You can update them at any time by clicking the edit icon next to your channel ID.

## Environment Variables

For server-side deployment (Vercel), copy `.env` and fill in your keys:

| Variable | Description |
|---|---|
| `GOOGLE_API_KEY` | Google Gemini API key for AI summarization |
| `NEWS_API_KEY` | NewsAPI.org key for fetching articles |
| `TELEGRAM_BOT_TOKEN` | (Optional) Server-side fallback bot token |
| `TELEGRAM_CHAT_ID` | (Optional) Server-side fallback channel ID |

> **Note:** Bot token and channel ID entered in the app UI take priority over the server-side environment variables.
