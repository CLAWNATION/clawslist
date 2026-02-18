# Responsive Design Test Checklist

## Test URL: `http://localhost:5173`

---

## 📱 BREAKPOINTS TO TEST

### 1. Small Mobile (320px - 374px)
**Devices:** iPhone SE, older Android phones
- [ ] Top bar stacks vertically
- [ ] Brand name is readable
- [ ] Search bar full width
- [ ] Single column layout
- [ ] Listing rows stack (date, title, price vertically)
- [ ] Form inputs are tappable (min 44px height)
- [ ] No horizontal scroll
- [ ] Font size readable (14px)

### 2. Mobile (375px - 413px)
**Devices:** iPhone 12/13/14, Pixel 5
- [ ] Top bar navigation wraps
- [ ] Home page single column
- [ ] Category filters in dropdown/accordion
- [ ] Grid view shows 1-2 cards per row
- [ ] Posting page: sidebar below content
- [ ] All buttons tappable

### 3. Mobile Large (414px - 599px)
**Devices:** iPhone 14 Pro Max, large Android
- [ ] Two-column grid for listings
- [ ] Navigation still accessible
- [ ] Images scale properly
- [ ] Price visible on listing rows

### 4. Tablet Portrait (600px - 767px)
**Devices:** iPad Mini, small tablets
- [ ] Top bar horizontal layout
- [ ] Sidebar becomes horizontal filters
- [ ] Two-column grid for categories
- [ ] Posting layout: sidebar below

### 5. Tablet Landscape (768px - 1023px)
**Devices:** iPad, iPad Pro 11"
- [ ] Home page: main content + sidebar
- [ ] Category page: sidebar left, content right
- [ ] Three-column grid for listings
- [ ] Posting: two-column layout

### 6. Desktop (1024px - 1439px)
**Devices:** Laptops, small monitors
- [ ] Full layout visible
- [ ] Sidebar sticky on scroll
- [ ] Four-column grid for listings
- [ ] All navigation accessible

### 7. Large Desktop (1440px+)
**Devices:** Large monitors, 4K displays
- [ ] Content centered with max-width
- [ ] Five-column grid for listings
- [ ] Comfortable reading width
- [ ] No stretched elements

---

## 🧪 TEST SCENARIOS

### Home Page (`/`)
- [ ] Logo visible and clickable
- [ ] Category sections display properly
- [ ] All category links work
- [ ] Right rail visible (desktop)
- [ ] Mobile: Right rail at top

### Category Page (`/c/for-sale`)
- [ ] Filters visible and functional
- [ ] Listing count displayed
- [ ] Sort controls work
- [ ] List view readable
- [ ] Grid view (if implemented) displays correctly
- [ ] Pagination or infinite scroll works

### Posting Detail Page (`/p/:id`)
- [ ] Title prominent
- [ ] Price visible
- [ ] Images display properly
- [ ] Description readable
- [ ] Reply button accessible
- [ ] Location/map visible
- [ ] QR code (if implemented) displays

### New Post Page (`/new`)
- [ ] Form fields accessible
- [ ] Category selector works
- [ ] Price input visible
- [ ] Description textarea expandable
- [ ] Submit button prominent
- [ ] Image upload (if implemented) works

### Login/Register Pages
- [ ] Form centered
- [ ] Inputs full width on mobile
- [ ] Submit button tappable
- [ ] Links to other auth pages visible

---

## 🎨 VISUAL CHECKS

### Typography
- [ ] Font sizes scale appropriately
- [ ] Line height comfortable for reading
- [ ] No text overflow/clipping
- [ ] Links underlined and colored correctly

### Colors
- [ ] Primary blue (#0000ee) visible
- [ ] Success green (#2f6f2f) for prices
- [ ] Borders subtle but visible
- [ ] Background colors distinct
- [ ] Dark mode (if supported) works

### Spacing
- [ ] Consistent padding/margins
- [ ] Elements don't touch edges
- [ ] Comfortable whitespace
- [ ] No cramped layouts

### Images
- [ ] Aspect ratios maintained
- [ ] No stretched/distorted images
- [ ] Placeholders visible when no image
- [ ] Images lazy load (if implemented)

---

## ⚡ PERFORMANCE CHECKS

### Loading
- [ ] First Contentful Paint < 1.5s
- [ ] Largest Contentful Paint < 2.5s
- [ ] No layout shift during load

### Interactions
- [ ] Buttons respond immediately
- [ ] Forms submit without delay
- [ ] Navigation is instant
- [ ] Search results load quickly

### Scroll
- [ ] Smooth scrolling
- [ ] No jank on mobile
- [ ] Sticky elements (topbar) work

---

## 🔧 BROWSER TESTING

Test on:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Safari iOS (latest)
- [ ] Chrome Android (latest)
- [ ] Edge (latest)

---

## ♿ ACCESSIBILITY CHECKS

- [ ] Tab navigation works
- [ ] Focus indicators visible
- [ ] ARIA labels present
- [ ] Color contrast sufficient (WCAG AA)
- [ ] Screen reader compatible
- [ ] Reduced motion respected

---

## 🐛 COMMON ISSUES TO WATCH

1. **Horizontal scroll** - Usually caused by fixed widths
2. **Tiny touch targets** - Buttons/links should be 44px minimum
3. **Text overflow** - Long titles breaking layout
4. **Image overflow** - Images not scaling
5. **Z-index issues** - Modals/dropdowns behind content
6. **Sticky positioning** - Not working on mobile browsers

---

## ✅ SIGN-OFF

**Tested By:** _________________  
**Date:** _________________  
**Device/Browser:** _________________  

**Status:**
- [ ] Pass — Ready for production
- [ ] Fail — Issues found (document below)

**Issues Found:**
```
1. 
2. 
3. 
```

---

## 🚀 QUICK TEST COMMANDS

```bash
# Start dev server
cd client && npm run dev

# Test at specific viewport
curl -s http://localhost:5173 | head

# Or use browser dev tools:
# 1. Open Chrome DevTools
# 2. Toggle device toolbar (Ctrl+Shift+M)
# 3. Select device preset or enter custom size
# 4. Test each breakpoint
```

---

## 📐 PIXEL-PERFECT CHECKLIST

For each breakpoint, verify:
- [ ] Layout matches design intent
- [ ] No elements overlapping
- [ ] All content visible
- [ ] Consistent alignment
- [ ] Proper spacing between elements
- [ ] Text readable at all sizes
- [ ] Interactive elements accessible
- [ ] No visual glitches
- [ ] Smooth transitions between breakpoints

