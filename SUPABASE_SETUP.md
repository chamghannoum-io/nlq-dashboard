# Supabase Integration Setup

This application now fetches conversation history from your Supabase database.

## Quick Setup

### 1. Get Your Supabase Anon Key

1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/rudnfxearvrrzasklclx
2. Click on **Settings** (gear icon in the sidebar)
3. Go to **API** section
4. Under "Project API keys", copy the **`anon` `public`** key

### 2. Configure the Application

Open the file: `src/config/supabase.config.js`

Replace `YOUR_SUPABASE_ANON_KEY_HERE` with your actual anon key:

```javascript
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'; // Your actual key
```

### 3. Run the Application

```bash
npm run dev
```

## Features

The application will now:

✅ Load all session history from Supabase automatically
✅ Refresh history every 10 seconds
✅ Display conversations in the sidebar sorted by most recent
✅ Show full conversation history when clicking on a session
✅ Display visualization data (embed_url) from chat_history table

## Database Structure

### Tables Used:

**session_memory** (Parent)
- `session_id` - Unique session identifier
- `turn_count` - Number of messages in the session
- `last_question` - Most recent question
- `last_answer` - Most recent answer
- `updated_at` - Last update timestamp

**chat_history** (Child)
- `session_id` - Links to session_memory
- `question` - User's question
- `answer` - AI's response
- `card_name` - Visualization title
- `embed_url` - Metabase embed URL
- `timestamp` - Message timestamp

## Troubleshooting

### "Failed to load history" Error

**Check:**
1. Your Supabase anon key is correctly set in `src/config/supabase.config.js`
2. Your Supabase project is active and running
3. The tables `session_memory` and `chat_history` exist
4. Row Level Security (RLS) policies allow read access for the `anon` role

### Enable Anonymous Read Access

If you're getting permission errors, you may need to enable RLS policies in Supabase:

```sql
-- Enable read access for session_memory
CREATE POLICY "Enable read access for all users" ON "public"."session_memory"
FOR SELECT USING (true);

-- Enable read access for chat_history
CREATE POLICY "Enable read access for all users" ON "public"."chat_history"
FOR SELECT USING (true);
```

### No History Showing

- Make sure you have data in both tables
- Check browser console (F12) for error messages
- Verify your database connection details are correct

## Alternative: Environment Variable

You can also use a `.env` file (create it in the project root):

```env
VITE_SUPABASE_ANON_KEY=your_actual_anon_key_here
```

Then in `src/config/supabase.config.js`:

```javascript
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'YOUR_FALLBACK_KEY';
```

## Connection Details (for reference)

- **Host:** aws-1-ap-southeast-1.pooler.supabase.com
- **Port:** 5432
- **Database:** postgres
- **Project Ref:** rudnfxearvrrzasklclx
- **URL:** https://rudnfxearvrrzasklclx.supabase.co

