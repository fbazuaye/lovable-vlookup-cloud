import { useState } from "react";
import { SharedFileUpload } from "@/components/SharedFileUpload";
import { ColumnSelector } from "@/components/ColumnSelector";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TablePreview } from "@/components/TablePreview";
import { Download, Replace, Search, InfoIcon } from "lucide-react";
import { applyTextOperation } from "@/lib/textTools";
import { convertToCSV } from "@/lib/vlookup";
import { toast } from "sonner";

export const SearchReplaceTab = () => {
  const [data, setData] = useState<Record<string, any>[]>([]);
  const [fileName, setFileName] = useState("");
  const [column, setColumn] = useState("");
  const [results, setResults] = useState<Record<string, any>[]>([]);
  const [findText, setFindText] = useState("");
  const [replaceText, setReplaceText] = useState("");
  const [startPos, setStartPos] = useState(0);
  const [replaceLength, setReplaceLength] = useState(1);

  const columns = data.length > 0 ? Object.keys(data[0]) : [];

  const handleSubstitute = () => {
    if (!column) { toast.error("Select a column"); return; }
    if (!findText) { toast.error("Enter text to find"); return; }
    const processed = applyTextOperation(data, column, "substitute", {
      find: findText,
      replacement: replaceText,
    });
    setResults(processed);
    toast.success(`Substituted "${findText}" with "${replaceText}"`);
  };

  const handleReplace = () => {
    if (!column) { toast.error("Select a column"); return; }
    const processed = applyTextOperation(data, column, "replace", {
      start: startPos,
      length: replaceLength,
      replacement: replaceText,
    });
    setResults(processed);
    toast.success("Position-based replace applied");
  };

  const handleRemoveZeros = (mode: "removeLeadingZeros" | "removeAllZeros") => {
    if (!column) { toast.error("Select a column"); return; }
    const processed = applyTextOperation(data, column, mode);
    setResults(processed);
    toast.success(mode === "removeLeadingZeros" ? "Leading zeros removed" : "All zeros removed");
  };

  const handleExport = () => {
    if (results.length === 0) return;
    const csv = convertToCSV(results);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "search-replace-results.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Exported successfully");
  };

  return (
    <div className="space-y-6">
      <Card className="p-6 mb-0 bg-primary/5 border-primary/20">
        <div className="flex items-start gap-3">
          <InfoIcon className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-foreground mb-3">How to Use Search & Replace</h3>
            <ol className="space-y-2 text-sm text-muted-foreground">
              <li className="flex gap-2">
                <span className="font-semibold text-primary">1.</span>
                <span>Upload a CSV or Excel file containing the data you want to modify</span>
              </li>
              <li className="flex gap-2">
                <span className="font-semibold text-primary">2.</span>
                <span>Select the target column to apply search and replace operations</span>
              </li>
              <li className="flex gap-2">
                <span className="font-semibold text-primary">3.</span>
                <span>Use SUBSTITUTE to find and replace specific text, REPLACE for position-based replacement, or Remove Zeros to strip leading/all zeros</span>
              </li>
              <li className="flex gap-2">
                <span className="font-semibold text-primary">4.</span>
                <span>Preview the changes and export your modified data as CSV</span>
              </li>
            </ol>
          </div>
        </div>
      </Card>

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
          }}
        />
      </Card>

      {data.length > 0 && (
        <Card className="p-6 border-border shadow-soft">
          <h2 className="text-lg font-semibold text-foreground mb-4">Search & Replace</h2>
          <div className="mb-6 max-w-sm">
            <ColumnSelector
              columns={columns}
              value={column}
              onChange={setColumn}
              label="Target Column"
              placeholder="Select column"
            />
          </div>

          {/* Substitute */}
          <div className="mb-6 p-4 rounded-lg bg-muted/30 border border-border">
            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <Search className="h-4 w-4" /> Find & Replace (SUBSTITUTE)
            </h3>
            <div className="grid sm:grid-cols-3 gap-3">
              <div>
                <Label className="text-xs">Find</Label>
                <Input value={findText} onChange={(e) => setFindText(e.target.value)} placeholder="Text to find" />
              </div>
              <div>
                <Label className="text-xs">Replace with</Label>
                <Input value={replaceText} onChange={(e) => setReplaceText(e.target.value)} placeholder="Replacement" />
              </div>
              <div className="flex items-end">
                <Button onClick={handleSubstitute} disabled={!column} className="w-full gap-2">
                  <Replace className="h-4 w-4" /> Substitute
                </Button>
              </div>
            </div>
          </div>

          {/* Position-based Replace */}
          <div className="mb-6 p-4 rounded-lg bg-muted/30 border border-border">
            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <Replace className="h-4 w-4" /> Position-Based Replace (REPLACE)
            </h3>
            <div className="grid sm:grid-cols-4 gap-3">
              <div>
                <Label className="text-xs">Start Position</Label>
                <Input type="number" value={startPos} onChange={(e) => setStartPos(Number(e.target.value))} min={0} />
              </div>
              <div>
                <Label className="text-xs">Length</Label>
                <Input type="number" value={replaceLength} onChange={(e) => setReplaceLength(Number(e.target.value))} min={0} />
              </div>
              <div>
                <Label className="text-xs">New Text</Label>
                <Input value={replaceText} onChange={(e) => setReplaceText(e.target.value)} placeholder="New text" />
              </div>
              <div className="flex items-end">
                <Button onClick={handleReplace} disabled={!column} variant="outline" className="w-full">
                  Apply
                </Button>
              </div>
            </div>
          </div>

          {/* Remove Zeros */}
          <div className="p-4 rounded-lg bg-muted/30 border border-border">
            <h3 className="text-sm font-semibold text-foreground mb-3">Remove Zeros</h3>
            <div className="flex gap-3">
              <Button onClick={() => handleRemoveZeros("removeLeadingZeros")} disabled={!column} variant="outline">
                Remove Leading Zeros
              </Button>
              <Button onClick={() => handleRemoveZeros("removeAllZeros")} disabled={!column} variant="outline">
                Remove All Zeros
              </Button>
            </div>
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
