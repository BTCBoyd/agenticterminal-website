# Sovereign Dashboard Deployment Guide

## Overview
This directory contains the Sovereign Dashboard - a standalone deployment separate from the main Agentic Terminal site.

**Production URL:** https://sovereign.agenticterminal.io

## Architecture

The Sovereign Dashboard is deployed as a **separate Netlify site** (not a branch deploy) for complete separation from the main site. This ensures:
- Independent deployments
- Separate caching rules
- Clean domain separation (no path-based routing confusion)
- Different environment variables if needed

## Local Development

Since this is a static HTML/CSS/JS app, you can serve it locally:

```bash
cd /home/futurebit/.openclaw/workspace/agenticterminal-website/sovereign
python3 -m http.server 8080
# Or
npx serve .
```

Then open http://localhost:8080

## Deployment

### Option 1: Deploy via Netlify UI (Recommended)

1. Go to [Netlify Dashboard](https://app.netlify.com)
2. Click "Add new site" → "Import an existing project"
3. Choose GitHub → Select `BTCBoyd/agenticterminal-website` repository
4. Configure build settings:
   - **Branch to deploy:** `main`
   - **Base directory:** `sovereign`
   - **Build command:** (leave empty - static site)
   - **Publish directory:** `.`
5. Click "Deploy site"
6. Go to Site settings → Domain management
7. Add custom domain: `sovereign.agenticterminal.io`

### Option 2: Deploy via Netlify CLI

```bash
# Install Netlify CLI if needed
npm install -g netlify-cli

# Login to Netlify
netlify login

# Initialize new site (from sovereign directory)
cd /home/futurebit/.openclaw/workspace/agenticterminal-website/sovereign
netlify init --manual

# Deploy
netlify deploy --prod

# Configure custom domain via Netlify UI or:
netlify domains:add sovereign.agenticterminal.io
```

## DNS Configuration (Cloudflare)

Add this DNS record in Cloudflare:

| Type  | Name      | Target                | Proxy Status |
|-------|-----------|----------------------|--------------|
| CNAME | sovereign | <netlify-domain>     | DNS only     |

**Important:** Disable Cloudflare proxy (gray cloud) for the CNAME record pointing to Netlify. Netlify needs to see the actual DNS record to provision SSL.

The Netlify domain will look like:
- `[random-name].netlify.app` (if using default)
- Or the subdomain Netlify provides

### SSL/TLS
Netlify automatically provisions SSL certificates once the DNS record propagates. This may take a few minutes.

## File Structure

```
sovereign/
├── index.html          # Main dashboard
├── _headers            # HTTP headers (cache control)
├── enterprise/         # Enterprise tier content
│   └── index.html
├── sovereign/          # Sovereign tier content
│   └── index.html
├── waitlist/           # Waitlist signup
│   └── index.html
└── README.md           # This file
```

## Maintenance

To update the Sovereign Dashboard:

1. Edit files in `/home/futurebit/.openclaw/workspace/agenticterminal-website/sovereign/`
2. Commit and push to GitHub:
   ```bash
   git add sovereign/
   git commit -m "Update sovereign dashboard"
   git push origin main
   ```
3. Netlify will auto-deploy the changes

## Environment Variables

If the dashboard needs API keys or configuration:

1. Go to Netlify dashboard → Site settings → Environment variables
2. Add variables prefixed with `SOVEREIGN_` to avoid conflicts:
   - `SOVEREIGN_API_URL`
   - `SOVEREIGN_ANALYTICS_KEY`

## Troubleshooting

### Site not loading
- Check DNS record is correctly pointing to Netlify
- Ensure Cloudflare proxy is disabled (gray cloud)
- Verify SSL certificate is provisioned in Netlify dashboard

### 404 errors
- This is a single-page app (SPA) - the `_redirects` rule should handle client-side routing
- Check that `netlify.toml` or `_redirects` file is present

### Cache issues
- The `_headers` file sets `Cache-Control: no-cache` for all files
- Hard refresh browser (Cmd+Shift+R / Ctrl+F5)
