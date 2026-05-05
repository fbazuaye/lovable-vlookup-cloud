## Problem

In the Trends tab, "Pick date column" appears unclickable because the dropdown is **empty** — no columns were detected as dates, so there is nothing to select. Two causes:

1. **Excel parsing**: `XLSX.read` is called without `cellDates: true`, so date cells in the synthetic logistics file come through as raw Excel **serial numbers** (e.g. `45627`). These pass `parseNumber()` and get classified as **Numeric**, never **Date**.
2. **Detection priority**: in `detectColumnTypes`, a column is only labeled a date when `dateRatio >= 0.8 AND numRatio < 0.95`. Excel serials satisfy both number and date, but the numeric guard wins, so date columns are misclassified.

## Fix

**1. `src/components/SharedFileUpload.tsx`** — parse Excel with real dates:
- Pass `{ type: "array", cellDates: true }` to `XLSX.read`.
- Pass `{ raw: false, dateNF: "yyyy-mm-dd" }` to `sheet_to_json` so date cells become `Date` objects / ISO strings instead of serial numbers.

**2. `src/lib/trendTools.ts`** — make date detection win when appropriate:
- In `parseDate`, also handle Excel serial numbers: if `v` is a finite number between ~20000 and ~60000, convert via `new Date(Date.UTC(1899,11,30) + v*86400000)`.
- In `detectColumnTypes`, change the rule to: if `dateRatio >= 0.8` **and** the column header looks date-ish (`/date|day|month|time|period/i`) OR values are non-integer-looking strings with separators, classify as **date** even when `numRatio` is also high. Concretely: prefer date when `dateRatio >= 0.8` and either (a) header matches the date regex, or (b) at least one sampled value is a `Date` instance / contains `-` or `/`.

**3. `src/components/TrendsTab.tsx`** — graceful fallback:
- If `types.dates.length === 0`, pass `allColumns` to the Date column `ColumnSelector` (instead of an empty list) and show a small hint: "No date columns auto-detected — pick manually". This guarantees the dropdown is never empty when data is loaded.

## Verification
- Re-upload `vlookup_cloud_synthetic_logistics.xlsx`; `Date` (Dispatch_Log, Stock_Recon) and `Month` (Sales_Monthly) should appear under **Detected Column Types → Dates** and inside the "Pick date column" dropdown.
- Time-series chart renders when paired with `Delivered_Litres`, `Revenue_NGN`, etc.

No DB or auth changes.