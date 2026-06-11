import { useEffect, useMemo, useState } from "react";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { FileUpload } from "@/components/FileUpload";
import { TablePreview } from "@/components/TablePreview";
import { ColumnSelector } from "@/components/ColumnSelector";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, Plus, Trash2, GitMerge, InfoIcon } from "lucide-react";
import { toast } from "sonner";
import { convertToCSV } from "@/lib/vlookup";

type JoinKind = "left" | "inner" | "right" | "full";

interface KeyPair {
  left: string;
  right: string;
}

const MAX_KEYS = 5;

const normalizeRows = (rows: any[]): Record<string, any>[] => {
  if (!Array.isArray(rows)) return [];
  return rows
    .filter((r) => r && typeof r === "object" && !Array.isArray(r))
    .map((row) => {
      const out: Record<string, any> = {};
      const used = new Set<string>();
      Object.entries(row).forEach(([raw, val], i) => {
        if (raw === "__parsed_extra") return;
        const base = String(raw ?? "").trim() || `Column ${i + 1}`;
        let final = base;
        let c = 2;
        while (used.has(final)) final = `${base} (${c++})`;
        used.add(final);
        out[final] = val;
      });
      return out;
    })
    .filter((r) => Object.keys(r).length > 0);
};

const normKey = (v: any) =>
  v === null || v === undefined ? "" : String(v).trim().toLowerCase();

const buildCompositeKey = (row: Record<string, any>, cols: string[]) =>
  cols.map((c) => normKey(row[c])).join("\u0001");

