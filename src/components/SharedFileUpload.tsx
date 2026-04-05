import { useState } from "react";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { FileUpload } from "@/components/FileUpload";
import { TablePreview } from "@/components/TablePreview";
import { toast } from "sonner";

interface SharedFileUploadProps {
  onDataLoaded: (data: Record<string, any>[], fileName: string) => void;
  data: Record<string, any>[];
  fileName: string;
}

const normalizeRows = (rows: any[]): Record<string, any>[] => {
  if (!Array.isArray(rows)) return [];
  return rows
    .filter((row) => row && typeof row === "object" && !Array.isArray(row))
    .map((row) => {
      const normalized: Record<string, any> = {};
      const used = new Set<string>();
      Object.entries(row).forEach(([rawHeader, value], index) => {
        if (rawHeader === "__parsed_extra") return;
        const base = String(rawHeader ?? "").trim() || `Column ${index + 1}`;
        let final = base;
        let counter = 2;
        while (used.has(final)) {
          final = `${base} (${counter++})`;
        }
        used.add(final);
        normalized[final] = value;
      });
      return normalized;
    })
    .filter((row) => Object.keys(row).length > 0);
};

export const SharedFileUpload = ({ onDataLoaded, data, fileName }: SharedFileUploadProps) => {
  const handleFile = (file: File) => {
    const isExcel = file.name.endsWith(".xlsx") || file.name.endsWith(".xls");

    if (isExcel) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const arr = new Uint8Array(e.target?.result as ArrayBuffer);
          const wb = XLSX.read(arr, { type: "array" });
          const sheet = wb.Sheets[wb.SheetNames[0]];
          const json = XLSX.utils.sheet_to_json(sheet);
          const normalized = normalizeRows(json);
          if (normalized.length === 0) {
            toast.error("No valid rows found");
            return;
          }
          onDataLoaded(normalized, file.name);
          toast.success(`Loaded ${normalized.length} rows`);
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
      complete: (result) => {
        const normalized = normalizeRows(result.data as any[]);
        if (normalized.length === 0) {
          toast.error("No valid rows found");
          return;
        }
        onDataLoaded(normalized, file.name);
        toast.success(`Loaded ${normalized.length} rows`);
      },
      error: (err) => toast.error(`Error parsing CSV: ${err.message}`),
    });
  };

  return (
    <div>
      <FileUpload onFileUpload={handleFile} label="Upload File" fileName={fileName} />
      {data.length > 0 && <TablePreview data={data} title="Preview" maxRows={3} />}
    </div>
  );
};
