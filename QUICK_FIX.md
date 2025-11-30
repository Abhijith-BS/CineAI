# Quick Fix for Terminal Errors

## The Problem
You're seeing: `Unexpected error when authorizing - are you connected to the internet?`

## The Solution (Run These Commands)

### Step 1: Open a NEW PowerShell/Command Prompt window
(Don't use the one where npm run dev is running)

### Step 2: Navigate to your project
```powershell
cd "C:\Users\Abhijith\Desktop\Intern project\newwwwwwwwwwwwwwwww\imdb_clone_with_ai_chat"
```

### Step 3: Login to Convex
```powershell
npx convex login
```

This will:
- Open your browser automatically
- Ask you to log in to Convex
- Complete the authentication

### Step 4: Verify it worked
```powershell
npx convex dashboard
```

If this opens your dashboard, you're good!

### Step 5: Go back to your original terminal and run
```powershell
npm run dev
```

## Why This Happens
Convex needs to authenticate your computer with their servers. The `convex dev` command tries to do this automatically, but sometimes it needs manual login first.

## If Login Still Fails
1. Make sure you have internet connection
2. Check if your firewall is blocking Convex
3. Try: `npx convex login --no-open` and manually copy the URL it shows

## Note About Sentry Error
The `getaddrinfo ENOTFOUND o1192621.ingest.sentry.io` error is just Convex's error reporting service. It's **not critical** and won't break your app. You can ignore it.

