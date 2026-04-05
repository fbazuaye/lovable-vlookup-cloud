

# Plan: Add Data Tools Suite (Text Cleaning, Search & Replace, Data Auditing)

## Overview

Expand VLookup Cloud from a single-purpose VLOOKUP tool into a multi-tool data utility platform. The new features will be organized as **tabs** on the main page, keeping the current VLOOKUP as the default tab while adding three new tool categories from your document.

## UI Design

The main page will get a **tabbed interface** below the header:

```text
┌─────────────┬──────────────────┬──────────────────┬─────────────────┐
│  🔍 VLOOKUP │  🧹 Text & Clean │  🔄 Search/Replace│  📊 Data Audit  │
│  (current)  │                  │                   │                 │
└─────────────┴──────────────────┴──────────────────┴─────────────────┘
```

Each tab shares the same file upload area (single file for tools that operate on one dataset). Results display in the same table preview component with export capability.

### Tab 1: VLOOKUP (existing, unchanged)
Current two-file lookup workflow stays as-is.

### Tab 2: Text & Clean
Single file upload. User picks a column, then applies operations:
- **CLEAN** — Strip non-printable characters
- **TRIM** — Remove leading/trailing/excess spaces
- **TEXT** — Format numbers/dates (e.g., pad zeros, date format picker)
- **PROPER / UPPER / LOWER** — Case conversion buttons

UI: Column selector + action buttons in a toolbar. Preview shows before/after.

### Tab 3: Search & Replace
Single file upload. User picks a column:
- **REPLACE** — Position-based text replacement (start position, length, new text)
- **SUBSTITUTE** — Find & replace specific text/characters
- **REMOVE ZEROS** — Toggle to strip leading zeros or all zeros

UI: Input fields for find/replace values + action button. Live preview of changes.

### Tab 4: Data Audit
Single file upload. User picks a column:
- **DUPLICATES** — Flag/highlight duplicate values, show count
- **COUNT / COUNTIF** — Count occurrences of each value (frequency table)
- **UNIQUE** — Extract distinct values only

UI: Column selector + operation picker. Results show as a summary table.

## Technical Approach

### New files to create:
1. **`src/lib/textTools.ts`** — Pure functions: clean, trim, textFormat, proper, upper, lower, replace, substitute, removeZeros
2. **`src/lib/auditTools.ts`** — Pure functions: findDuplicates, countValues, countIf, extractUnique
3. **`src/components/TextCleanTab.tsx`** — UI for text cleaning operations
4. **`src/components/SearchReplaceTab.tsx`** — UI for search & replace operations
5. **`src/components/DataAuditTab.tsx`** — UI for duplicate/count/unique operations
6. **`src/components/SharedFileUpload.tsx`** — Reusable single-file upload for the new tabs

### Modified files:
- **`src/pages/Index.tsx`** — Add tab navigation (using existing shadcn Tabs component), wrap current VLOOKUP content in Tab 1, render new tab components
- **`src/lib/vlookup.ts`** — No changes needed

### Design principles:
- Reuse existing components (FileUpload, TablePreview, ColumnSelector, Button, Card)
- All processing stays client-side (no backend needed)
- Each operation produces exportable CSV results
- Consistent card-based layout matching current design
- Mobile-responsive tab layout (scrollable tabs on small screens)
- Track usage analytics per tool type

## Implementation Order
1. Create utility function libraries (textTools.ts, auditTools.ts)
2. Build the three new tab components
3. Integrate tabs into Index.tsx
4. Test end-to-end with sample data

