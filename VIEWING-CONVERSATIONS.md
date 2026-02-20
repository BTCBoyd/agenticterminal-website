# How to View Maxi Conversations

**Problem:** Netlify Functions are serverless (can't write regular files). Conversations are logged to Netlify's function logs.

---

## EASIEST METHOD: Netlify Dashboard

**Steps:**
1. Go to https://app.netlify.com
2. Select site: **maximoon**
3. Click **"Functions"** in left sidebar
4. Click on **"chat"** function
5. Click **"Function log"** tab
6. Look for entries that start with: **"=== CONVERSATION LOG ==="**

Each conversation shows:
- **userQuestion:** What the user asked
- **maxiResponse:** Maxi's answer (first 500 characters)
- **conversationTurn:** Message number in that session
- **language:** Detected language (en/es/pt)
- **leadIntent:** Whether user seems interested in ArcadiaB

**You can:**
- Click "Download logs" to save as text file
- Filter by date/time
- Search for specific words

---

## METHOD 2: Command Line (For Your Computer)

**If you have Netlify CLI installed:**

```bash
# View last 24 hours of conversations
cd /path/to/bitcoinsingularity-website
./view-conversations.sh 24

# View last week
./view-conversations.sh 168

# Saves to: conversations-YYYY-MM-DD.txt
```

**First time setup (if needed):**
```bash
npm install -g netlify-cli
netlify login
netlify link  # Link to maximoon site
```

---

## METHOD 3: Real-Time Monitoring

Watch conversations as they happen:

```bash
netlify functions:log chat
```

Press Ctrl+C to stop.

---

## BETTER SOLUTION (If You Want Automatic Daily Summaries)

I can build a script that:
- Runs daily (via cron or GitHub Actions)
- Pulls all conversations from last 24 hours
- Formats them nicely
- Emails/messages you the summary

**Includes:**
- All questions asked
- All responses given
- Conversation patterns (short vs deep engagement)
- Most common topics
- Lead intent signals

**Want me to build this?** Would take ~1 hour to set up.

---

## WHY NO SIMPLE FILE?

Netlify Functions are "serverless" - they run in temporary containers that disappear after each request. They can't write to permanent files.

**Options for persistent storage:**
1. **Netlify Blobs** (paid feature, $10/month)
2. **External service** (Google Sheets, Airtable, Supabase - free)
3. **Email after each conversation** (simple but noisy)
4. **GitHub Actions daily summary** (free, automated)

**My recommendation:** Use Netlify Dashboard for now (it's free and works). If you want automated summaries, let me build the GitHub Actions workflow.

---

## CURRENT STATUS

✅ All conversations ARE being logged  
✅ You can view them in Netlify Dashboard  
✅ You can download them as text files  
✅ Logs include actual questions and responses  

Just needs you to check Netlify function logs, or run the script from your computer.

**Want me to set up automatic daily summaries instead?**
