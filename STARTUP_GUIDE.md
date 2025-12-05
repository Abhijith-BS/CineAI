# Startup Guide

## ✅ **After PC Restart - Quick Start**

### Normal Startup (Should Work Automatically):
```powershell
npm run dev
```

That's it! Everything should work.

---

## ⚠️ **If You See Errors:**

### Error: "Unexpected error when authorizing"

**Fix:** Run this command (use `npx`, NOT `npm`):
```powershell
npx convex login
```

**⚠️ IMPORTANT:** 
- ✅ Correct: `npx convex login`
- ❌ Wrong: `npm convex login` (this won't work!)

After running `npx convex login`, try `npm run dev` again.

---

## 📋 **Complete Troubleshooting Steps:**

1. **Check Internet Connection** - Make sure you're online

2. **Login to Convex** (if auth error):
   ```powershell
   npx convex login
   ```
   This opens your browser to authenticate.

3. **Verify Login Worked**:
   ```powershell
   npx convex dashboard
   ```
   If this opens your dashboard, you're good!

4. **Run Your App**:
   ```powershell
   npm run dev
   ```

---

## 🔍 **About the Sentry Error:**

If you see: `getaddrinfo ENOTFOUND o1192621.ingest.sentry.io`

**This is NOT critical!** It's just Convex's error reporting service. Your app will still work fine. You can ignore this error.

---

## 💡 **Remember:**

- Use `npx convex login` (with `npx`)
- NOT `npm convex login` (this doesn't exist)
- After login, `npm run dev` should work
- The Sentry error is harmless - ignore it