export const MergeTab = () => {
  const [tableA, setTableA] = useState<Record<string, any>[]>([]);
  const [tableB, setTableB] = useState<Record<string, any>[]>([]);
  const [fileA, setFileA] = useState("");
  const [fileB, setFileB] = useState("");
  const [keys, setKeys] = useState<KeyPair[]>([{ left: "", right: "" }]);
  const [join, setJoin] = useState<JoinKind>("left");
  const [returnCols, setReturnCols] = useState<string[]>([]);
  const [results, setResults] = useState<Record<string, any>[]>([]);

  const colsA = useMemo(() => (tableA[0] ? Object.keys(tableA[0]) : []), [tableA]);
  const colsB = useMemo(() => (tableB[0] ? Object.keys(tableB[0]) : []), [tableB]);

  // Default selection: all B columns except those used as right keys
  const rightKeyCols = useMemo(
    () => new Set(keys.map((k) => k.right).filter(Boolean)),
    [keys],
  );
  const availableReturnCols = useMemo(
    () => colsB.filter((c) => !rightKeyCols.has(c)),
    [colsB, rightKeyCols],
  );
  // Auto-init returnCols when Table B loads / keys change
  useMemo(() => {
    if (!colsB.length) return;
    setReturnCols((prev) => {
      const valid = prev.filter((c) => availableReturnCols.includes(c));
      if (valid.length === 0 && prev.length === 0) return availableReturnCols;
      return valid;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [colsB, availableReturnCols.join("|")]);

  const toggleReturnCol = (col: string) => {
    setReturnCols((prev) =>
      prev.includes(col) ? prev.filter((c) => c !== col) : [...prev, col],
    );
  };

  const handleFile = (file: File, which: "A" | "B") => {
    const isExcel = /\.(xlsx|xls)$/i.test(file.name);
    const apply = (rows: any[]) => {
      const norm = normalizeRows(rows);
      if (!norm.length) {
        toast.error("No valid rows found");
        return;
      }
      if (which === "A") {
        setTableA(norm);
        setFileA(file.name);
      } else {
        setTableB(norm);
        setFileB(file.name);
      }
      toast.success(`Table ${which} loaded: ${norm.length} rows`);
    };

    if (isExcel) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const arr = new Uint8Array(e.target?.result as ArrayBuffer);
          const wb = XLSX.read(arr, { type: "array", cellDates: true });
          const sheet = wb.Sheets[wb.SheetNames[0]];
          apply(XLSX.utils.sheet_to_json(sheet, { raw: false, dateNF: "yyyy-mm-dd" }));
        } catch (err: any) {
          toast.error(`Error parsing Excel: ${err.message}`);
        }
      };
      reader.readAsArrayBuffer(file);
      return;
    }
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (r) => apply(r.data as any[]),
      error: (err) => toast.error(`Error parsing CSV: ${err.message}`),
    });
  };

  const addKey = () => {
    if (keys.length >= MAX_KEYS) return;
    setKeys([...keys, { left: "", right: "" }]);
  };
  const removeKey = (i: number) => {
    if (keys.length === 1) return;
    setKeys(keys.filter((_, idx) => idx !== i));
  };
  const updateKey = (i: number, side: "left" | "right", value: string) => {
    setKeys(keys.map((k, idx) => (idx === i ? { ...k, [side]: value } : k)));
  };

  const performMerge = () => {
    if (!tableA.length || !tableB.length) {
      toast.error("Please upload both tables");
      return;
    }
    const validKeys = keys.filter((k) => k.left && k.right);
    if (!validKeys.length) {
      toast.error("Select at least one matching field on both sides");
      return;
    }

    const leftKeys = validKeys.map((k) => k.left);
    const rightKeys = validKeys.map((k) => k.right);

    // Build index of B by composite key (array for multiple matches)
    const indexB = new Map<string, Record<string, any>[]>();
    tableB.forEach((row) => {
      const key = buildCompositeKey(row, rightKeys);
      const bucket = indexB.get(key);
      if (bucket) bucket.push(row);
      else indexB.set(key, [row]);
    });

    // Track which B rows were matched (for right/full join)
    const matchedB = new Set<string>();

    // Only include user-selected B columns (Power Query "expand" step)
    const selectedB = returnCols.length ? returnCols : availableReturnCols;

    // Suffix B columns that collide with A columns
    const aColSet = new Set(colsA);
    const collidingCols = new Set<string>();
    selectedB.forEach((c) => {
      if (aColSet.has(c)) collidingCols.add(c);
    });
    const renameB = (col: string) => (collidingCols.has(col) ? `${col} (B)` : col);

    const emptyA = Object.fromEntries(colsA.map((c) => [c, ""]));
    const emptyB = Object.fromEntries(selectedB.map((c) => [renameB(c), ""]));

    const merged: Record<string, any>[] = [];

    tableA.forEach((aRow) => {
      const key = buildCompositeKey(aRow, leftKeys);
      const matches = indexB.get(key);
      if (matches && matches.length) {
        matchedB.add(key);
        matches.forEach((bRow) => {
          const out: Record<string, any> = { ...aRow };
          selectedB.forEach((c) => {
            out[renameB(c)] = bRow[c];
          });
          merged.push(out);
        });
      } else if (join === "left" || join === "full") {
        merged.push({ ...aRow, ...emptyB });
      }
    });

    if (join === "right" || join === "full") {
      tableB.forEach((bRow) => {
        const key = buildCompositeKey(bRow, rightKeys);
        if (matchedB.has(key)) return;
        const out: Record<string, any> = { ...emptyA };
        selectedB.forEach((c) => {
          out[renameB(c)] = bRow[c];
        });
        merged.push(out);
      });
    }

    setResults(merged);
    toast.success(`Merge complete: ${merged.length} rows`);
  };

  const handleExport = () => {
    if (!results.length) {
      toast.error("No results to export");
      return;
    }
    const csv = convertToCSV(results);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "merge-results.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Results exported");
  };

  const canMerge =
    tableA.length > 0 &&
    tableB.length > 0 &&
    keys.some((k) => k.left && k.right);

  return (
    <div>
      <Card className="p-6 mb-8 bg-primary/5 border-primary/20">
        <div className="flex items-start gap-3">
          <InfoIcon className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-foreground mb-3">Power Query Merge</h3>
            <p className="text-sm text-muted-foreground mb-2">
              Combine two tables that do not share a single unique key. Match on
              up to <strong>5 field pairs</strong> (e.g. Date + Depot + Product)
              to build a composite key — just like Power Query's Merge in Excel.
            </p>
            <ol className="space-y-1 text-sm text-muted-foreground list-decimal list-inside">
              <li>Upload Table A (left) and Table B (right).</li>
              <li>Add up to 5 matching field pairs.</li>
              <li>Pick a join type (Left, Inner, Right, Full).</li>
              <li>Run merge and export as CSV.</li>
            </ol>
          </div>
        </div>
      </Card>

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <div className="bg-card rounded-xl p-6 border border-border shadow-soft">
          <h2 className="text-xl font-semibold mb-4 text-foreground flex items-center gap-2">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm font-bold">
              1
            </span>
            Table A (Left)
          </h2>
          <FileUpload
            onFileUpload={(f) => handleFile(f, "A")}
            label="Upload Table A"
            fileName={fileA}
          />
          {tableA.length > 0 && <TablePreview data={tableA} title="Preview" maxRows={3} />}
        </div>
        <div className="bg-card rounded-xl p-6 border border-border shadow-soft">
          <h2 className="text-xl font-semibold mb-4 text-foreground flex items-center gap-2">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm font-bold">
              2
            </span>
            Table B (Right)
          </h2>
          <FileUpload
            onFileUpload={(f) => handleFile(f, "B")}
            label="Upload Table B"
            fileName={fileB}
          />
          {tableB.length > 0 && <TablePreview data={tableB} title="Preview" maxRows={3} />}
        </div>
      </div>

      {tableA.length > 0 && tableB.length > 0 && (
        <div className="bg-card rounded-xl p-6 border border-border shadow-soft mb-8">
          <h2 className="text-xl font-semibold mb-6 text-foreground flex items-center gap-2">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm font-bold">
              3
            </span>
            Matching Fields ({keys.length}/{MAX_KEYS})
          </h2>

          <div className="space-y-3 mb-6">
            {keys.map((k, i) => (
              <div key={i} className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-3 items-end">
                <ColumnSelector
                  columns={colsA}
                  value={k.left}
                  onChange={(v) => updateKey(i, "left", v)}
                  label={`Key ${i + 1} — Table A`}
                  placeholder="Select column"
                />
                <ColumnSelector
                  columns={colsB}
                  value={k.right}
                  onChange={(v) => updateKey(i, "right", v)}
                  label={`Key ${i + 1} — Table B`}
                  placeholder="Select column"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => removeKey(i)}
                  disabled={keys.length === 1}
                  aria-label="Remove key"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-end gap-4 mb-6">
            <Button
              variant="outline"
              onClick={addKey}
              disabled={keys.length >= MAX_KEYS}
              className="gap-2"
            >
              <Plus className="h-4 w-4" /> Add matching field
            </Button>
          </div>

          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <Label className="text-sm font-medium text-foreground">
                Step 4 — Columns to return from Table B ({returnCols.length}/{availableReturnCols.length})
              </Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setReturnCols(availableReturnCols)}
                >
                  Select all
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setReturnCols([])}
                >
                  Clear
                </Button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mb-2">
              Pick which Table B columns get added to Table A (matching key columns are excluded automatically).
            </p>
            <div className="rounded-md border border-border bg-card p-3 max-h-56 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
              {availableReturnCols.length === 0 && (
                <p className="text-sm text-muted-foreground col-span-full">
                  No Table B columns available — select matching fields first.
                </p>
              )}
              {availableReturnCols.map((c) => {
                const selected = returnCols.includes(c);
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => toggleReturnCol(c)}
                    className={`text-left rounded-md px-3 py-2 text-sm transition-colors border ${
                      selected
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background text-foreground border-border hover:bg-muted"
                    }`}
                  >
                    {selected ? "✓ " : ""}{c}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-wrap items-end gap-4 mb-2">
            <div className="space-y-2 min-w-[200px]">
              <Label className="text-sm font-medium text-foreground">Join type</Label>
              <Select value={join} onValueChange={(v) => setJoin(v as JoinKind)}>
                <SelectTrigger className="bg-card border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border z-50">
                  <SelectItem value="left">Left Outer (keep all A)</SelectItem>
                  <SelectItem value="inner">Inner (only matches)</SelectItem>
                  <SelectItem value="right">Right Outer (keep all B)</SelectItem>
                  <SelectItem value="full">Full Outer (keep all)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={performMerge}
              disabled={!canMerge}
              className="gap-2 bg-primary hover:bg-primary/90"
            >
              <GitMerge className="h-4 w-4" /> Run Merge
            </Button>
          </div>
        </div>
      )}

      {results.length > 0 && (
        <div className="bg-card rounded-xl p-6 border border-border shadow-soft">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-accent text-accent-foreground text-sm font-bold">
                ✓
              </span>
              Merged Results ({results.length} rows)
            </h2>
            <Button onClick={handleExport} className="bg-accent hover:bg-accent/90">
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
          <TablePreview data={results} title="" maxRows={10} />
        </div>
      )}
    </div>
  );
};
