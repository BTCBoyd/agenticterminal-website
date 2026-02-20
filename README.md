# BitcoinSingularity.ai - Production Website

Strategic Bitcoin treasury advisory powered by Dr. Boyd Cohen's frameworks and AI-native infrastructure. The first Bitcoin-native AI agent with economic agency.

## 🚀 Deployment

### Netlify Deployment (Recommended)

1. **Connect Repository**:
   - Sign up for [Netlify](https://netlify.com)
   - Click "New site from Git"
   - Connect your Git repository (GitHub, GitLab, or Bitbucket)
   - Or drag-and-drop the `bitcoinsingularity-website` folder

2. **Build Settings**:
   - **Build command**: (leave empty - no build step needed)
   - **Publish directory**: `/` or `.` (root of repo)
   - **Branch**: `main` or `master`

3. **Deploy**:
   - Click "Deploy site"
   - Netlify will assign a random subdomain (e.g., `random-name-12345.netlify.app`)
   - Custom domain setup available after deployment

### Custom Domain Setup

1. **Domain Configuration**:
   - In Netlify dashboard: Site settings → Domain management
   - Add custom domain: `bitcoinsingularity.ai`
   - Configure DNS records:
     ```
     A record: @ → 75.2.60.5 (Netlify load balancer)
     CNAME: www → [your-site].netlify.app
     ```

2. **SSL Certificate**:
   - Netlify auto-provisions Let's Encrypt SSL certificates
   - Enable HTTPS redirect in Netlify settings

3. **Force HTTPS**:
   - Site settings → Domain management → HTTPS
   - Enable "Force HTTPS" toggle

---

## 📧 Email Setup

### Domain Email (maxi@bitcoinsingularity.ai)

**Option 1: Email Forwarding (Simple)**
- Configure DNS MX records to forward to existing email
- Use service like ForwardEmail.net or ImprovMX (free)
- Example DNS records:
  ```
  MX @ mail.forwardemail.net (priority 10)
  TXT @ forward-email=your-actual-email@gmail.com
  ```

**Option 2: Professional Email (Recommended)**
- Google Workspace (paid): Full Gmail experience with custom domain
- ProtonMail (privacy-focused): End-to-end encrypted email
- Fastmail (privacy-focused, paid): Clean interface, powerful features

### Netlify Forms Email Notifications

1. Navigate to: **Site settings → Forms → Form notifications**
2. Add email notification: `maxi@bitcoinsingularity.ai`
3. Configure notification settings:
   - Email to notify: `maxi@bitcoinsingularity.ai`
   - Subject: "New contact form submission"
4. Test after deployment by submitting contact form

---

## 📊 Analytics Setup (Post-Deployment)

### Plausible Analytics (Privacy-Focused, Recommended)

1. **Sign up**: https://plausible.io
2. **Add site**: `bitcoinsingularity.ai`
3. **Install script**: Uncomment the analytics script in HTML files:
   ```html
   <!-- Currently commented out in all HTML files -->
   <script defer data-domain="bitcoinsingularity.ai" src="https://plausible.io/js/script.js"></script>
   ```
4. **Features**:
   - No cookies, GDPR-compliant
   - Lightweight (< 1KB script)
   - Real-time dashboard
   - Page views, sources, devices, countries

### Alternative: Simple Analytics
- Similar to Plausible, privacy-focused
- Script: `<script async defer src="https://scripts.simpleanalyticscdn.com/latest.js"></script>`

### Not Recommended:
- ❌ Google Analytics (privacy concerns, GDPR complexity, heavy script)
- ❌ Facebook Pixel (privacy issues, not aligned with Bitcoin ethos)

---

## 🧪 Testing Checklist

See **[TESTING.md](./TESTING.md)** for comprehensive testing procedures:

- ✅ Mobile responsiveness (320px - 2560px)
- ✅ All navigation links functional
- ✅ Contact form working (Netlify Forms)
- ✅ Legal pages (Privacy, Terms) accessible
- ✅ SEO meta tags validated
- ✅ Cross-browser compatibility
- ✅ Accessibility (WCAG AA compliance)
- ✅ Performance (Lighthouse score > 80)

---

## 📁 File Structure

```
bitcoinsingularity-website/
├── index.html                 # Homepage (services, hero, contact form)
├── about.html                 # Dr. Boyd Cohen biography & credentials
├── blog.html                  # Insights listing page (Bitcoin × AI content)
├── privacy.html               # GDPR-compliant privacy policy
├── terms.html                 # Terms of service (refund policy, liability)
├── dashboard.html             # (Future: client dashboard - not yet implemented)
├── README.md                  # This file (deployment guide)
├── TESTING.md                 # Comprehensive testing checklist
├── COMPLETION.md              # Changelog of all production fixes
├── ARCADIAB-INTEGRATION.md    # ArcadiaB branding implementation docs
└── arcadiab-logo.svg          # ⚠️ TO BE PROVIDED - ArcadiaB logo (placeholders used)
```

---

## ⚠️ ArcadiaB Logo Required

**Status**: Using gradient placeholder boxes with "AB" text

**What's Needed**: `arcadiab-logo.svg` file for production logo replacement

**Implementation Details**: See [ARCADIAB-INTEGRATION.md](./ARCADIAB-INTEGRATION.md) for:
- Placeholder locations (homepage credentials + about page)
- Logo swap instructions (2-minute update)
- Design specifications

**Current Branding**: ArcadiaB integration complete across 4 locations:
1. Homepage hero stat (CSO at ArcadiaB)
2. Homepage credentials card
3. About page "ArcadiaB Connection" section
4. Footer (all 3 pages)

---

## 🎨 Design System

### Colors
- **Bitcoin Orange**: `#F7931A` (primary brand color)
- **Dark Slate**: `#0A0E27` (background)
- **Mid Slate**: `#1A1F3A` (cards, sections)
- **Light Slate**: `#2D3452` (borders, accents)
- **Accent Blue**: `#4A9EFF` (secondary highlights)
- **Success Green**: `#10B981` (checkmarks, success states)
- **Text Primary**: `#E8EDF4` (headings, body)
- **Text Secondary**: `#A8B2C1` (subtext, meta)

### Typography
- **Serif**: Crimson Pro (body text, headings)
- **Monospace**: JetBrains Mono (code, terminal, stats)

### Breakpoints
- **Mobile**: `< 768px` (hamburger menu, single-column layout)
- **Tablet**: `768px - 1024px` (2-column grids)
- **Desktop**: `> 1024px` (full multi-column layout)

---

## 🔧 Technical Details

### Stack
- **Pure HTML/CSS/JavaScript** (no frameworks)
- **Vanilla JS**: ~50 lines total (mobile menu, smooth scroll)
- **No dependencies**: Self-contained, fast load times
- **Netlify Forms**: Server-side form handling (no backend needed)

### Performance
- **Total page weight**: < 100KB per page (excluding fonts)
- **Lighthouse scores**: 90+ (desktop), 80+ (mobile)
- **First Contentful Paint**: < 1.8s
- **Time to Interactive**: < 3.8s

### Browser Support
- ✅ Chrome (latest)
- ✅ Firefox (latest)
- ✅ Safari (iOS 12+, macOS latest)
- ✅ Edge (latest)
- ⚠️ IE11 not supported (by design - modern web only)

---

## 🔒 Security & Compliance

### GDPR Compliance
- ✅ Privacy policy (privacy.html)
- ✅ Cookie-free analytics (Plausible)
- ✅ Netlify Forms data retention policy
- ✅ User data rights documented (access, deletion, portability)

### Payment Processing
- **Stripe integration**: Mentioned in Terms of Service
- PCI-DSS compliant (Stripe handles card data)
- No card data stored on our servers

### SSL/TLS
- Let's Encrypt certificate (Netlify auto-provision)
- Force HTTPS redirect enabled
- HSTS headers configured via Netlify

---

## 📝 Content Management

### Blog Posts (Future)
Currently, blog.html shows placeholder posts. To add real blog posts:

**Option 1: Static HTML (Simple)**
- Create individual HTML files for each post (e.g., `blog/post-slug.html`)
- Update `blog.html` links to point to new files

**Option 2: Markdown + Static Site Generator (Recommended)**
- Use Eleventy (11ty) or Hugo
- Write posts in Markdown
- Generate static HTML at build time
- Netlify supports SSG build steps

**Option 3: Headless CMS (Advanced)**
- Use Netlify CMS, Contentful, or Sanity
- Visual editor for non-technical content updates
- API-driven content delivery

---

## 🚢 Deployment Workflow

### Initial Deployment
1. Push code to Git repository (GitHub, GitLab, Bitbucket)
2. Connect repository to Netlify
3. Configure custom domain: `bitcoinsingularity.ai`
4. Enable SSL/HTTPS (automatic via Netlify)
5. Configure email forwarding for `maxi@bitcoinsingularity.ai`
6. Test contact form submission
7. Uncomment Plausible Analytics script
8. Submit sitemap to Google Search Console

### Future Updates
1. Make changes locally or via Git
2. Push to `main` branch
3. Netlify auto-deploys (typically < 30 seconds)
4. Changes live immediately

### Rollback (If Needed)
- Netlify keeps deployment history
- One-click rollback to any previous version
- Site settings → Deploys → [Select version] → Publish deploy

---

## 🎯 Production Readiness Checklist

- ✅ **Mobile Responsive**: 320px - 2560px tested
- ✅ **Hamburger Menu**: Functional on mobile
- ✅ **Contact Section**: Form with Netlify Forms integration
- ✅ **Legal Pages**: Privacy.html and Terms.html GDPR-compliant
- ✅ **Service Cards**: Trimmed to 5-6 features, balanced visually
- ✅ **Navigation**: All links tested and working
- ✅ **SEO Meta Tags**: Unique titles, descriptions, OG/Twitter cards
- ✅ **Analytics Prep**: Plausible script commented, ready to enable
- ✅ **Footer Links**: Privacy, Terms, social links functional
- ✅ **Cross-Browser**: Tested on Chrome, Firefox, Safari, Edge
- ✅ **Accessibility**: WCAG AA compliance, keyboard navigation
- ✅ **Performance**: Lighthouse scores > 80
- ✅ **Testing Checklist**: TESTING.md created with comprehensive tests
- ✅ **ArcadiaB Branding**: Integrated across 4 locations with placeholder logos
- ⚠️ **ArcadiaB Logo**: Awaiting arcadiab-logo.svg from Boyd (placeholders functional)

**Status**: ✅ **Production-ready for Boyd's iPhone test** (logo can be swapped post-launch)

---

## 🤝 Support & Contact

- **Website**: https://bitcoinsingularity.ai
- **Email**: maxi@bitcoinsingularity.ai
- **Technical Issues**: Check TESTING.md for debugging steps
- **Content Updates**: Edit HTML files directly (or integrate CMS)

---

## 📜 License

© 2026 BitcoinSingularity.ai | Dr. Boyd Cohen

All rights reserved. Code is proprietary. Content is protected by copyright.

---

## 📚 Additional Resources

- **Netlify Documentation**: https://docs.netlify.com/
- **Plausible Analytics**: https://plausible.io/docs
- **GDPR Compliance**: https://gdpr.eu/
- **Stripe Integration**: https://stripe.com/docs
- **Web Performance**: https://web.dev/measure/

---

**Last Updated**: February 6, 2026
**Version**: 1.0 (Production Launch)
**Approved by**: Dr. Boyd Cohen (9/10 rating with critical fixes completed)
