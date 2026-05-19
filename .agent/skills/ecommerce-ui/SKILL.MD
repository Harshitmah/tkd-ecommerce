---
name: ecommerce-full-ui
description: >
  Build, design, and generate UI for a complete ecommerce platform — covering
  BOTH the customer-facing storefront AND the merchant admin panel. Use this
  skill whenever the user asks to create, redesign, or improve any page or
  component on either side of an ecommerce system. Storefront triggers include:
  homepage, product listing, product detail, cart, checkout, wishlist, order
  tracking, and account pages. Admin panel triggers include: dashboard,
  analytics, product management, inventory, order management, customer
  management, promotions/coupons, reviews moderation, settings, and staff
  management. Also trigger for partial requests like "add a product card",
  "build an orders table", "make a discount form", "design a checkout page",
  "create a sales chart", or any ecommerce-adjacent UI task. If the user
  mentions an online store, shopping experience, product catalog, cart, admin
  dashboard, or merchant panel in any form — use this skill immediately.
---

# Ecommerce Full UI Skill

A complete design and implementation guide for both sides of a modern ecommerce
platform: the **Storefront** (what customers see) and the **Admin Panel**
(what merchants manage). Every component is documented with anatomy, behavior,
and design notes.

---

## Part 1 — Storefront (Customer-Facing)

---

### 🎨 Brand Persona — Choose One

Commit to a single persona before writing any code:

| Persona | Typography | Colors | Feel |
|---|---|---|---|
| **Luxury / Editorial** | Serif display + light sans | Black, ivory, gold | Spacious, premium |
| **Playful / Youth** | Rounded sans + bold display | Bright primaries, coral, lime | Energetic, fun |
| **Minimal / Modern** | Geometric sans | Neutral grays + 1 accent | Clean, content-first |
| **Warm / Artisan** | Slab serif + humanist sans | Earthy browns, terracotta | Cozy, handcrafted |
| **Tech / Performance** | Monospace + sharp sans | Dark bg, neon accent | Bold, data-driven |

---

### 🧭 Global Navigation

**Desktop Header**
- Logo (left) · Main nav links (center or left) · Search bar · Wishlist icon + count · Cart icon + count · Account avatar/Login
- Sticky on scroll with subtle shadow
- Mega menu for categories: multi-column grid with sub-links and featured image

**Mobile Header**
- Logo (center) · Hamburger (left) · Cart + Wishlist icons (right)
- Slide-in drawer nav: accordion category links, account links, language/currency selector

**Announcement / Promo Strip**
- Full-width above header: "🚚 Free shipping on orders over ₹999 | Use SAVE10"
- Dismissible with ✕, background in brand accent color

**Search**
- Expandable bar or dedicated search page
- Live suggestions: product thumbnails, category links, recent searches
- "No results" state with suggestions

**Footer**
- 4-column grid: About, Shop, Customer Care, Follow Us
- Newsletter signup input + CTA
- Payment method icons row
- Copyright + policy links (Privacy, Terms, Returns)

---

### 🏠 Homepage

**Hero Banner**
- Full-width image/video, overlaid headline + subline + CTA button
- Optional countdown timer for limited offers
- Mobile: stacked (image top, text + CTA below)

**Featured Categories**
- 3–6 cards: image, label, hover overlay with "Shop Now"
- Aspect ratio 4:3 or square per brand

**Product Carousel — Best Sellers / New Arrivals / On Sale**
- Horizontal scroll, arrow controls, dot pagination
- Card: image, name, price, star rating, quick-add button

**Promotional Banner (Mid-page)**
- Split layout: lifestyle image left, headline + offer + CTA right
- Or full-width color block with large type

**Trust Bar**
- 🚚 Free Delivery · 🔄 Easy Returns · 🔒 Secure Payment · ⭐ 4.8 Rated
- Subtle dividers between items

**Brand Story / USP Section**
- 2-column: text (headline, 2-3 paragraphs, CTA) + image

