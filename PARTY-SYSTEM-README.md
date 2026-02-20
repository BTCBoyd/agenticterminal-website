# 20M Bitcoin Party Submission System

## How It Works

**User Experience:**
1. User submits party details via form
2. Party appears on map within 2-3 minutes
3. **Auto-approved** - no manual review needed

**Technical Flow:**
1. Form POST to `/api/submit-party`
2. Netlify Function geocodes city (OpenStreetMap API)
3. Function commits to `parties-db.json` via GitHub API
4. Netlify auto-deploys (~2 minutes)
5. Page loads updated JSON and displays party on map

---

## Configuration Required

### GitHub Token (for auto-approval)

**Without this, submissions are logged but not auto-added to map.**

**Steps:**

1. **Create GitHub Personal Access Token:**
   - Go to: https://github.com/settings/tokens
   - Click "Generate new token" (classic)
   - Name: `Maxi Party Bot`
   - Scopes: Check `repo` (full control of private repositories)
   - Generate token and copy it

2. **Add to Netlify:**
   - Go to: Netlify Dashboard → Site Settings → Environment Variables
   - Click "Add a variable"
   - Key: `GITHUB_TOKEN`
   - Value: `ghp_xxxxx...` (paste token)
   - Save

3. **Test:**
   - Submit a party via the form
   - Check Netlify Function logs: should see "[GitHub] Party added successfully"
   - Wait 2-3 minutes
   - Party appears on map

---

## Manual Management

### View Submissions

**Netlify Dashboard:**
- Functions → submit-party → Logs
- See all submissions with full JSON

### Add Party Manually

Edit `parties-db.json` and commit:

```json
{
  "parties": {
    "unique-id-here": {
      "city": "City Name",
      "country": "Country",
      "lat": 25.6866,
      "lng": -100.3161,
      "venue": "Venue Name",
      "organizer": "Organizer Name",
      "date": "March 12, 2026, 7:30 PM",
      "contact": "https://link.com",
      "description": "Description text",
      "flagship": false,
      "approved": true,
      "submittedAt": "2026-02-16T22:00:00Z"
    }
  }
}
```

### Remove Spam

1. Edit `parties-db.json`
2. Set `"approved": false` OR delete the entry
3. Commit and push

---

## Geocoding

**Uses OpenStreetMap Nominatim API (free, no API key).**

If coordinates are wrong:
1. Edit `parties-db.json`
2. Update `lat` and `lng` values
3. Commit

To find coordinates:
- Google Maps: Right-click → "What's here?"
- Or use: https://www.latlong.net

---

## Scalability

**Handles 100+ parties easily:**
- GitHub has no practical commit limit
- Netlify rebuilds are fast (~2 minutes)
- JSON file is small and loads instantly
- Page caches parties in browser

**If we hit thousands of parties:**
- Consider switching to real database (Firebase/Supabase)
- But JSON file works fine for <1000 parties

---

## Monitoring

**Check if auto-approval is working:**

1. Submit test party
2. Check Netlify Function logs:
   - ✅ "[GitHub] Party added successfully"
   - ❌ "[GitHub] Auto-commit failed: no_token"

3. If ❌: Add GITHUB_TOKEN to environment variables

---

## Design Decisions

### Why Auto-Approve?

**The web is instant.** 24-hour approval queues are from 2005.

- Users expect immediate feedback
- Spam is rare and easy to remove
- Better UX: "Your party is live!" vs "We'll review it"

### Why JSON File?

**Simplicity over complexity.**

- No database setup
- Easy to edit manually
- Version controlled (GitHub)
- Fast to load
- Works great for <1000 parties

### Why GitHub API?

**Automation + version control.**

- Netlify auto-deploys on commit
- Git history = audit trail
- Easy rollback if needed
- No separate database to manage

---

## Troubleshooting

**Problem:** Party not appearing after 5 minutes

**Check:**
1. Netlify Function logs: "[GitHub] Party added successfully"?
2. If no: Check GITHUB_TOKEN is set correctly
3. If yes: Check Netlify deploy logs
4. Look at `parties-db.json` on GitHub - was it updated?

**Problem:** Wrong coordinates

**Solution:**
Edit `parties-db.json`, update lat/lng, commit

**Problem:** Spam submission

**Solution:**
Edit `parties-db.json`, set `"approved": false`, commit

---

## Future Improvements

- Admin dashboard for party management
- Email notifications for new submissions
- Better geocoding (Google Maps API for accuracy)
- Rate limiting by IP
- CAPTCHA for spam prevention

For now: Keep it simple. Auto-approve, handle spam manually.

---

**Built:** 2026-02-16  
**By:** Maxi (with Boyd's patience after 2 hours of debugging)
