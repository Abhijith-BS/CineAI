# Fix Terminal Errors

## Problem
You're seeing these errors:
- `Unexpected error when authorizing - are you connected to the internet?`
- `getaddrinfo ENOTFOUND o1192621.ingest.sentry.io`
- `ERROR: "dev:backend" exited with 1`

## Solution

### Step 1: Login to Convex
Run this command in your terminal:
```bash
npx convex login
```

This will:
1. Open your browser
2. Ask you to log in to Convex
3. Authorize the CLI

### Step 2: Verify Connection
After logging in, verify it worked:
```bash
npx convex dashboard
```

This should open your Convex dashboard.

### Step 3: Run Dev Server Again
Now try running your app:
```bash
npm run dev
```

## About the Sentry Error
The `getaddrinfo ENOTFOUND o1192621.ingest.sentry.io` error is from Convex's telemetry trying to send error reports. This is **not critical** and won't prevent your app from working. It's just Convex trying to report errors to their monitoring service.

If you're behind a firewall or have network restrictions, this error may persist, but it won't affect functionality.

## If Login Doesn't Work

1. **Check Internet Connection**: Make sure you're connected to the internet
2. **Check Firewall**: Your firewall might be blocking Convex connections
3. **Try Manual Login**: Run `npx convex login --no-open` and manually paste the URL
4. **Check Convex Status**: Visit https://status.convex.dev to see if there are any outages

## Alternative: Run Frontend Only
If Convex backend keeps failing, you can run just the frontend:
```bash
npm run dev:frontend
```

But you'll need the backend for the AI chat and database features to work.