**Testimonials / Reviews Carousel**
- Star rating, review text (3-line clamp), reviewer name + avatar

**Instagram / UGC Grid**
- 6-image grid, each opens lightbox
- "Follow us @brand" CTA below

---

### 🗂️ Category / Product Listing Page (PLP)

**Page Header**
- Breadcrumb: Home › Women › Kurtas
- H1 title + optional description
- Result count: "Showing 48 of 312 products"

**Filter Sidebar (Desktop) / Filter Drawer (Mobile)**
- Price range slider
- Brand checkboxes
- Size toggle chips (S M L XL — OOS chips disabled + strikethrough)
- Color swatches (circle buttons)
- Star rating filter
- "Clear All" link + applied filter chips strip above grid

**Sort Dropdown**
- Relevance · Price ↑ · Price ↓ · Newest · Best Rated · Discount

**Product Grid**
- 4 cols desktop / 3 cols tablet / 2 cols mobile
- **Product Card anatomy:**
  - Image (1:1 or 3:4), lazy-loaded
  - Wishlist ♡ icon top-right (toggleable, filled red when active)
  - Badge top-left: SALE / NEW / HOT / OUT OF STOCK
  - Product name (2-line clamp)
  - Star rating + review count
  - Price: ~~₹2,999~~ **₹1,799** · 40% OFF
  - "Add to Cart" button (hover desktop / always-visible mobile)
  - Quick-view button (hover overlay)

**Pagination / Load More**
- Numbered pages OR "Load More" button with spinner

**Empty State**
- Illustration + "No products found. Try adjusting your filters."

---

### 🛍️ Product Detail Page (PDP)

**Image Gallery**
- Main large image + thumbnail strip (left or bottom)
- Zoom on hover (desktop), pinch-to-zoom (mobile)
- Video thumbnail support
- Fullscreen lightbox

**Product Info Panel**
- Brand name (small, muted)
- Product title H1
- ★★★★½ 4.5 · 128 reviews (anchor to reviews section)
- Price: ~~₹2,999~~ **₹1,799** · 40% OFF (sale color)
- Size selector: chip buttons, OOS chips disabled + strikethrough + "Size Guide" link
- Color selector: swatch circles with tooltip label
- Quantity stepper: [ − ] [ 2 ] [ + ]
- **Add to Cart** (full-width primary CTA)
- **Buy Now** (outlined secondary CTA)
- ♡ Wishlist · 🔗 Share icons
- PIN code delivery estimator → "Arrives in 3–5 days"
- Highlights: ✓ Free Returns ✓ 1-Year Warranty ✓ Genuine Product
- Accordions: Description · Specifications · Reviews · Shipping & Returns

**Sticky Add-to-Cart Bar (Mobile)**
- Appears when main CTA scrolls out of viewport
- Thumbnail + name + price + "Add to Cart" — fixed bottom, full-width

**Related Products**
- "You May Also Like" horizontal carousel

---

### 🛒 Cart

**Cart Drawer (Sidebar)**
- Slides in from right on "Add to Cart"
- Header: "Your Cart (3 items)"
- Line items: image + name + variant + qty stepper + remove + line price
- Subtotal · Discount · Estimated Shipping
- "Proceed to Checkout" (full-width primary)
- "Continue Shopping" text link

**Full Cart Page**
- Line items table (desktop) / stacked cards (mobile)
- Coupon code input + "Apply" button
- Applied coupon chip with ✕ remove
- Order Summary card: Subtotal · Discount · Shipping · Tax · **Total**
- "Checkout" CTA

**Empty Cart State**
- Illustration + "Your cart is empty" + "Start Shopping" CTA

---

### 💳 Checkout Flow

**Step Indicator**
- 3 steps: 🛒 Cart → 📦 Shipping → 💳 Payment

