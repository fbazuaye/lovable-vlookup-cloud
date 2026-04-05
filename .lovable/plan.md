

# Plan: Professional Landing Page with Gated Tool Access

## Overview

Create a public marketing landing page at `/` that promotes VLookup Cloud's features and encourages free account creation. Move the actual tools behind authentication to a new `/dashboard` route. Users who aren't signed in see the landing page; signed-in users go straight to the dashboard.

## UI Design

### Landing Page (`/` — unauthenticated)

```text
┌──────────────────────────────────────────────────┐
│  [Logo]  VLookup Cloud          [Sign In] [Dark] │
├──────────────────────────────────────────────────┤
│                                                  │
│   Hero Section                                   │
│   "AI Data Lookup & Smart Spreadsheet Assistant"  │
│   Tagline + [Create Free Account] CTA button     │
│                                                  │
├──────────────────────────────────────────────────┤
│                                                  │
│   Feature Cards (4 columns on desktop)           │
│   ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐   │
│   │VLOOKUP │ │Text &  │ │Search &│ │ Data   │   │
│   │        │ │Clean   │ │Replace │ │ Audit  │   │
│   └────────┘ └────────┘ └────────┘ └────────┘   │
│                                                  │
├──────────────────────────────────────────────────┤
│   "Why Create a Free Account?" Section           │
│   • Unlimited lookups  • Export results           │
│   • AI-powered suggestions  • All tools free      │
│                                                  │
├──────────────────────────────────────────────────┤
│   Final CTA: [Get Started Free]                  │
│                                                  │
├──────────────────────────────────────────────────┤
│   Footer: © LiveGig Ltd · Privacy Policy          │
└──────────────────────────────────────────────────┘
```

### Dashboard (`/dashboard` — authenticated only)
The current Index.tsx tool interface moves here, unchanged.

### Routing Logic
- `/` → If logged in, redirect to `/dashboard`. If not, show landing page.
- `/dashboard` → If not logged in, redirect to `/auth`.

## Technical Approach

### New files:
1. **`src/pages/Landing.tsx`** — Professional marketing landing page with hero, feature cards, benefits section, and CTA buttons linking to `/auth`
2. **`src/pages/Dashboard.tsx`** — Rename/move current `Index.tsx` content here, add auth guard

### Modified files:
- **`src/App.tsx`** — Add `/dashboard` route, update `/` to render Landing page
- **`src/pages/Index.tsx`** — Convert to a router that checks auth state: if authenticated → redirect to `/dashboard`, if not → render Landing

### Design principles:
- Reuse existing color palette (indigo/emerald gradient), Card components, and branding
- Professional hero with logo, clear value proposition, prominent CTA buttons
- Feature cards with icons matching the tab icons (Search, FileText, BarChart3)
- Benefits section with checkmarks explaining why to sign up
- Mobile-responsive throughout
- Footer with branding and privacy policy link

## Implementation Order
1. Create Landing.tsx with full marketing page
2. Create Dashboard.tsx (move tool UI from Index.tsx)
3. Update App.tsx routing
4. Update Index.tsx as auth-aware router
5. Update Auth.tsx to redirect to `/dashboard` after login

