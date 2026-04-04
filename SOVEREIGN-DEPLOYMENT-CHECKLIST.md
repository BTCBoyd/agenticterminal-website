# Sovereign Dashboard Deployment Checklist

## ✅ Pre-Deployment Status

**Repository:** https://github.com/BTCBoyd/agenticterminal-website  
**Current Location:** https://agenticterminal.io/sovereign  
**Target Location:** https://sovereign.agenticterminal.io  
**DNS Provider:** Cloudflare  
**Hosting:** Netlify

---

## Step 1: Create Separate Netlify Site

### Manual Steps Required (Netlify Dashboard)

1. **Go to Netlify Dashboard:** https://app.netlify.com
2. **Click "Add new site"** → "Import an existing project"
3. **Connect to GitHub:**
   - Select `BTCBoyd/agenticterminal-website` repository
   - Authorize if needed
4. **Configure Build Settings:**
   - **Branch to deploy:** `main`
   - **Base directory:** `sovereign`
   - **Build command:** *(leave empty - this is a static HTML site)*
   - **Publish directory:** `.` (or leave as default)
5. **Click "Deploy site"**
6. **Note the Netlify subdomain:**
   - Will look like: `random-name-123456.netlify.app`
   - Copy this - you'll need it for DNS

---

## Step 2: Configure Custom Domain

### In Netlify Dashboard:

1. Go to **Site settings** → **Domain management**
2. Click **"Add custom domain"**
3. Enter: `sovereign.agenticterminal.io`
4. Click **"Verify"** → **"Add domain"**

Netlify will show you the DNS record needed (CNAME).

---

## Step 3: Configure Cloudflare DNS

### In Cloudflare Dashboard:

1. Go to https://dash.cloudflare.com
2. Select the `agenticterminal.io` zone
3. Go to **DNS** → **Records**
4. Add new record:
   - **Type:** CNAME
   - **Name:** `sovereign`
   - **Target:** `[your-netlify-subdomain].netlify.app` *(from Step 1)*
   - **TTL:** Auto
   - **Proxy status:** 🚫 **DNS only** (gray cloud, NOT orange)
     - *Important: Orange cloud breaks SSL provisioning*
5. Click **Save**

### Verify DNS:
```bash
dig sovereign.agenticterminal.io +short
# Should return: [something].netlify.app
```

---

## Step 4: SSL Certificate

Netlify automatically provisions SSL once DNS propagates.

1. In Netlify dashboard → **Domain management**
2. Wait for "SSL/TLS certificate" to show "Active"
3. This usually takes 1-5 minutes after DNS is correct

---

## Step 5: Test Deployment

### Verify the site loads:
```bash
curl -I https://sovereign.agenticterminal.io
# Should return HTTP 200
```

### Browser test:
1. Open https://sovereign.agenticterminal.io in browser
2. Verify styling loads correctly
3. Test navigation (if any)
4. Check console for errors

---

## Step 6: Update Main Site (Optional)

If you want to redirect from the old path to the new subdomain:

### Add to root `_redirects` file:
```
/sovereign  https://sovereign.agenticterminal.io  301!
/sovereign/* https://sovereign.agenticterminal.io/:splat 301!
```

Or add to root `netlify.toml`:
```toml
[[redirects]]
  from = "/sovereign"
  to = "https://sovereign.agenticterminal.io"
  status = 301
  force = true

[[redirects]]
  from = "/sovereign/*"
  to = "https://sovereign.agenticterminal.io/:splat"
  status = 301
  force = true
```

---

## Step 7: Verify OWS Separation

Confirm the separation is clean for OWS judges:

| Check | Expected Result |
|-------|-----------------|
| Main site | https://agenticterminal.io shows main terminal |
| Sovereign site | https://sovereign.agenticterminal.io shows dashboard |
| Old path | Either 404s or redirects to subdomain |
| No confusion | Judges see clear separation |

---

## Post-Deployment

### What was set up:
- ✅ Separate Netlify site for sovereign dashboard
- ✅ Custom domain: sovereign.agenticterminal.io
- ✅ DNS configured in Cloudflare
- ✅ SSL certificate auto-provisioned
- ✅ SPA routing configured (_redirects file)
- ✅ Security headers configured

### Maintenance:
- Updates to `sovereign/` folder auto-deploy on git push
- No action needed for routine updates
- DNS and SSL are handled automatically

---

## Troubleshooting

### Issue: DNS not resolving
- Check Cloudflare record is CNAME type
- Ensure proxy status is "DNS only" (gray cloud)
- Wait 1-5 minutes for propagation

### Issue: SSL not provisioning
- Verify DNS is correct first
- Ensure orange cloud (proxy) is disabled in Cloudflare
- Check Netlify domain management page for errors

### Issue: 404 on page refresh
- Verify `_redirects` file exists in sovereign folder
- Check file was committed to git
- Redeploy if needed (Netlify dashboard → Deploys → Trigger deploy)

### Issue: Styles not loading
- Check browser console for CORS errors
- Verify asset paths are relative (./ not /)
- Check _headers file isn't blocking resources

---

## Reference Files

| File | Purpose |
|------|---------|
| `sovereign/index.html` | Main dashboard HTML |
| `sovereign/_redirects` | SPA routing rules |
| `sovereign/_headers` | HTTP cache/security headers |
| `sovereign/README.md` | Local development guide |
| `sovereign-netlify.toml` | Netlify config for this deploy |
| `SOVEREIGN-DEPLOYMENT-CHECKLIST.md` | This file |

---

## Notes

- The sovereign dashboard is a **static HTML/CSS/JS site** - no build step needed
- Netlify's CDN will serve it globally with edge caching
- Changes pushed to GitHub auto-deploy via Netlify's Git integration
