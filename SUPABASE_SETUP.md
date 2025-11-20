# Supabase Setup Guide

This guide will help you set up Supabase for the Symptom Sprinter leaderboard and API proxy.

## 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Create a new project (or use an existing one)
3. Wait for the project to be fully provisioned

## 2. Set Up Database Schema

1. Go to **SQL Editor** in your Supabase dashboard
2. Copy and paste the contents of `supabase/schema.sql`
3. Click **Run** to execute the SQL

This will create:
- `leaderboard` table with indexes
- Row Level Security policies
- Automatic `updated_at` timestamp trigger

## 3. Get Supabase Credentials

1. Go to **Project Settings** → **API**
2. Copy the following:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon/public key** (starts with `eyJ...`)

## 4. Set Environment Variables

Create a `.env.local` file in the root directory:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

**Important:** These variables start with `VITE_` because Vite only exposes env variables with this prefix to the client.

## 5. Deploy Edge Function for Gemini API

**Option A: Use npx (Recommended - No global install needed)**

1. Login to Supabase:
   ```bash
   npm run supabase -- login
   ```

2. Link your project:
   ```bash
   npm run supabase -- link --project-ref your-project-ref
   ```
   (You can find your project ref in Project Settings → General)

3. Set your Gemini API key as a secret:
   ```bash
   npm run supabase -- secrets set GEMINI_API_KEY=your-gemini-api-key-here
   ```

4. Deploy the Edge Function:
   ```bash
   npm run supabase -- functions deploy generate-round
   ```

**Option B: Install globally (requires sudo on macOS)**
```bash
sudo npm install -g supabase
```

Then use commands without `npm run supabase --`:
```bash
supabase login
supabase link --project-ref your-project-ref
supabase secrets set GEMINI_API_KEY=your-gemini-api-key-here
supabase functions deploy generate-round
```

## 6. Test the Setup

1. Start your dev server:
   ```bash
   npm run dev
   ```

2. Play a game and check:
   - Game rounds generate correctly (via Edge Function)
   - Leaderboard shows up when you click the leaderboard icon
   - Your score appears in the leaderboard after a round ends

## Troubleshooting

### Leaderboard not loading?
- Check that `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set correctly
- Verify the database schema was created (check Tables in Supabase dashboard)
- Check browser console for errors

### Edge Function not working?
- Verify the function is deployed: `supabase functions list`
- Check function logs: `supabase functions logs generate-round`
- Ensure `GEMINI_API_KEY` secret is set: `supabase secrets list`

### Getting 401 Unauthorized errors?
- **Most common cause**: Your `.env.local` file is missing or has incorrect `VITE_SUPABASE_ANON_KEY`
  - Verify the key matches the "anon/public key" from Supabase Project Settings → API
  - Make sure the key starts with `eyJ` (it's a JWT token)
  - Restart your dev server after updating `.env.local`
- **Edge function needs redeployment**: After fixing the edge function code, redeploy it:
  ```bash
  npm run supabase -- functions deploy generate-round
  ```
- Check browser console for specific error messages

### API key still exposed?
- Make sure you're using the Edge Function (not direct API calls)
- The Edge Function keeps your API key server-side
- Never commit `.env.local` to git (it's in `.gitignore`)

## Security Notes

- The `anon` key is safe to expose client-side (it's public)
- RLS policies protect your database
- The Gemini API key is stored as a secret and never exposed to clients
- All sensitive operations happen server-side in the Edge Function

