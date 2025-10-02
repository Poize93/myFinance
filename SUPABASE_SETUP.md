# Supabase Setup Guide

## 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up/login
2. Create a new project
3. Wait for the project to be set up

## 2. Get Your Project Credentials

1. Go to your project dashboard
2. Navigate to Settings > API
3. Copy your Project URL and anon/public key

## 3. Set Up Environment Variables

Create a `.env` file in your project root with:

```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Replace the values with your actual Supabase project credentials.

## 4. Create Database Tables

Run the following SQL in your Supabase SQL Editor:

### Expenses Table
```sql
CREATE TABLE expenses (
  id BIGSERIAL PRIMARY KEY,
  date DATE NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  remark TEXT NOT NULL,
  bank_type TEXT NOT NULL,
  card_type TEXT NOT NULL,
  expense_type TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (you can customize this later)
CREATE POLICY "Allow all operations" ON expenses FOR ALL USING (true);
```

### Option Lists Table
```sql
CREATE TABLE option_lists (
  key TEXT PRIMARY KEY,
  items TEXT[] NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE option_lists ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations
CREATE POLICY "Allow all operations" ON option_lists FOR ALL USING (true);
```

### Updated At Trigger Function
```sql
-- Function to automatically update the updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for both tables
CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON expenses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_option_lists_updated_at BEFORE UPDATE ON option_lists
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

## 5. Update Your Application

The application has been updated to use Supabase instead of IndexedDB. The main changes are:

- `src/supabase.ts` - Supabase client configuration
- `src/supabaseDb.ts` - Database operations using Supabase
- Updated `src/App.tsx` to use the new Supabase database

## 6. Test Your Setup

1. Start your development server: `npm run dev`
2. Try adding an expense
3. Check your Supabase dashboard to see the data being stored

## Security Notes

- The current setup allows all operations for simplicity
- For production, you should implement proper Row Level Security (RLS) policies
- Consider adding user authentication if needed
- The anon key is safe to use in the frontend as it's restricted by RLS policies
