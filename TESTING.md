# TESTING.md - Production Launch Testing Checklist

## Mobile Viewport Testing

### Device Breakpoints
Test all pages at the following viewport widths:

- [ ] **320px** - iPhone SE, small Android devices
  - Hero text readable and properly sized
  - Buttons thumb-friendly (44px minimum touch target)
  - No horizontal scrolling
  - Hamburger menu functional
  - Forms usable with mobile keyboard

- [ ] **375px** - iPhone 12/13 Mini, iPhone SE (newer)
  - All content stacks properly
  - Service cards stack to single column
  - Navigation accessible via hamburger menu
  - Footer links stack vertically

- [ ] **768px** - iPad (portrait), tablets
  - Service cards display 2-column grid (if supported)
  - Blog grid displays 1-2 columns
  - Desktop navigation may still be hidden (check hamburger functionality)
  - Typography increases appropriately

- [ ] **1024px** - iPad (landscape), small laptops
  - Service cards display full grid (2-4 columns)
  - Desktop navigation visible
  - Hero section displays properly with terminal animation
  - All sections have appropriate spacing

- [ ] **1440px+** - Desktop, widescreen
  - Max-width containers prevent excessive line lengths
  - Content centered and readable
  - Terminal animation displays properly
  - All hover effects work

### Mobile-Specific Testing

- [ ] **Touch Targets**: All buttons, links, and interactive elements are minimum 44x44px
- [ ] **Hamburger Menu**: 
  - Opens/closes smoothly on tap
  - Closes when clicking outside menu area
  - Links navigate properly and close menu after click
  - Animation smooth (3 bars rotate to X)
- [ ] **Forms (Contact Section)**:
  - Input fields large enough for mobile keyboard
  - Submit button easily tappable
  - Form validation works on mobile
  - Email keyboard shows for email fields
- [ ] **Terminal Animation**: Hidden or simplified on mobile (performance)
- [ ] **No Horizontal Scroll**: Test all pages at 320px width
- [ ] **Blog Grid**: Stacks to single column on mobile
- [ ] **Service Cards**: Stack to single column on mobile, features readable

### Testing Tools

- Chrome DevTools Device Toolbar
- Firefox Responsive Design Mode
- Real device testing:
  - iPhone (Safari)
  - Android device (Chrome)
  - iPad (Safari)

### Cross-Browser Mobile Testing

- [ ] **iOS Safari** (primary mobile browser)
- [ ] **Chrome Mobile** (Android primary)
- [ ] **Firefox Mobile**
- [ ] **Samsung Internet** (if targeting Android)

---

## Link Testing Checklist

### Navigation Links (All Pages)

#### Index.html
- [ ] Logo → `/` (home)
- [ ] Services → `#services` (anchor)
- [ ] About → `#about` (anchor on home page)
- [ ] Insights → `/blog.html`
- [ ] Contact → `#contact` (anchor)
- [ ] Book Assessment (CTA button) → `#contact`
- [ ] "Explore Services" → `#services`
- [ ] All service card "Book" buttons → `#contact`
- [ ] "Book $1,500 Assessment" → `#contact`
- [ ] "Try Free (10 messages)" → `mailto:maxi@bitcoinsingularity.ai`

#### About.html
- [ ] Logo → `/index.html`
- [ ] Home → `/index.html`
- [ ] About → `/about.html` (current page)
- [ ] Insights → `/blog.html`
- [ ] Services → `/index.html#services`
- [ ] Contact → `/index.html#contact`
- [ ] "Get Started" CTA → `/index.html#contact`

#### Blog.html
- [ ] Logo → `/` or `/index.html`
- [ ] Services → `/#services`
- [ ] About → `/about.html`
- [ ] Insights → `/blog.html` (current page)
- [ ] Contact → `/#contact`
- [ ] Book Assessment (CTA) → `/#contact`
- [ ] All "Read more" links (placeholder for now, should navigate when blog posts exist)

### Footer Links (All Pages)

- [ ] Privacy Policy → `/privacy.html`
- [ ] Terms of Service → `/terms.html`
- [ ] Nostr → `https://nostr.com/maxi` (opens in new tab)
- [ ] Twitter/X → `https://twitter.com/maxibtc` (opens in new tab)
- [ ] Contact → `mailto:maxi@bitcoinsingularity.ai`

### Legal Pages

#### Privacy.html
- [ ] Logo → `/`
- [ ] Home → `/`
- [ ] Terms of Service → `/terms.html`
- [ ] Contact → `mailto:maxi@bitcoinsingularity.ai`
- [ ] Stripe privacy link → `https://stripe.com/privacy` (external, new tab)

#### Terms.html
- [ ] Logo → `/`
- [ ] Home → `/`
- [ ] Privacy Policy → `/privacy.html`
- [ ] Contact → `mailto:maxi@bitcoinsingularity.ai`

### Anchor Link Smooth Scrolling

