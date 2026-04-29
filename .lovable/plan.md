# Plan: Add Trend Analysis to VLookup Cloud

## Goal
Add a 5th tab — **Trends** — that lets users analyze any uploaded spreadsheet for time-series patterns, value distributions, summary statistics, and AI-generated plain-English insights. All numeric/chart computation runs client-side; only the AI summary uses an edge function.

## What the user gets

A new **Trends** tab next to VLOOKUP / Text & Clean / Search-Replace / Data Audit, containing:

1. **File upload** (reuses `SharedFileUpload`)
2. **Auto-detected column types**: Dates, Numerics, Categoricals are detected and shown as chips
3. **Summary Statistics card** — table of every numeric column with: count, missing, min, max, mean, median, std dev, sum
4. **Time-Series chart** — pick a date column + a numeric column → line chart of values over time (with optional aggregation: sum / mean / count, grouped by day / month / year)
5. **Distribution chart** — pick any column → bar chart of top 10 values by frequency
6. **AI Insights panel** — "Analyze Trends" button calls a new edge function that returns 3–6 plain-English bullet points (e.g. *"Revenue grew 23% from Jan to Mar"*, *"Customer churn doubled in Week 12"*, *"Region 'West' accounts for 42% of orders"*)
7. **Export** — download the summary stats table as CSV

## Files to create

### `src/lib/trendTools.ts`
Pure client-side helpers:
- `detectColumnTypes(data)` → `{ dates: string[], numerics: string[], categoricals: string[] }`. Heuristic: a column is numeric if ≥80% of non-empty values parse as finite numbers; date if ≥80% parse as valid `Date`; otherwise categorical.
- `computeSummaryStats(data, numericColumns)` → array of `{ column, count, missing, min, max, mean, median, stdDev, sum }`
- `buildTimeSeries(data, dateCol, valueCol, aggregation, granularity)` → `[{ date: string, value: number }]` sorted ascending, grouped by day/month/year
- `buildDistribution(data, column, topN = 10)` → `[{ value: string, count: number }]` sorted descending
- `summarizeForAI(data, types, stats)` → compact JSON payload (≤ ~3KB) sent to the edge function: column types, sample rows, summary stats, top distributions, time-series deltas

### `src/components/TrendsTab.tsx`
- Reuses `SharedFileUpload`, `ColumnSelector`, `Card`, `Button`, `Input`, `Tabs` from existing UI kit
- Uses `recharts` (already a Lovable default dep) for `LineChart` and `BarChart`
- State: `data`, `fileName`, `types`, `dateCol`, `valueCol`, `aggregation`, `granularity`, `distCol`, `aiInsights`, `isAiLoading`
- Layout mirrors `DataAuditTab.tsx` — instructions card on top, then tool cards
- Tracks usage via `usage_analytics` (`action_type: 'trend_analysis'` and `'ai_insights'`)

### `supabase/functions/analyze-trends/index.ts`
- Receives the compact summary payload from `summarizeForAI`
- Calls Lovable AI Gateway with `google/gemini-3-flash-preview`
- Uses **tool-calling for structured output** (not free-form JSON parsing) — returns `{ insights: string[], headline: string }`
- Handles 429 / 402 errors with explicit user-facing messages
- CORS headers; deployed automatically; `verify_jwt` left at default

### `src/pages/Index.tsx` (edit)
- Import `TrendsTab` and a `TrendingUp` icon
- Change `TabsList` from `grid-cols-4` to `grid-cols-5`
- Add 5th `TabsTrigger value="trends"` and `TabsContent value="trends"`

## Technical details

- **Date parsing**: try `Date.parse()` first, then a few common formats (`YYYY-MM-DD`, `MM/DD/YYYY`, `DD/MM/YYYY`); skip Excel serial date oddities by accepting only sane year ranges (1900–2100)
- **Numeric parsing**: strip `$`, `,`, `%`, whitespace before `parseFloat`
- **Performance**: all stats computed in single passes; no external libs needed beyond `recharts`
- **Privacy**: raw data never leaves the browser. The AI edge function only receives **aggregated summaries** (column names, types, stats, top-10 distributions, sampled time-series points) — consistent with the existing client-side privacy rule
- **AI payload size cap**: trim to top 10 distribution values per categorical column and downsample time-series to ≤50 points before sending

## Out of scope (can add later)
- Correlation matrix between numeric columns
- Outlier flagging
- Forecasting / prediction
- Multi-series overlay charts
- Saving insights to the user's account

## Result
A complete trend analysis tool: charts, statistics, and AI-generated insights — all consistent with the app's existing tab pattern, privacy model, and visual style.