<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1kXbfVHAK7ojcZ96-Kq_uGTWkCcnwMz_m

## Run Locally

**Prerequisites:**  Node.js and a Supabase account

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up Supabase:
   - Follow the [Supabase Setup Guide](./SUPABASE_SETUP.md)
   - This includes setting up the database, environment variables, and deploying the Gemini API proxy function

3. Run the app:
   ```bash
   npm run dev
   ```

**Note:** The Gemini API key is now secured in a Supabase Edge Function. See [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) for details.
