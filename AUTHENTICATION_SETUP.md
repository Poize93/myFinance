# Authentication Setup Guide

This guide will help you set up user authentication for your Finance Manager application.

## Database Setup

### 1. Create Users Table in Supabase

Run the following SQL script in your Supabase SQL editor:

```sql
-- Create users table for authentication
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    loginId VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100),
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_loginId ON users(loginId);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Enable Row Level Security (RLS) for users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (adjust as needed for your security requirements)
CREATE POLICY "Allow all operations on users" ON users
    FOR ALL USING (true) WITH CHECK (true);
```

### 2. Environment Variables

Make sure your `.env` file contains:

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Features Added

### 🔐 Authentication System
- **Login Form**: Users can sign in with their Login ID and password
- **Registration Form**: New users can create accounts with Login ID, name, password, and optional email
- **Session Management**: Users stay logged in across browser sessions
- **Logout Functionality**: Secure logout with session cleanup

### 🛡️ Security Features
- **Password Hashing**: Passwords are hashed before storage (simple hash for demo - use bcrypt in production)
- **Protected Routes**: Main application is only accessible after authentication
- **User Validation**: Prevents duplicate login IDs
- **Input Validation**: Form validation for required fields and password strength

### 🎨 User Interface
- **Modern Login/Register Forms**: Beautiful Material-UI forms with tabs
- **Loading States**: Loading indicators during authentication
- **Error Handling**: User-friendly error messages
- **Responsive Design**: Works on all device sizes
- **App Header**: Shows user name and logout button

## How to Use

### For New Users:
1. Open the application
2. Click on the "Register" tab
3. Fill in your details:
   - Full Name (required)
   - Login ID (required, must be unique)
   - Email (optional)
   - Password (required, minimum 6 characters)
4. Click "Create Account"
5. You'll be automatically logged in

### For Existing Users:
1. Open the application
2. Enter your Login ID and password
3. Click "Sign In"
4. You'll be taken to the Finance Dashboard

### Logout:
- Click the logout icon in the top-right corner of the app header

## Technical Implementation

### Components Created:
- `AuthContext.tsx`: Authentication state management
- `LoginForm.tsx`: Login and registration forms
- `ProtectedRoute.tsx`: Route protection wrapper
- `AppHeader.tsx`: Application header with user info and logout

### Database Operations:
- `createUser()`: Register new users
- `authenticateUser()`: Validate login credentials
- `getUserById()`: Retrieve user information

### Security Notes:
- Passwords are hashed using a simple hash function (suitable for demo)
- For production, implement proper password hashing with bcrypt
- Consider implementing JWT tokens for better security
- Add rate limiting for login attempts
- Implement password reset functionality

## Testing the Authentication

1. **Build the application**: `npm run build`
2. **Start the development server**: `npm run dev`
3. **Test registration**: Create a new account
4. **Test login**: Log out and log back in
5. **Test session persistence**: Refresh the page - you should stay logged in

## Next Steps (Optional Enhancements)

1. **Password Reset**: Add forgot password functionality
2. **Email Verification**: Send verification emails for new accounts
3. **User Profiles**: Allow users to edit their profile information
4. **User-Specific Data**: Make expenses and investments user-specific
5. **Admin Panel**: Add admin functionality for user management
6. **Two-Factor Authentication**: Add 2FA for enhanced security

## Troubleshooting

### Common Issues:

1. **"Supabase is not configured"**: Check your environment variables
2. **"User already exists"**: Try a different Login ID
3. **"Invalid credentials"**: Check your Login ID and password
4. **Build errors**: Make sure all dependencies are installed with `npm install`

### Database Connection Issues:
- Verify your Supabase URL and API key
- Check that the users table exists in your database
- Ensure RLS policies are set up correctly