**Step 1 — Shipping**
- Saved addresses (radio cards, logged-in users)
- New address form: Full Name · Email · Phone · Address 1 & 2 · City · State · PIN
- Delivery method: Standard (Free, 5–7 days) / Express (₹99, 2–3 days)

**Step 2 — Payment**
- Options: Credit/Debit Card · UPI · Net Banking · Wallets · Cash on Delivery
- Card form: number (with card brand icon) · cardholder name · expiry · CVV
- "Place Order" CTA with 🔒 SSL secured note

**Order Confirmation**
- ✅ Large checkmark / celebration illustration
- "Thank you, [Name]! Order #ORD-12345 is confirmed."
- Summary: items · total · delivery address · estimated delivery date
- "Track Order" + "Continue Shopping" CTAs
- Email confirmation note

---

### 👤 Customer Account

**Dashboard**
- Welcome banner with name
- Quick stats: Orders · Wishlist items · Reward points
- Recent orders mini-table with "View All" link

**Order History**
- List/table: Order # · Date · Items · Total · Status badge · "View Details" link
- Order Detail: timeline (Placed → Confirmed → Shipped → Delivered), line items, invoice download

**Order Tracking**
- Progress stepper: Placed · Confirmed · Shipped · Out for Delivery · Delivered
- Map embed (optional) showing delivery route

**Wishlist**
- Grid of saved cards (same as PLP cards)
- "Move to Cart" CTA + remove ✕ per item
- Empty state illustration

**Profile & Addresses**
- Edit name, email, phone, password
- Saved addresses: add / edit / delete / set default

**Returns & Refunds**
- Initiate return: select item → reason → pick up or drop-off
- Refund status tracker

---

---

## Part 2 — Admin Panel (Merchant-Facing)

---

### 🎨 Admin Design System

Admin UIs prioritize **clarity, density, and speed** over visual flair.

**Admin Persona — always:**
- Light mode default (dark mode toggle optional)
- Neutral gray background (`#F4F5F7`) with white cards
- Primary accent: brand color (default deep blue `#2563EB`)
- Font: clean geometric sans (e.g. `'DM Sans'`, `'Sora'`, `'Figtree'`)
- Dense data tables, compact form fields, clear action hierarchy
- No decorative elements that distract from workflows

**Admin Layout**
```
┌─────────────────────────────────────────┐
│  Top Bar: Logo · Search · Notif · Avatar │
├──────────┬──────────────────────────────┤
│ Sidebar  │  Main Content Area           │
│ Nav      │  (Page-specific content)     │
│          │                              │
└──────────┴──────────────────────────────┘
```

**Sidebar Navigation**
- Collapsible (icon-only collapsed, icon + label expanded)
- Sections with dividers:
  - 📊 Dashboard
  - 🛍️ Orders
  - 📦 Products · Inventory · Categories · Attributes
  - 👥 Customers
  - 🏷️ Promotions · Coupons · Gift Cards
  - ⭐ Reviews
  - 📣 Marketing · Banners · Email Campaigns
  - 💰 Finance · Payouts · Transactions
  - 📈 Analytics · Reports
  - ⚙️ Settings · Store · Shipping · Tax · Payments · Staff
- Active link: accent background + bold label
- Notification badges on Orders (pending count), Reviews (unread count)

**Top Bar**
- Global search (all entities)
- Notification bell (dropdown: new orders, low stock alerts, new reviews)
- Admin avatar + dropdown: Profile · Switch Store · Logout

---

### 📊 Dashboard

**KPI Cards Row**
- Today's Revenue · Orders Today · New Customers · Avg Order Value
- Each card: metric value (large) · % change vs yesterday (green ↑ / red ↓) · sparkline

**Revenue Chart**
- Line or area chart: daily revenue over last 30 days
- Toggle: 7D · 30D · 90D · 1Y
- Hover tooltip: date, revenue, orders count

**Orders by Status**
- Donut chart: Pending · Processing · Shipped · Delivered · Cancelled · Returned

