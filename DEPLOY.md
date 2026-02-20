# 🚀 Deployment Checklist

**Get BitcoinSingularity.ai live in under 15 minutes**

---

## ✅ Pre-Launch Checklist

### 1. Review Content
- [ ] Check all text for accuracy
- [ ] Verify pricing ($1,500, $5K/mo, $3.5K/mo)
- [ ] Confirm email address ([email protected])
- [ ] Review Boyd's credentials and timeline
- [ ] Validate Lightning node pubkey if displayed

### 2. Customize Contact Info
**Files to update:**
- `index.html` - Footer and CTA section
- `blog.html` - Footer
- `about.html` - Footer

**Replace:**
- `[email protected]` with actual email
- Add social links if desired (Twitter, LinkedIn)

---

## 🚀 Deploy to Netlify (RECOMMENDED)

**Time Required:** 5 minutes  
**Cost:** Free (includes SSL, CDN, bandwidth)

### Steps:

1. **Create Account**
   - Go to [netlify.com](https://netlify.com)
   - Sign up (free plan)

2. **Deploy Site**
   - Click "Add new site" → "Deploy manually"
   - Drag the `bitcoinsingularity-website/` folder
   - Wait 30 seconds for build
   - Your site is live at `random-name-12345.netlify.app`

3. **Configure Custom Domain**
   - Click "Domain settings"
   - Click "Add custom domain"
   - Enter: `bitcoinsingularity.ai`
   - Netlify provides DNS instructions

4. **Update DNS (at your registrar)**
   ```
   Type: A
   Name: @
   Value: 75.2.60.5
   
   Type: CNAME
   Name: www
   Value: [your-site].netlify.app
   ```

5. **Enable HTTPS**
   - Netlify automatically provisions SSL certificate
   - Forces HTTPS (secure by default)

6. **Done!** 🎉
   - Visit bitcoinsingularity.ai
   - Share with the world

---

## 🔄 Update Workflow

### To Update Content:

**Option A: Re-deploy (Easiest)**
1. Edit HTML files locally
2. Drag updated folder to Netlify (replaces old version)
3. Changes live instantly

**Option B: Git Integration (Recommended for ongoing updates)**
1. Push code to GitHub repository
2. Connect repo to Netlify
3. Auto-deploy on every push

---

## 🌐 Alternative: Deploy to Vercel

**Similar to Netlify, equally good:**

1. Go to [vercel.com](https://vercel.com)
2. Click "Add New Project"
3. Import from GitHub or drag-drop folder
4. Configure domain (same DNS setup as Netlify)
5. Deploy!

**Vercel provides:**
- Free SSL
- Global CDN
- Instant deployments
- Preview URLs for testing

---

## 📧 Set Up Contact Form

**Current state:** Email links work but aren't ideal

**Quick Fix (5 minutes):**

### Use Netlify Forms:

1. **Edit index.html** - Replace CTA section email links with form:

```html
<form name="contact" method="POST" data-netlify="true" data-netlify-honeypot="bot-field">
  <input type="hidden" name="form-name" value="contact">
  <p hidden>
    <input name="bot-field">
  </p>
  
  <div style="margin-bottom: 1rem;">
    <input type="text" name="name" placeholder="Your Name" required 
           style="width: 100%; padding: 1rem; border-radius: 6px; border: 2px solid var(--light-slate); background: var(--mid-slate); color: var(--text-primary); font-family: 'Crimson Pro', serif; font-size: 1rem;">
  </div>
  
  <div style="margin-bottom: 1rem;">
    <input type="email" name="email" placeholder="Your Email" required
           style="width: 100%; padding: 1rem; border-radius: 6px; border: 2px solid var(--light-slate); background: var(--mid-slate); color: var(--text-primary); font-family: 'Crimson Pro', serif; font-size: 1rem;">
  </div>
  
  <div style="margin-bottom: 1rem;">
    <select name="service" required
            style="width: 100%; padding: 1rem; border-radius: 6px; border: 2px solid var(--light-slate); background: var(--mid-slate); color: var(--text-primary); font-family: 'Crimson Pro', serif; font-size: 1rem;">
      <option value="">Select Service...</option>
      <option value="assessment">Strategic Assessment ($1,500)</option>
      <option value="implementation">Implementation ($5K/mo)</option>
      <option value="advisory">Advisory Retainer ($3.5K/mo)</option>
      <option value="arcadia">ArcadiaB Referral</option>
      <option value="trial">Free Trial</option>
    </select>
  </div>
  
  <div style="margin-bottom: 1.5rem;">
    <textarea name="message" placeholder="Tell us about your needs..." rows="4"
              style="width: 100%; padding: 1rem; border-radius: 6px; border: 2px solid var(--light-slate); background: var(--mid-slate); color: var(--text-primary); font-family: 'Crimson Pro', serif; font-size: 1rem;"></textarea>
  </div>
  
  <button type="submit" class="btn btn-primary" style="width: 100%;">
    Send Inquiry
  </button>
</form>
```

2. **Deploy to Netlify** (forms only work on Netlify)

3. **Receive Notifications:**
   - Go to Netlify dashboard → Forms
   - Set up email notifications
   - Submissions appear in dashboard

**Cost:** Free (100 submissions/month on free plan)

---

## 💳 Set Up Payments (Stripe)

**Time Required:** 15 minutes  
**Requirements:** Stripe account

### Steps:

1. **Create Stripe Account**
   - Go to [stripe.com](https://stripe.com)
   - Complete verification

2. **Create Payment Links:**
   
   **Product 1: Strategic Assessment**
   - Name: Strategic Assessment
   - Price: $1,500 USD (one-time)
   - Description: Comprehensive Bitcoin treasury audit and roadmap
   
   **Product 2: Implementation Service**
   - Name: Implementation Service
   - Price: $5,000 USD/month (subscription)
   - Description: Full Bitcoin treasury deployment and Lightning integration
   
   **Product 3: Advisory Retainer**
   - Name: Advisory Retainer
   - Price: $3,500 USD/month (subscription)
   - Description: Monthly strategy sessions and ongoing guidance

3. **Get Payment Links:**
   - Stripe generates URLs like: `https://buy.stripe.com/abc123xyz`

4. **Update HTML:**
   Replace CTA button hrefs with Stripe links:
   ```html
   <a href="https://buy.stripe.com/YOUR_LINK_HERE" class="btn btn-primary">
     Book Assessment ($1,500)
   </a>
   ```

5. **Test in Test Mode:**
   - Use Stripe test cards
   - Verify purchase flow
   - Switch to Live Mode when ready

---

## 📊 Add Analytics

**Recommended: Plausible (Privacy-focused, Bitcoin-friendly)**

### Setup (2 minutes):

1. **Create Account**
   - Go to [plausible.io](https://plausible.io)
   - Start free trial (30 days)
   - Pay with Bitcoin if desired!

2. **Add Tracking Code**
   - Copy your tracking script
   - Add to `<head>` of all HTML files:
   
   ```html
   <script defer data-domain="bitcoinsingularity.ai" 
           src="https://plausible.io/js/script.js"></script>
   ```

3. **Deploy Updated Files**

4. **View Stats:**
   - Dashboard shows real-time visitors
   - Pages, referrers, devices
   - No cookies, GDPR compliant

**Cost:** $9/month (10K pageviews)

---

## 🔍 SEO Setup

### Add Files to Root:

#### **sitemap.xml**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://bitcoinsingularity.ai/</loc>
    <priority>1.0</priority>
    <changefreq>weekly</changefreq>
  </url>
  <url>
    <loc>https://bitcoinsingularity.ai/blog.html</loc>
    <priority>0.8</priority>
    <changefreq>weekly</changefreq>
  </url>
  <url>
    <loc>https://bitcoinsingularity.ai/about.html</loc>
    <priority>0.8</priority>
    <changefreq>monthly</changefreq>
  </url>
</urlset>
```

#### **robots.txt**
```
User-agent: *
Allow: /

Sitemap: https://bitcoinsingularity.ai/sitemap.xml
```

### Submit to Search Engines:

1. **Google Search Console**
   - Go to [search.google.com/search-console](https://search.google.com/search-console)
   - Add property: bitcoinsingularity.ai
   - Verify ownership (HTML file or DNS)
   - Submit sitemap

2. **Bing Webmaster Tools**
   - Similar process at [bing.com/webmasters](https://bing.com/webmasters)

---

## ✉️ Email Setup

**Professional Email:** [email protected]

### Option 1: Use Gmail (Free)
- Set up email forwarding from domain
- Reply-as feature maintains branding

### Option 2: Google Workspace ($6/user/month)
- Professional email hosting
- Custom domain email
- Calendar, Drive integration

### Option 3: ProtonMail (Privacy-focused)
- Encrypted email
- Custom domain support
- Bitcoin payments accepted!

---

## 🎨 Optional: Add Favicon

Create `favicon.ico` (Bitcoin logo or ₿ symbol):

1. Use [favicon.io](https://favicon.io) to generate
2. Upload `favicon.ico` to root directory
3. Add to `<head>`:
   ```html
   <link rel="icon" type="image/x-icon" href="/favicon.ico">
   ```

---

## 📱 Test Checklist

Before announcing launch:

### Desktop Testing:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Check all links work
- [ ] Forms submit correctly
- [ ] Payment links redirect properly

### Mobile Testing:
- [ ] iOS Safari (iPhone)
- [ ] Android Chrome
- [ ] Check readability
- [ ] Test navigation menu
- [ ] Verify touch targets

### Performance:
- [ ] Run [PageSpeed Insights](https://pagespeed.web.dev)
- [ ] Target: 90+ score
- [ ] Check mobile performance

### SEO:
- [ ] All pages have meta descriptions
- [ ] Open Graph tags present
- [ ] Structured data (optional)

---

## 🎯 Launch Day

### Announcements:
- [ ] Twitter thread about Bitcoin Singularity
- [ ] LinkedIn post (Boyd's profile)
- [ ] Email to existing contacts
- [ ] Post in Bitcoin communities (Reddit, Telegram)
- [ ] Nostr announcement (if active)

### Monitor:
- [ ] Check analytics for traffic
- [ ] Watch for form submissions
- [ ] Monitor uptime (uptime monitors: UptimeRobot)
- [ ] Respond to inquiries quickly

---

## 🔧 Troubleshooting

### Site not loading?
- Check DNS propagation: [whatsmydns.net](https://whatsmydns.net)
- DNS can take 24-48 hours to propagate
- Try clearing browser cache

### Styles broken?
- Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
- Check browser console for errors
- Verify Google Fonts are loading

### Forms not working?
- Netlify forms only work when deployed to Netlify
- Check Netlify dashboard → Forms tab
- Verify `data-netlify="true"` attribute present

### Payment links not working?
- Ensure Stripe account is in Live Mode (not Test Mode)
- Verify links are complete URLs
- Test with real card (small amount)

---

## 📞 Support Resources

**Netlify Docs:** [docs.netlify.com](https://docs.netlify.com)  
**Stripe Docs:** [stripe.com/docs](https://stripe.com/docs)  
**Plausible Docs:** [plausible.io/docs](https://plausible.io/docs)

**For Website Issues:**
Contact: [email protected]

---

## 🎉 You're Ready to Launch!

**Minimum viable launch:**
1. Deploy to Netlify (5 min)
2. Configure domain (15 min)
3. Test all pages (10 min)
4. Announce launch

**Total time:** ~30 minutes

**Full-featured launch:**
1. Everything above
2. Add contact form (10 min)
3. Set up Stripe payments (15 min)
4. Install analytics (5 min)
5. Submit to search engines (10 min)

**Total time:** ~90 minutes

---

*"Ship early, iterate fast. Perfection is the enemy of launch."*

**Ready? Let's deploy! 🚀**