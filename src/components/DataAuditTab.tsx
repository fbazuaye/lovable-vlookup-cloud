import { useState } from "react";
import { SharedFileUpload } from "@/components/SharedFileUpload";
import { ColumnSelector } from "@/components/ColumnSelector";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TablePreview } from "@/components/TablePreview";
import { Download, Copy, Hash, Filter } from "lucide-react";
import { findDuplicates, countValues, countIf, extractUnique, flagDuplicatesInData } from "@/lib/auditTools";
import { convertToCSV } from "@/lib/vlookup";
import { toast } from "sonner";

export const DataAuditTab = () => {
  const [data, setData] = useState<Record<string, any>[]>([]);
  const [fileName, setFileName] = useState("");
  const [column, setColumn] = useState("");
  const [results, setResults] = useState<Record<string, any>[]>([]);
  const [conditionValue, setConditionValue] = useState("");
  const [countIfResult, setCountIfResult] = useState<number | null>(null);

  const columns = data.length > 0 ? Object.keys(data[0]) : [];

  const handleDuplicates = () => {
    if (!column) { toast.error("Select a column"); return; }
    const dupes = findDuplicates(data, column);
    setResults(dupes as any);
    const dupeCount = dupes.filter((d) => d.Status === "Duplicate").length;
    toast.success(`Found ${dupeCount} duplicate values`);
  };

  const handleFlagDuplicates = () => {
    if (!column) { toast.error("Select a column"); return; }
    const flagged = flagDuplicatesInData(data, column);
    setResults(flagged);
    toast.success("Duplicates flagged in data");
  };

  const handleCount = () => {
    if (!column) { toast.error("Select a column"); return; }
    const counts = countValues(data, column);
    setResults(counts as any);
    toast.success(`Frequency table: ${counts.length} unique values`);
  };

  const handleCountIf = () => {
    if (!column) { toast.error("Select a column"); return; }
    if (!conditionValue) { toast.error("Enter a value to count"); return; }
    const count = countIf(data, column, conditionValue);
    setCountIfResult(count);
    toast.success(`"${conditionValue}" appears ${count} times`);
  };

  const handleUnique = () => {
    if (!column) { toast.error("Select a column"); return; }
    const unique = extractUnique(data, column);
    setResults(unique);
    toast.success(`${unique.length} unique rows extracted`);
  };

  const handleExport = () => {
    if (results.length === 0) return;
    const csv = convertToCSV(results);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "data-audit-results.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Exported successfully");
  };

  return (
    <div className="space-y-6">
      <Card className="p-6 border-border shadow-soft">
        <h2 className="text-lg font-semibold text-foreground mb-4">Upload Your File</h2>
        <SharedFileUpload
          data={data}
          fileName={fileName}
          onDataLoaded={(d, f) => {
            setData(d);
            setFileName(f);
            setColumn("");
            setResults([]);
            setCountIfResult(null);
          }}
        />
      </Card>

      {data.length > 0 && (
        <Card className="p-6 border-border shadow-soft">
          <h2 className="text-lg font-semibold text-foreground mb-4">Data Audit Tools</h2>
          <div className="mb-6 max-w-sm">
            <ColumnSelector
              columns={columns}
              value={column}
              onChange={setColumn}
              label="Audit Column"
              placeholder="Select column to audit"
            />
          </div>

          {/* Duplicates */}
          <div className="mb-6 p-4 rounded-lg bg-muted/30 border border-border">
            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <Copy className="h-4 w-4" /> Duplicates
            </h3>
            <div className="flex flex-wrap gap-3">
              <Button onClick={handleDuplicates} disabled={!column} variant="outline">
                Summary Table
              </Button>
              <Button onClick={handleFlagDuplicates} disabled={!column} variant="outline">
                Flag in Data
              </Button>
            </div>
          </div>

          {/* Count */}
          <div className="mb-6 p-4 rounded-lg bg-muted/30 border border-border">
            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <Hash className="h-4 w-4" /> Count & COUNTIF
            </h3>
            <div className="flex flex-wrap gap-3 mb-3">
              <Button onClick={handleCount} disabled={!column} variant="outline">
                Frequency Table (COUNT)
              </Button>
            </div>
            <div className="flex items-end gap-3">
              <div className="flex-1 max-w-xs">
                <Label className="text-xs">COUNTIF Value</Label>
                <Input
                  value={conditionValue}
                  onChange={(e) => setConditionValue(e.target.value)}
                  placeholder="Value to count"
                />
              </div>
              <Button onClick={handleCountIf} disabled={!column} variant="outline">
                COUNTIF
              </Button>
              {countIfResult !== null && (
                <span className="text-sm font-semibold text-primary px-3 py-2 bg-primary/10 rounded-md">
                  Result: {countIfResult}
                </span>
              )}
            </div>
          </div>

          {/* Unique */}
          <div className="p-4 rounded-lg bg-muted/30 border border-border">
            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <Filter className="h-4 w-4" /> Unique Values
            </h3>
            <Button onClick={handleUnique} disabled={!column} variant="outline">
              Extract Unique Rows
            </Button>
          </div>
        </Card>
      )}

      {results.length > 0 && (
        <Card className="p-6 border-border shadow-soft">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">Results</h2>
            <Button onClick={handleExport} className="bg-accent hover:bg-accent/90 gap-2">
              <Download className="h-4 w-4" /> Export CSV
            </Button>
          </div>
          <TablePreview data={results} title="" maxRows={10} />
        </Card>
      )}
    </div>
  );
};
