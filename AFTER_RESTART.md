# After PC Restart - What You Need to Know

## ✅ **Everything Should Work Automatically!**

After restarting your PC, you should be able to run `npm run dev` and everything will work. Here's what persists:

### ✅ What Persists (No Action Needed):
1. **Convex Authentication** - Your login token is stored locally and persists across restarts
2. **API Keys** - All your API keys (GROQ_API_KEY, TMDB_API_KEY, SERPER_API_KEY) are stored in Convex's cloud, so they persist
3. **Project Code** - All your code files persist
4. **Deployment Connection** - Your connection to the `zealous-manatee-45` deployment persists

### ⚠️ If Something Doesn't Work:

#### If you see: "Unexpected error when authorizing"
**Solution:** Run this once:
```powershell
npx convex login
```

This usually only needs to be done once, but if your auth token expires or gets cleared, you might need to do it again.

#### If you see: "Cannot find module" errors
**Solution:** Run:
```powershell
npm install
```

This reinstalls dependencies (shouldn't be needed, but just in case).

## 🚀 **Normal Startup Process:**

After restart, just run:
```powershell
cd "C:\Users\Abhijith\Desktop\Intern project\newwwwwwwwwwwwwwwww\imdb_clone_with_ai_chat"
npm run dev
```

That's it! Everything should work.

## 📝 **Quick Checklist (if something breaks):**

1. ✅ Internet connection working?
2. ✅ Run `npx convex login` (if auth error)
3. ✅ Run `npm install` (if module errors)
4. ✅ Check `.env.local` exists (should have CONVEX_DEPLOYMENT)

## 💡 **Pro Tip:**

If you want to verify everything is set up correctly, you can run:
```powershell
npx convex dashboard
```

If this opens your dashboard, you're authenticated and ready to go!

