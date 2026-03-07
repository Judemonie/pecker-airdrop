# 🐦 PECKER Airdrop Mini App

A complete Telegram Mini App for the PECKER BSC airdrop with tasks, leaderboard, and referral system.

---

## 🚀 DEPLOYMENT GUIDE (Phone Friendly)

### STEP 1: Setup Supabase Database

1. Go to **supabase.com** → your project
2. Click **SQL Editor** (left sidebar)
3. Click **New Query**
4. Open the file `supabase-setup.sql` and **copy ALL the text**
5. Paste it into the SQL editor
6. Click **Run** (green button)
7. You should see "Success" ✅

---

### STEP 2: Upload Code to GitHub

1. Go to **github.com** → click **+** → **New Repository**
2. Name it: `pecker-airdrop`
3. Make it **Public**
4. Click **Create repository**
5. Click **uploading an existing file**
6. Upload ALL files from this folder maintaining the folder structure
7. Click **Commit changes**

---

### STEP 3: Deploy to Vercel

1. Go to **vercel.com** → **Add New Project**
2. Click **Import** next to your `pecker-airdrop` repo
3. Before clicking Deploy, click **Environment Variables**
4. Add these one by one:

| Name | Value |
|------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Your Supabase service_role key |
| `NEXT_PUBLIC_BOT_USERNAME` | `PECKER_BSC_BOT` |
| `NEXT_PUBLIC_APP_URL` | (leave blank for now, add after deploy) |
| `BOT_TOKEN` | Your bot token from BotFather |

5. Click **Deploy** and wait ~2 minutes
6. Copy your app URL (e.g. `https://pecker-airdrop.vercel.app`)
7. Go back to Vercel → Settings → Environment Variables
8. Update `NEXT_PUBLIC_APP_URL` with your real URL
9. Click **Redeploy**

---

### STEP 4: Connect Telegram Bot

1. Open Telegram → search **@BotFather**
2. Send: `/mybots`
3. Select **@PECKER_BSC_BOT**
4. Click **Bot Settings** → **Menu Button** → **Configure menu button**
5. Enter your Vercel URL (e.g. `https://pecker-airdrop.vercel.app`)
6. Then go back → **Bot Settings** → **Configure Mini App**
7. Enable Mini App and paste your URL again

**Also set commands:**
Send to BotFather:
```
/setcommands
```
Select your bot, then paste:
```
start - Open PECKER Airdrop App
```

---

### STEP 5: Test It!

1. Open Telegram → search your bot `@PECKER_BSC_BOT`
2. Click **Start** or the Menu button
3. The mini app should open! 🎉

---

## 🔧 Keeping Supabase Active (Free Tier)

Supabase free tier pauses after 1 week of inactivity.
To prevent this, set up a free ping using **cron-job.org**:

1. Go to **cron-job.org** → Sign up free
2. Create new cronjob
3. URL: `https://your-vercel-url.vercel.app/api/ping`
4. Schedule: Every 3 days
5. Save ✅

---

## 📋 Adding Tasks (Admin)

To add new tasks:
1. Go to **supabase.com** → your project → **Table Editor**
2. Click the **tasks** table
3. Click **Insert row**
4. Fill in:
   - `title`: Task name
   - `description`: Short description
   - `task_type`: `telegram`, `twitter`, `website`, `daily`, or `custom`
   - `url`: Link to open (optional)
   - `icon`: Emoji icon
   - `points`: How many points to award
   - `is_active`: `true`
5. Save ✅

---

## 🏗️ Project Structure

```
pecker-airdrop/
├── src/
│   ├── components/
│   │   ├── Layout.js          # Bottom navigation
│   │   ├── HomeTab.js         # Dashboard / home screen
│   │   ├── TasksTab.js        # All tasks
│   │   ├── LeaderboardTab.js  # Rankings
│   │   └── ReferralTab.js     # Referral system
│   ├── lib/
│   │   ├── supabase.js        # Database client
│   │   └── telegram.js        # Telegram helpers
│   ├── pages/
│   │   ├── _app.js
│   │   ├── _document.js
│   │   ├── index.js           # Main app
│   │   └── api/
│   │       └── auth.js        # User auth endpoint
│   └── styles/
│       └── globals.css
├── supabase-setup.sql         # Run this in Supabase!
├── package.json
├── next.config.js
├── tailwind.config.js
└── .env.example               # Copy to .env.local for local dev
```
