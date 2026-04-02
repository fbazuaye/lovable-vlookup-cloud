import { useState, useEffect } from "react";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { FileUpload } from "@/components/FileUpload";
import { TablePreview } from "@/components/TablePreview";
import { ColumnSelector } from "@/components/ColumnSelector";
import { LookupForm } from "@/components/LookupForm";
import { Button } from "@/components/ui/button";
import { Download, Database, InfoIcon, Smartphone, Share, X, Sun, Moon } from "lucide-react";
import { useInstallPrompt } from "@/hooks/use-install-prompt";
import { useTheme } from "@/hooks/use-theme";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { performVLookup, performSingleLookup, convertToCSV } from "@/lib/vlookup";
import { supabase } from "@/integrations/supabase/client";

const useIsIos = () => {
  const [isIos, setIsIos] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  useEffect(() => {
    const ua = window.navigator.userAgent;
    setIsIos(/iphone|ipad|ipod/i.test(ua));
    setIsStandalone(
      "standalone" in window.navigator && (window.navigator as any).standalone === true
    );
  }, []);
  return { isIos, isStandalone };
};

const InstallButton = () => {
  const { canInstall, isInstalled, install } = useInstallPrompt();
  const { isIos, isStandalone } = useIsIos();
  const [showIosBanner, setShowIosBanner] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (isIos && !isStandalone && !dismissed) {
      const wasDismissed = sessionStorage.getItem("ios-install-dismissed");
      if (!wasDismissed) setShowIosBanner(true);
    }
  }, [isIos, isStandalone, dismissed]);

  const dismissIos = () => {
    setShowIosBanner(false);
    setDismissed(true);
    sessionStorage.setItem("ios-install-dismissed", "true");
  };

  if (isInstalled || isStandalone) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full">
        <Smartphone className="h-3.5 w-3.5" /> Installed
      </span>
    );
  }

  if (canInstall) {
    return (
      <Button
        onClick={install}
        variant="outline"
        size="sm"
        className="gap-2 border-primary/30 text-primary hover:bg-primary/5"
      >
        <Smartphone className="h-4 w-4" />
        Install App
      </Button>
    );
  }

  if (showIosBanner) {
    return (
      <div className="relative w-full max-w-md mx-auto mt-2 rounded-xl border border-primary/20 bg-card p-4 shadow-lg animate-in slide-in-from-bottom-4">
        <button
          onClick={dismissIos}
          className="absolute top-2 right-2 text-muted-foreground hover:text-foreground"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-primary/10 p-2">
            <Smartphone className="h-5 w-5 text-primary" />
          </div>
          <div className="text-left text-sm">
            <p className="font-semibold text-foreground mb-1">Install VLOOKUP App</p>
            <p className="text-muted-foreground leading-snug">
              Tap the <Share className="inline h-4 w-4 -mt-0.5 text-primary" /> <strong>Share</strong> button in Safari, then select <strong>"Add to Home Screen"</strong>.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

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

  const normalizeRows = (rows: any[]): any[] => {
    if (!Array.isArray(rows)) return [];

    return rows
      .filter((row) => row && typeof row === "object" && !Array.isArray(row))
      .map((row) => {
        const normalizedRow: Record<string, any> = {};
        const usedHeaders = new Set<string>();

        Object.entries(row).forEach(([rawHeader, value], index) => {
          if (rawHeader === "__parsed_extra") return;

          const baseHeader = String(rawHeader ?? "").trim() || `Column ${index + 1}`;
          let finalHeader = baseHeader;
          let duplicateCounter = 2;

          while (usedHeaders.has(finalHeader)) {
            finalHeader = `${baseHeader} (${duplicateCounter})`;
            duplicateCounter += 1;
          }

          usedHeaders.add(finalHeader);
          normalizedRow[finalHeader] = value;
        });

        return normalizedRow;
      })
      .filter((row) => Object.keys(row).length > 0);
  };

  const applyUploadedData = (rows: any[], fileName: string, table: "A" | "B") => {
    const normalizedData = normalizeRows(rows);

    if (normalizedData.length === 0) {
      toast.error("No valid rows found in this file");
      return;
    }

    if (table === "A") {
      setTableA(normalizedData);
      setFileNameA(fileName);
      toast.success(`Table A loaded: ${normalizedData.length} rows`);
    } else {
      setTableB(normalizedData);
      setFileNameB(fileName);
      toast.success(`Table B loaded: ${normalizedData.length} rows`);
    }
  };

  const handleFileUpload = (file: File, table: "A" | "B") => {
    const isExcel = file.name.endsWith(".xlsx") || file.name.endsWith(".xls");

    if (isExcel) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: "array" });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(firstSheet);
          applyUploadedData(jsonData, file.name, table);
        } catch (error: any) {
          toast.error(`Error parsing Excel: ${error.message}`);
        }
      };
      reader.readAsArrayBuffer(file);
      return;
    }

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        applyUploadedData(result.data as any[], file.name, table);
      },
      error: (error) => {
        toast.error(`Error parsing CSV: ${error.message}`);
      },
    });
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
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-4">
            Excel's VLOOKUP function in your browser. Upload CSV or Excel files, match columns, and merge data instantly.
          </p>
          <InstallButton />
        </div>

        {/* Instructions Section */}
        <Card className="p-6 mb-8 bg-primary/5 border-primary/20">
          <div className="flex items-start gap-3">
            <InfoIcon className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-foreground mb-3">How to Use VLOOKUP</h3>
              <ol className="space-y-2 text-sm text-muted-foreground">
                <li className="flex gap-2">
                  <span className="font-semibold text-primary">1.</span>
                  <span>Upload two files (CSV or Excel) - Table A contains values you want to look up, Table B contains reference data</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-semibold text-primary">2.</span>
                  <span>Select the lookup column from Table A (the value you are searching for)</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-semibold text-primary">3.</span>
                  <span>Select the match column from Table B (where to find matching values)</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-semibold text-primary">4.</span>
                  <span>Select the return column from Table B (the data you want to retrieve)</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-semibold text-primary">5.</span>
                  <span>Click "AI Suggest" for automatic column matching, or perform a single lookup or bulk lookup</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-semibold text-primary">6.</span>
                  <span>Export your results as CSV when ready</span>
                </li>
              </ol>
            </div>
          </div>
        </Card>

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
      
      {/* Footer */}
      <footer className="mt-16 pb-8 text-center space-y-2">
        <p className="text-sm text-muted-foreground">
          Designed By Frank Bazuaye | Powered By LiveGig Ltd
        </p>
        <a href="/privacy" className="text-xs text-primary hover:underline">
          Privacy Policy
        </a>
      </footer>
    </div>
  );
};

export default Index;
