# OAuth Setup Guide

The GitHub and Google login buttons are currently **hidden** because OAuth isn't configured. Follow these steps to enable them:

## Option 1: Keep Social Login Disabled (Current Setup)

The app works perfectly with email/password authentication only. No action needed!

## Option 2: Enable GitHub OAuth

### 1. Create a GitHub OAuth App

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click "New OAuth App"
3. Fill in:
   - **Application name**: Assessment Agent App
   - **Homepage URL**: `http://localhost:3000` (or your production URL)
   - **Authorization callback URL**: `http://localhost:3000/api/auth/callback/github`
4. Click "Register application"
5. Copy the **Client ID**
6. Click "Generate a new client secret" and copy it

### 2. Add to .env.local

```bash
GITHUB_CLIENT_ID=your_client_id_here
GITHUB_CLIENT_SECRET=your_client_secret_here
NEXT_PUBLIC_GITHUB_ENABLED=true
```

### 3. For Production (Vercel)

Add the same variables in your Vercel project settings → Environment Variables

Update the callback URL in GitHub OAuth app to:
```
https://your-app.vercel.app/api/auth/callback/github
```

## Option 3: Enable Google OAuth

### 1. Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Navigate to "APIs & Services" → "Credentials"
4. Click "Create Credentials" → "OAuth client ID"
5. Configure OAuth consent screen if prompted
6. Select "Web application"
7. Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
8. Copy **Client ID** and **Client Secret**

### 2. Add to .env.local

```bash
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here
NEXT_PUBLIC_GOOGLE_ENABLED=true
```

### 3. For Production (Vercel)

Add the same variables and update Google OAuth redirect URI to:
```
https://your-app.vercel.app/api/auth/callback/google
```

## Testing

After adding the environment variables:

1. Restart your dev server: `npm run dev`
2. Go to `/auth/signin`
3. You should now see the GitHub/Google login buttons
4. Click to test the OAuth flow

## Current Login Methods

✅ **Email/Password** - Fully working
✅ **Add User (Admin)** - Super admins can create users directly
❌ **GitHub OAuth** - Not configured (hidden)
❌ **Google OAuth** - Not configured (hidden)

---

**Note**: If you don't need social login, you can safely ignore this file. Email/password authentication works perfectly!
