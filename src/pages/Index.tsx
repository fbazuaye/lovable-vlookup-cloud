import { useState } from "react";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { FileUpload } from "@/components/FileUpload";
import { TablePreview } from "@/components/TablePreview";
import { ColumnSelector } from "@/components/ColumnSelector";
import { LookupForm } from "@/components/LookupForm";
import { Button } from "@/components/ui/button";
import { Download, Database } from "lucide-react";
import { toast } from "sonner";
import { performVLookup, performSingleLookup, convertToCSV } from "@/lib/vlookup";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const [tableA, setTableA] = useState<any[]>([]);
  const [tableB, setTableB] = useState<any[]>([]);
  const [fileNameA, setFileNameA] = useState<string>("");
  const [fileNameB, setFileNameB] = useState<string>("");
  const [lookupColumn, setLookupColumn] = useState<string>("");
  const [matchColumn, setMatchColumn] = useState<string>("");
  const [returnColumn, setReturnColumn] = useState<string>("");
  const [results, setResults] = useState<any[]>([]);
  const [isAiLoading, setIsAiLoading] = useState(false);

  const handleFileUpload = (file: File, table: "A" | "B") => {
    const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');
    
    if (isExcel) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(firstSheet);
          
          if (table === "A") {
            setTableA(jsonData);
            setFileNameA(file.name);
            toast.success(`Table A loaded: ${jsonData.length} rows`);
          } else {
            setTableB(jsonData);
            setFileNameB(file.name);
            toast.success(`Table B loaded: ${jsonData.length} rows`);
          }
        } catch (error: any) {
          toast.error(`Error parsing Excel: ${error.message}`);
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (result) => {
          if (table === "A") {
            setTableA(result.data);
            setFileNameA(file.name);
            toast.success(`Table A loaded: ${result.data.length} rows`);
          } else {
            setTableB(result.data);
            setFileNameB(file.name);
            toast.success(`Table B loaded: ${result.data.length} rows`);
          }
        },
        error: (error) => {
          toast.error(`Error parsing CSV: ${error.message}`);
        },
      });
    }
  };

  const handleSingleLookup = (value: string) => {
    if (!matchColumn || !returnColumn) {
      toast.error("Please select match and return columns");
      return;
    }

    const result = performSingleLookup(value, tableB, matchColumn, returnColumn);
    if (result !== null) {
      toast.success(`Result: ${result}`);
      setResults([{ "Lookup Value": value, [returnColumn]: result }]);
    } else {
      toast.error("No match found");
      setResults([{ "Lookup Value": value, [returnColumn]: "N/A" }]);
    }
  };

  const handleBulkLookup = () => {
    if (!lookupColumn || !matchColumn || !returnColumn) {
      toast.error("Please select all required columns");
      return;
    }

    if (tableA.length === 0 || tableB.length === 0) {
      toast.error("Please upload both tables");
      return;
    }

    const result = performVLookup(tableA, tableB, lookupColumn, matchColumn, returnColumn);
    setResults(result);
    toast.success(`Bulk VLOOKUP complete: ${result.length} rows processed`);
  };

  const handleAiSuggest = async () => {
    if (tableA.length === 0 || tableB.length === 0) {
      toast.error("Please upload both tables first");
      return;
    }

    setIsAiLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("suggest-columns", {
        body: {
          columnsA: Object.keys(tableA[0]),
          columnsB: Object.keys(tableB[0]),
          sampleDataA: tableA.slice(0, 3),
          sampleDataB: tableB.slice(0, 3),
        },
      });

      if (error) throw error;

      setLookupColumn(data.lookupColumn);
      setMatchColumn(data.matchColumn);
      setReturnColumn(data.returnColumn);
      
      toast.success("AI suggestions applied!", {
        description: data.reasoning || "Columns selected based on data analysis",
      });
    } catch (error: any) {
      console.error("AI suggestion error:", error);
      if (error.message?.includes("429")) {
        toast.error("Rate limit exceeded. Please try again later.");
      } else if (error.message?.includes("402")) {
        toast.error("AI credits depleted. Please add credits to continue.");
      } else {
        toast.error("Failed to get AI suggestions. Using manual selection.");
      }
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleExport = () => {
    if (results.length === 0) {
      toast.error("No results to export");
      return;
    }

    const csv = convertToCSV(results);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "vlookup-results.csv";
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success("Results exported successfully");
  };

  const columnsA = tableA.length > 0 ? Object.keys(tableA[0]) : [];
  const columnsB = tableB.length > 0 ? Object.keys(tableB[0]) : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center p-3 bg-gradient-to-r from-primary to-primary-light rounded-2xl mb-4 shadow-medium">
            <Database className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-3 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            VLOOKUP Web App
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Excel's VLOOKUP function in your browser. Upload CSV or Excel files, match columns, and merge data instantly.
          </p>
        </div>

        {/* File Upload Section */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="bg-card rounded-xl p-6 border border-border shadow-soft">
            <h2 className="text-xl font-semibold mb-4 text-foreground flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm font-bold">
                1
              </span>
              Table A (Lookup Table)
            </h2>
            <FileUpload
              onFileUpload={(file) => handleFileUpload(file, "A")}
              label="Upload Table A"
              fileName={fileNameA}
            />
            {tableA.length > 0 && <TablePreview data={tableA} title="Preview" maxRows={3} />}
          </div>

          <div className="bg-card rounded-xl p-6 border border-border shadow-soft">
            <h2 className="text-xl font-semibold mb-4 text-foreground flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm font-bold">
                2
              </span>
              Table B (Reference Table)
            </h2>
            <FileUpload
              onFileUpload={(file) => handleFileUpload(file, "B")}
              label="Upload Table B"
              fileName={fileNameB}
            />
            {tableB.length > 0 && <TablePreview data={tableB} title="Preview" maxRows={3} />}
          </div>
        </div>

        {/* Column Selection */}
        {tableA.length > 0 && tableB.length > 0 && (
          <div className="bg-card rounded-xl p-6 border border-border shadow-soft mb-8">
            <h2 className="text-xl font-semibold mb-6 text-foreground flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm font-bold">
                3
              </span>
              Select Columns
            </h2>
            <div className="grid md:grid-cols-3 gap-6 mb-6">
              <ColumnSelector
                columns={columnsA}
                value={lookupColumn}
                onChange={setLookupColumn}
                label="Lookup Column (Table A)"
                placeholder="Select lookup column"
              />
              <ColumnSelector
                columns={columnsB}
                value={matchColumn}
                onChange={setMatchColumn}
                label="Match Column (Table B)"
                placeholder="Select match column"
              />
              <ColumnSelector
                columns={columnsB}
                value={returnColumn}
                onChange={setReturnColumn}
                label="Return Column (Table B)"
                placeholder="Select return column"
              />
            </div>

            <LookupForm
              onSingleLookup={handleSingleLookup}
              onBulkLookup={handleBulkLookup}
              onAiSuggest={handleAiSuggest}
              disabled={!matchColumn || !returnColumn}
              isAiLoading={isAiLoading}
            />
          </div>
        )}

        {/* Results Section */}
        {results.length > 0 && (
          <div className="bg-card rounded-xl p-6 border border-border shadow-soft">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-accent text-accent-foreground text-sm font-bold">
                  ✓
                </span>
                Results
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
    </div>
  );
};

export default Index;
