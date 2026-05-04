# Plan: Executive Presentation — VLookup Cloud for MRS Oil Nigeria Plc

## Deliverable
A downloadable, professionally designed `.pptx` file (~14 slides) tailored to an oil & gas downstream audience, exported to `/mnt/documents/vlookup_cloud_mrs_oil.pptx`.

## Design direction
- **Palette**: "Midnight Executive" — deep navy (#1E2761) dominant, ice blue (#CADCFC) supporting, gold accent (#F2A900) tied to MRS Oil's brand energy.
- **Typography**: Georgia headers, Calibri body. Title slides dark; content slides light (sandwich structure).
- **Motif**: Thin gold left-border stripe + numbered icon circles repeated across slides.
- **Every slide has a visual element** (stat callouts, comparison columns, process flow, icon rows). No plain bullet lists.

## Slide outline
1. **Cover** — "VLookup Cloud" / tagline / "Prepared for MRS Oil Nigeria Plc"
2. **The reality of reconciliation today** — pain stats (hours lost, error rates, version chaos)
3. **What VLookup Cloud is** — one-line definition + 3 pillars (Lookup • Clean • Insight)
4. **Why it beats traditional Excel** — side-by-side comparison table (speed, scale, errors, security, AI, collaboration)
5. **Core features** — 6-tile grid: Bulk VLOOKUP, Text Cleaning, Search & Replace, Data Audit, Trend Analysis, AI Column Mapping
6. **Privacy & security** — client-side processing, no data leaves browser, auth-gated dashboard, audit logs
7. **Use case 1 — Fleet operations** — reconciling truck dispatch logs vs depot loadings vs station receipts; detect short-deliveries, duplicate trips
8. **Use case 2 — Stock reconciliation** — wet stock vs book stock across depots/stations; variance flagging, dip readings vs sales
9. **Use case 3 — Accounting & finance** — bank vs ledger, customer payments vs invoices, intercompany reconciliations
10. **Use case 4 — Procurement & vendor reconciliation** — PO vs GRN vs invoice three-way match
11. **AI-powered insights** — plain-English trend headlines (seasonality, growth, anomalies) on uploaded data
12. **Workflow** — 4-step process flow: Upload → Map → Reconcile → Export/Insight
13. **ROI for MRS** — quantified callouts (time saved, error reduction, faster month-end close)
14. **Next steps & CTA** — pilot proposal, contacts, closing

## Technical approach
- Use `pptxgenjs` (npm install local to `/tmp`) to generate the deck programmatically.
- Embed icons as Unicode glyphs / shape-based circles (no external image deps).
- After generation: convert to PDF via LibreOffice, render each slide to JPG with `pdftoppm`, visually inspect every slide for overflow/overlap/contrast, fix issues, re-render until clean.
- Deliver via `<lov-artifact>` tag.

## Files
- Script: `/tmp/build_mrs_deck.js` (throwaway)
- Output: `/mnt/documents/vlookup_cloud_mrs_oil.pptx`

Approve and I'll build it.