- [ ] All `#` anchor links scroll smoothly (not instant jump)
- [ ] JavaScript smooth scroll implementation works cross-browser
- [ ] Offset accounts for fixed header (doesn't hide content behind header)

### Testing Method

1. **Manual Click Testing**: Click every link on every page
2. **Console Errors**: Check browser console for 404 errors or broken links
3. **Link Checker Tool**: Use online tool like `deadlinkchecker.com` or W3C Link Checker
4. **mailto Links**: Test email links open default email client with correct pre-filled subject

---

## Form Testing (Contact Section)

### Netlify Forms Setup

- [ ] `data-netlify="true"` attribute present on `<form>` tag
- [ ] `name="contact"` attribute present
- [ ] Hidden `form-name` input field with value `"contact"`
- [ ] Honeypot field `bot-field` present and hidden

### Form Functionality

- [ ] **Required Fields**:
  - Name field validates (cannot submit empty)
  - Email field validates (cannot submit empty)
  - Message field validates (cannot submit empty)
  - Company field is optional (can be empty)

- [ ] **Email Validation**: Email field rejects invalid formats (e.g., "notanemail")
- [ ] **Submit Button**: Displays properly, thumb-friendly on mobile (44px min height)
- [ ] **Form Submission**: 
  - Success: Redirects to Netlify success page or shows confirmation
  - Netlify dashboard shows submitted form data
  - Email notification received at `maxi@bitcoinsingularity.ai`

- [ ] **Honeypot Anti-Spam**: Hidden field prevents bot submissions
- [ ] **Mobile Usability**: 
  - Fields large enough for mobile keyboard
  - Email keyboard automatically appears for email field
  - Submit button easily tappable

### Mailto Fallback

- [ ] Mailto link (`maxi@bitcoinsingularity.ai`) opens email client
- [ ] Subject line pre-filled if specified in link

### Post-Deployment Testing

After deploying to Netlify:
1. Submit test form entry
2. Check Netlify dashboard → Forms section for submission
3. Verify email notification arrives
4. Test spam prevention (submit without filling honeypot)

---

## SEO Validation

### Meta Tags (All Pages)

#### Index.html
- [ ] `<title>` present and descriptive
- [ ] `<meta name="description">` present (155 characters or less)
- [ ] Open Graph tags:
  - `og:title`
  - `og:description`
  - `og:image` (placeholder URL)
  - `og:url`
  - `og:type` = "website"
- [ ] Twitter Card tags:
  - `twitter:card` = "summary_large_image"
  - `twitter:title`
  - `twitter:description`
  - `twitter:image` (placeholder URL)

#### About.html
- [ ] Unique `<title>` (different from index.html)
- [ ] Unique `<meta name="description">`
- [ ] Open Graph tags present
- [ ] Twitter Card tags present
- [ ] `og:type` = "profile" (for personal/author page)

#### Blog.html
- [ ] Unique `<title>` for blog listing page
- [ ] Unique `<meta name="description">`
- [ ] Open Graph and Twitter Card tags present

#### Privacy.html & Terms.html
- [ ] Unique `<title>` tags
- [ ] Unique `<meta name="description">` tags
- [ ] Basic Open Graph tags

### Validation Tools

- [ ] **HTML Validation**: https://validator.w3.org/
  - No critical errors
  - Warnings acceptable if intentional
- [ ] **Open Graph Validator**: https://www.opengraph.xyz/
  - Preview displays correctly
  - Image loads (once OG image is uploaded)
- [ ] **Twitter Card Validator**: https://cards-dev.twitter.com/validator
  - Card preview displays correctly
- [ ] **Google Rich Results Test**: https://search.google.com/test/rich-results
  - No errors for basic meta tags

### Content SEO Checks

- [ ] **Heading Hierarchy**: Proper H1 → H2 → H3 structure (no skipping levels)
- [ ] **Alt Text**: All images have descriptive alt text (when images added)
- [ ] **Internal Linking**: Cross-links between pages (About ↔ Home ↔ Blog)
- [ ] **Mobile-Friendly**: Google Mobile-Friendly Test passes
- [ ] **Page Speed**: Lighthouse performance score > 80 (desktop and mobile)

### robots.txt & Sitemap (Post-Deployment)

- [ ] `robots.txt` allows search engine crawling
- [ ] `sitemap.xml` generated and submitted to Google Search Console
- [ ] Canonical URLs set (if needed for duplicate content prevention)

---

## Accessibility Testing

### Keyboard Navigation

- [ ] **Tab Order**: Logical tab order through all interactive elements
- [ ] **Focus Indicators**: Visible focus outline on all focusable elements
- [ ] **Skip Links**: Consider adding "Skip to main content" link
- [ ] **Form Navigation**: Can complete contact form using only keyboard

### Screen Reader Testing

- [ ] **Landmark Roles**: `<header>`, `<nav>`, `<main>`, `<footer>` properly used
- [ ] **Alt Text**: All images have descriptive alt attributes
- [ ] **Form Labels**: All form inputs have associated `<label>` elements
- [ ] **Button Text**: All buttons have descriptive text (not just icons)

### Color Contrast

- [ ] **Text Contrast**: All text meets WCAG AA standards (4.5:1 for normal text, 3:1 for large)
- [ ] **Interactive Elements**: Buttons and links distinguishable from surrounding text
- [ ] **Test Tool**: Use WebAIM Contrast Checker or Chrome DevTools Lighthouse

### Tools

- [ ] **WAVE**: https://wave.webaim.org/ (accessibility evaluation)
- [ ] **axe DevTools**: Browser extension for accessibility auditing
- [ ] **Lighthouse**: Chrome DevTools → Lighthouse → Accessibility score > 90

---

## Performance Testing

### Page Load Speed

- [ ] **Lighthouse Performance Score**: > 80 on mobile, > 90 on desktop
- [ ] **First Contentful Paint (FCP)**: < 1.8s
- [ ] **Largest Contentful Paint (LCP)**: < 2.5s
- [ ] **Time to Interactive (TTI)**: < 3.8s
- [ ] **Total Blocking Time (TBT)**: < 200ms

### Optimization Checks

- [ ] **Font Loading**: Google Fonts use `preconnect` and `display=swap`
- [ ] **CSS**: Inline critical CSS or use single stylesheet (no multiple imports)
- [ ] **JavaScript**: Minimal JS, deferred or async loading where possible
- [ ] **Images**: Compressed, WebP format where supported (when images added)
- [ ] **File Sizes**: HTML files < 100KB each (currently met)

### Testing Tools

- [ ] **PageSpeed Insights**: https://pagespeed.web.dev/
- [ ] **WebPageTest**: https://www.webpagetest.org/
- [ ] **Chrome DevTools Network Tab**: Check total page weight and load times

---

## Browser Compatibility Testing

### Desktop Browsers

- [ ] **Chrome** (latest) - primary target
- [ ] **Firefox** (latest)
- [ ] **Safari** (latest macOS)
- [ ] **Edge** (latest)

### Mobile Browsers

- [ ] **Safari iOS** (iPhone/iPad) - primary mobile target
- [ ] **Chrome Android**
- [ ] **Firefox Mobile**
- [ ] **Samsung Internet** (if targeting Android users)

### Testing Checklist Per Browser

- [ ] Layout displays correctly
- [ ] Hamburger menu works on mobile
- [ ] Forms submit properly
- [ ] CSS animations/transitions work
- [ ] Fonts load correctly
- [ ] No console errors

---

## Final Production Checklist

### Pre-Launch

- [ ] All critical fixes completed (mobile responsiveness, contact section, legal pages)
- [ ] All navigation links tested and working
- [ ] Contact form tested on Netlify
- [ ] Privacy and Terms pages reviewed for legal compliance
- [ ] SEO meta tags validated
- [ ] Mobile testing completed on real devices
- [ ] Performance scores acceptable (Lighthouse > 80)

### Launch Day

- [ ] Deploy to production (Netlify)
- [ ] Test live site on multiple devices
- [ ] Submit sitemap to Google Search Console
- [ ] Add Plausible Analytics script (uncomment in HTML)
- [ ] Set up email forwarding for `maxi@bitcoinsingularity.ai`
- [ ] Test contact form on live site
- [ ] Share live URL with Boyd Cohen for iPhone test

### Post-Launch

- [ ] Monitor Netlify Forms dashboard for submissions
- [ ] Check analytics (Plausible) for traffic patterns
- [ ] Monitor for any error reports or user feedback
- [ ] Schedule regular broken link checks (monthly)

---

## Boyd's iPhone Test (Tomorrow)

When Boyd tests the site on his iPhone, ensure:

- [ ] **Homepage loads quickly** (< 3 seconds on cellular)
- [ ] **Hamburger menu works smoothly**
- [ ] **Service cards are readable** and don't overflow
- [ ] **Contact form is usable** with iPhone keyboard
- [ ] **All navigation links work** (no 404s)
- [ ] **Footer links accessible** (Privacy, Terms, Contact)
- [ ] **No horizontal scrolling** at any point
- [ ] **Terminal animation** hidden or performs well on mobile
- [ ] **Text is readable** without zooming (font sizes appropriate)
- [ ] **Buttons are easily tappable** (no accidental clicks)

---

## Notes

- **Testing Priority**: Mobile-first! Most users will access on mobile devices
- **Real Device Testing**: Always test on real devices, not just emulators
- **Boyd's Approval**: Final sign-off after iPhone test tomorrow
- **Iterative**: If issues found, fix immediately and re-test

**Production readiness goal**: Zero broken links, mobile responsive 320px-2560px, contact form functional, legal pages compliant.