**Top Selling Products**
- Table: rank · thumbnail · name · units sold · revenue · stock left

**Recent Orders**
- Mini-table: Order # · Customer · Items · Total · Status badge · Time
- "View All Orders" link

**Low Stock Alerts**
- Warning cards: product name · SKU · current stock · reorder threshold
- "Restock" CTA per item

**Geographic Sales Map** (optional)
- India map with state-level sales heat overlay

---

### 🛍️ Orders Management

**Orders List Page**
- Filters: Status · Date range · Payment method · Fulfillment · Search by order # or customer
- Bulk actions: Mark as Shipped · Print Labels · Export CSV
- Table columns: ☐ · Order # · Date · Customer · Items · Total · Payment · Status · Actions
- Status badges: 🟡 Pending · 🔵 Processing · 🟣 Shipped · 🟢 Delivered · 🔴 Cancelled · 🟠 Returned
- Row actions: View · Edit · Print Invoice

**Order Detail Page**
- Header: Order # · Date · Status badge · "Update Status" dropdown
- Timeline: Placed → Payment Confirmed → Packing → Shipped (with tracking #) → Delivered
- Line items: image · name · SKU · variant · qty · unit price · total
- Customer info card: name · email · phone · "View Customer Profile" link
- Shipping address card
- Payment info: method · transaction ID · amount paid
- Notes / internal comments textarea
- Action buttons: Print Invoice · Refund · Cancel Order · Add Tracking

**Shipment & Tracking**
- Courier selection dropdown (Delhivery, Shiprocket, DTDC, etc.)
- Tracking number input
- Estimated delivery date picker
- Auto-notify customer toggle

---

### 📦 Product Management

**Products List Page**
- Filters: Category · Status (Active/Draft/Archived) · Stock · Price range · Search
- Bulk actions: Activate · Deactivate · Delete · Update Category · Export
- Table: ☐ · Image · Name · SKU · Category · Price · Stock · Status · Actions
- Row actions: Edit · Duplicate · Archive · Quick stock edit (inline)

**Add / Edit Product Page**

*Left column (main):*
- Product title input
- Rich text description editor (bold, italic, lists, links, image embed)
- Media gallery: drag-and-drop image upload, reorder, set primary, alt text per image
- Video URL input
- Variants section:
  - Option types: Size / Color / Material (add/remove)
  - Variant table: variant combination · SKU · Price · Compare-at Price · Stock · Weight
- SEO section: Meta title · Meta description · URL slug (auto-generated, editable)

*Right column (sidebar):*
- Status: Active / Draft / Archived (toggle)
- Visibility: Online Store / Hidden
- Category multi-select
- Tags input
- Vendor / Brand
- Product type
- Collections (checkboxes)
- Pricing: Price · Compare-at Price · Cost per item (margin auto-calc)
- Inventory: SKU · Barcode · Track quantity toggle · Allow oversell toggle · Stock qty
- Shipping: Weight · Dimensions · Free shipping toggle
- Publish date/time picker

**Categories Page**
- Tree view: parent > child > grandchild with drag-to-reorder
- Add/edit modal: name · slug · parent · image · description · meta fields

**Attributes & Options**
- Manage global attribute sets: Size charts, Color swatches (hex + label), Material list

---

### 📋 Inventory Management

**Inventory Overview**
- Stock status summary: In Stock · Low Stock · Out of Stock · counts
- Filter by: Location · Category · Status
- Table: Product · SKU · Variant · Current Stock · Reserved · Available · Reorder Point · Actions
- Inline edit stock qty
- "Update Stock" bulk import via CSV

**Stock Alerts**
- Configurable thresholds per product or category
- Alert log: product · SKU · triggered at · current stock · action taken

**Purchase Orders** (optional)
- Create PO: supplier · items · qty · expected date
- PO list: PO # · Supplier · Items · Total · Status · Expected Date

---

### 👥 Customer Management

**Customers List**
- Search by name / email / phone
- Filters: Registered date · Total orders · LTV · Tags
- Table: Name · Email · Phone · Orders · Total Spent · Joined · Status · Actions

**Customer Detail Page**
- Profile card: avatar · name · email · phone · registration date · last order
- Order history table
- Wishlist items
- Address book
- Notes (internal tag textarea)
- Actions: Send Email · Suspend Account · Delete Account · Add Store Credit

**Customer Segments / Groups**
- Create segments: VIP (LTV > ₹10,000) · New (< 30 days) · At-Risk (no order 90+ days)
- Segment-based bulk email / discount targeting

---

### 🏷️ Promotions & Coupons

**Discounts List**
- Table: Code · Type · Value · Usage · Min Order · Expiry · Status · Actions

**Create / Edit Discount**
- Code input (auto-generate button)
- Discount type: Percentage / Fixed Amount / Free Shipping / Buy X Get Y
- Value input
- Applies to: All products / Specific products / Specific categories
- Conditions: Minimum order value · Minimum qty · Customer eligibility (all / specific / first-time)
- Usage limits: Total uses · Per customer
- Validity: Start date + End date date-time pickers
- Active toggle

**Automatic Discounts**
- Rules-based: "10% off orders above ₹1,000" applied without code entry

**Gift Cards**
- Issue gift card: value · recipient email · expiry · custom message
- Gift card balance lookup

---

### ⭐ Reviews & Ratings

**Reviews List**
- Filters: Rating (1–5 stars) · Status (Published / Pending / Rejected) · Date · Product
- Table: Product · Reviewer · Rating · Review excerpt · Date · Status · Actions
- Bulk: Approve · Reject · Delete

**Review Detail**
- Full review text
- Reviewer info + purchase verification badge
- Admin reply textarea
- Status toggle: Publish / Reject

---

### 📣 Marketing

**Banners & Sliders**
- Create banner: image upload · link URL · start/end date · placement (homepage hero, category top, etc.)
- Sort/reorder active banners via drag

**Email Campaigns** (basic)
- Template selector: Promotional · Abandoned Cart · Back in Stock · Order Update
- Recipient: All customers / Segment
- Subject line · Preview text · Body (rich text or HTML)
- Schedule or send immediately

**Push Notifications** (optional)
- Title · Body · Image · CTA link · Target segment · Schedule

---

### 💰 Finance

**Transactions**
- Table: Date · Order # · Amount · Payment Method · Gateway · Status · Refunds

**Payouts** (for marketplace)
- Vendor payout schedule and history

**Refunds**
- Initiate refund from order: full or partial · reason · refund to original method or store credit
- Refund log: Order # · Customer · Amount · Reason · Date · Status

---

### 📈 Analytics & Reports

**Sales Report**
- Date range picker · Group by: Day / Week / Month
- Line chart: Revenue over time
- Bar chart: Revenue by category
- Table: date · orders · revenue · avg order value · returns

**Product Performance**
- Table: product · views · add-to-carts · purchases · conversion rate · revenue
- Sort by any column

**Customer Report**
- New vs returning customers over time
- Customer lifetime value distribution
- Cohort retention table

**Traffic Sources** (if integrated with GA/GTM)
- Pie chart: Organic · Direct · Social · Paid · Email

**Export**
- All reports exportable as CSV or PDF

---

### ⚙️ Settings

**Store Settings**
- Store name · Logo upload · Favicon · Contact email · Phone · Address
- Currency · Timezone · Language · Date format

**Shipping Settings**
- Zones: add zones by state/PIN range
- Methods per zone: Flat rate / Free / Weight-based / Carrier-calculated
- Carrier integrations: Delhivery · Shiprocket · India Post

**Tax Settings**
- GST configuration: CGST / SGST / IGST by product category
- HSN code mapping
- Tax-inclusive pricing toggle

**Payment Settings**
- Enable/disable gateways: Razorpay · PayU · Cashfree · Stripe · COD
- Gateway API key fields (masked)
- COD availability by PIN range

**Email & Notifications**
- Template editor for transactional emails: Order Confirmed · Shipped · Delivered · Cancelled · Refund
- SMTP configuration

**Staff & Roles**
- Staff list: name · email · role · last login · status
- Roles: Super Admin · Store Manager · Order Manager · Catalog Manager · Support
- Permission matrix per role (view/edit/delete per module)
- Invite staff by email

**Store Policies**
- Rich text editors: Return Policy · Privacy Policy · Terms of Service · Shipping Policy
- Published to footer links automatically

---

## Design Tokens

### Storefront Tokens (Customer Side)
```css
:root {
  --sf-primary:       #1A1A2E;
  --sf-accent:        #E94560;
  --sf-bg:            #F7F7F9;
  --sf-surface:       #FFFFFF;
  --sf-border:        #E2E2E8;
  --sf-text:          #1A1A2E;
  --sf-text-muted:    #6B6B80;
  --sf-sale:          #E94560;
  --sf-success:       #22C55E;
  --sf-font-display:  'Playfair Display', Georgia, serif;
  --sf-font-body:     'DM Sans', system-ui, sans-serif;
  --sf-radius-card:   12px;
  --sf-shadow-card:   0 2px 8px rgba(0,0,0,0.07);
}
```

### Admin Panel Tokens (Merchant Side)
```css
:root {
  --adm-primary:       #2563EB;
  --adm-primary-dark:  #1D4ED8;
  --adm-bg:            #F4F5F7;
  --adm-surface:       #FFFFFF;
  --adm-sidebar-bg:    #1E2432;
  --adm-sidebar-text:  #CBD5E1;
  --adm-sidebar-active:#2563EB;
  --adm-border:        #E5E7EB;
  --adm-text:          #111827;
  --adm-text-muted:    #6B7280;
  --adm-success:       #16A34A;
  --adm-warning:       #D97706;
  --adm-error:         #DC2626;
  --adm-info:          #0284C7;
  --adm-font:          'DM Sans', system-ui, sans-serif;
  --adm-radius:        8px;
  --adm-shadow:        0 1px 3px rgba(0,0,0,0.08);
}
```

---

## Responsive Breakpoints
```
Mobile:   < 640px
Tablet:   640px – 1024px
Desktop:  > 1024px
Wide:     > 1280px  (admin panels benefit from extra columns)
```

---

## Implementation Notes

- **Currency**: Default ₹ INR · Format: `₹1,799` (no decimals for whole amounts)
- **Placeholder images**: `https://picsum.photos/seed/{id}/{w}/{h}` — use consistent seeds per product
- **Framework**: Plain HTML/CSS/JS for static mockups · React JSX for interactive components
- **Charts**: Use `recharts` (React) or `Chart.js` (HTML) for admin analytics
- **Icons**: Lucide icons (`lucide-react`) for admin · custom SVGs or emoji for storefront accents
- **Animations (Storefront)**: Card hover lift · Add-to-cart pulse · Drawer slide · Fade-in on load
- **Animations (Admin)**: Subtle transitions only · No decorative animations · Skeleton loaders for tables

---

## Quick-Start Checklist

Before building any component, confirm:

- [ ] Which side? **Storefront** or **Admin Panel**
- [ ] Which page/component exactly?
- [ ] Brand persona (storefront) or default admin style?
- [ ] Define / reuse design tokens
- [ ] Build layout structure
- [ ] Add realistic placeholder data (Indian names, ₹ prices, Indian cities)
- [ ] Handle all states: empty · loading skeleton · error · success
- [ ] Interaction states: hover · active · focus · disabled · OOS
- [ ] Mobile-responsive
- [ ] Accessibility: contrast · focus rings · ARIA labels
- [ ] Micro-animations for key actions
