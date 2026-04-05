import { useState } from "react";
import { SharedFileUpload } from "@/components/SharedFileUpload";
import { ColumnSelector } from "@/components/ColumnSelector";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { TablePreview } from "@/components/TablePreview";
import { Download, Eraser, Type, CaseSensitive, CaseUpper, CaseLower, InfoIcon } from "lucide-react";
import { applyTextOperation, TextOperation } from "@/lib/textTools";
import { convertToCSV } from "@/lib/vlookup";
import { toast } from "sonner";

export const TextCleanTab = () => {
  const [data, setData] = useState<Record<string, any>[]>([]);
  const [fileName, setFileName] = useState("");
  const [column, setColumn] = useState("");
  const [results, setResults] = useState<Record<string, any>[]>([]);
  const [padLength, setPadLength] = useState(5);

  const columns = data.length > 0 ? Object.keys(data[0]) : [];

  const apply = (op: TextOperation) => {
    if (!column) {
      toast.error("Please select a column first");
      return;
    }
    const processed = applyTextOperation(data, column, op, { padLength });
    setResults(processed);
    toast.success(`${op.toUpperCase()} applied to "${column}"`);
  };

  const handleExport = () => {
    if (results.length === 0) return;
    const csv = convertToCSV(results);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "text-clean-results.csv";
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
          }}
        />
      </Card>

      {data.length > 0 && (
        <Card className="p-6 border-border shadow-soft">
          <h2 className="text-lg font-semibold text-foreground mb-4">Select Column & Apply Operation</h2>
          <div className="mb-6 max-w-sm">
            <ColumnSelector
              columns={columns}
              value={column}
              onChange={setColumn}
              label="Target Column"
              placeholder="Select column to clean"
            />
          </div>

          <div className="flex flex-wrap gap-3">
            <Button onClick={() => apply("clean")} variant="outline" className="gap-2" disabled={!column}>
              <Eraser className="h-4 w-4" /> CLEAN
            </Button>
            <Button onClick={() => apply("trim")} variant="outline" className="gap-2" disabled={!column}>
              <Type className="h-4 w-4" /> TRIM
            </Button>
            <Button onClick={() => apply("proper")} variant="outline" className="gap-2" disabled={!column}>
              <CaseSensitive className="h-4 w-4" /> PROPER
            </Button>
            <Button onClick={() => apply("upper")} variant="outline" className="gap-2" disabled={!column}>
              <CaseUpper className="h-4 w-4" /> UPPER
            </Button>
            <Button onClick={() => apply("lower")} variant="outline" className="gap-2" disabled={!column}>
              <CaseLower className="h-4 w-4" /> LOWER
            </Button>
            <div className="flex items-center gap-2">
              <Button onClick={() => apply("padZeros")} variant="outline" className="gap-2" disabled={!column}>
                Pad Zeros
              </Button>
              <input
                type="number"
                value={padLength}
                onChange={(e) => setPadLength(Number(e.target.value))}
                className="w-16 h-9 rounded-md border border-input bg-background px-2 text-sm"
                min={1}
                max={20}
              />
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
