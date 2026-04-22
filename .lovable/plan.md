
# Plan: Allow VLOOKUP to Return 2–3 Columns

## Goal
Yes — the VLOOKUP tool can be upgraded so users can return multiple columns from Table B instead of only one. This would let someone match on one column, then bring back 2 or 3 related fields in the results.

Example:
```text
Lookup by: Product ID
Return: Product Name, Price, Category
```

## What will change

### 1. Replace single “Return Column” selection with multi-column selection
In the VLOOKUP tab, the current field:

```text
Return Column (Table B)
```

will become:

```text
Return Columns (Table B)
Select up to 3 columns
```

Users will be able to choose multiple return columns from Table B.

### 2. Limit return columns to 3
To keep the interface simple and prevent messy exports, the selection will allow:
- Minimum: 1 return column
- Maximum: 3 return columns

If a user tries to select more than 3, the app will show a friendly message such as:

```text
You can select up to 3 return columns.
```

### 3. Update bulk VLOOKUP results
The bulk lookup output will include all selected return columns.

Example output:
```text
Customer ID | Order ID | Product ID | Product Name | Price | Category
```

If a match is not found, each selected return column will show:

```text
N/A
```

### 4. Update single lookup results
Single value lookup will also return the selected columns.

Example:
```text
Lookup Value: P-1001
Product Name: Laptop Stand
Price: 29.99
Category: Accessories
```

The success message will be adjusted so it does not become too long when multiple fields are returned.

### 5. Update AI column suggestion support
The existing AI suggestion currently returns one suggested return column. I will update the frontend logic to support multiple return columns safely:
- If AI returns one return column, the app will use it as normal
- If AI later returns multiple return columns, the app will use up to 3
- The current AI function can remain backward-compatible

### 6. Update the “How to Use VLOOKUP” instructions
The instructions under the VLOOKUP tab will be updated to say users can select up to 3 return columns from Table B.

## Technical approach

### Files to update
- `src/lib/vlookup.ts`
- `src/pages/Index.tsx`
- `src/components/LookupForm.tsx` if needed for disabled-state wording
- Add or adapt a multi-select UI using existing UI components

### Data logic changes
The current VLOOKUP utility accepts:

```ts
returnColumn: string
```

It will be updated to support:

```ts
returnColumns: string[]
```

Bulk lookup will append all selected return fields to each row.

Single lookup will return an object containing all selected return fields instead of a single string.

### UI logic changes
The state in `Index.tsx` will change from:

```ts
const [returnColumn, setReturnColumn] = useState<string>("");
```

to:

```ts
const [returnColumns, setReturnColumns] = useState<string[]>([]);
```

The VLOOKUP button will be enabled only when:
- Table A is uploaded
- Table B is uploaded
- Lookup column is selected
- Match column is selected
- At least one return column is selected

## Result
Users will be able to perform a VLOOKUP and return 1, 2, or 3 columns from the matched row, making the tool more useful than Excel’s standard VLOOKUP without requiring formulas.
