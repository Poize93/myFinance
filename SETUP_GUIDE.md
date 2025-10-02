# Quick Setup Guide

## Current Issue
Your application is trying to connect to a Supabase project that doesn't exist or is not accessible. The error `net::ERR_NAME_NOT_RESOLVED` indicates the Supabase URL is invalid.

## Solution Options

### Option 1: Set Up Supabase (Recommended for Production)

1. **Create a Supabase Project**
   - Go to [supabase.com](https://supabase.com)
   - Sign up/login and create a new project
   - Wait for the project to be set up

2. **Get Your Credentials**
   - Go to your project dashboard
   - Navigate to Settings > API
   - Copy your Project URL and anon/public key

3. **Create Environment File**
   - Create a `.env` file in your project root
   - Add the following content:
   ```
   VITE_SUPABASE_URL=your_actual_supabase_url_here
   VITE_SUPABASE_ANON_KEY=your_actual_anon_key_here
   ```

4. **Set Up Database**
   - Go to your Supabase project dashboard
   - Navigate to SQL Editor
   - Run the SQL scripts from `database_setup.sql`

5. **Restart Development Server**
   ```bash
   npm run dev
   ```

### Option 2: Run in Offline Mode (Development Only)

The application will work without Supabase, but data won't be saved permanently. You'll see a warning banner with setup instructions.

## Files to Check

- `database_setup.sql` - Contains the SQL scripts for your database tables
- `SUPABASE_SETUP.md` - Detailed setup instructions
- `.env` - Your environment variables (create this file)

## Need Help?

1. Check the console for specific error messages
2. Verify your Supabase project is active and accessible
3. Ensure your `.env` file is in the project root
4. Make sure to restart your development server after adding environment variables

