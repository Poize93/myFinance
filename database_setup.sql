-- Create users table for authentication
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    loginid VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100),
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_loginid ON users(loginid);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Add user_id foreign key to existing tables (optional - for user-specific data)
-- Uncomment these if you want to make expenses and investments user-specific

-- ALTER TABLE expenses ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id);
-- ALTER TABLE investments ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id);
-- ALTER TABLE option_lists ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id);

-- Create indexes for user-specific data (if you enable user-specific tables)
-- CREATE INDEX IF NOT EXISTS idx_expenses_user_id ON expenses(user_id);
-- CREATE INDEX IF NOT EXISTS idx_investments_user_id ON investments(user_id);
-- CREATE INDEX IF NOT EXISTS idx_option_lists_user_id ON option_lists(user_id);

-- Enable Row Level Security (RLS) for users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (adjust as needed for your security requirements)
-- For now, we'll allow all operations - you may want to restrict this in production
CREATE POLICY "Allow all operations on users" ON users
    FOR ALL USING (true) WITH CHECK (true);
