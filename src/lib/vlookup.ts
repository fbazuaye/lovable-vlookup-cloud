export interface VLookupResult {
  [key: string]: any;
}

export const performVLookup = (
  tableA: any[],
  tableB: any[],
  lookupColumn: string,
  matchColumn: string,
  returnColumn: string
): VLookupResult[] => {
  // Create a map for efficient lookup
  const lookupMap = new Map();
  tableB.forEach((row) => {
    const key = String(row[matchColumn]).trim().toLowerCase();
    lookupMap.set(key, row[returnColumn]);
  });

  // Perform lookup on tableA
  return tableA.map((row) => {
    const lookupValue = String(row[lookupColumn]).trim().toLowerCase();
    const result = lookupMap.get(lookupValue);
    return {
      ...row,
      [returnColumn]: result !== undefined ? result : "N/A",
    };
  });
};

export const performSingleLookup = (
  lookupValue: string,
  tableB: any[],
  matchColumn: string,
  returnColumn: string
): string | null => {
  const normalizedLookup = lookupValue.trim().toLowerCase();
  const match = tableB.find(
    (row) => String(row[matchColumn]).trim().toLowerCase() === normalizedLookup
  );
  return match ? match[returnColumn] : null;
};

export const findCommonColumns = (tableA: any[], tableB: any[]): string[] => {
  if (!tableA.length || !tableB.length) return [];
  const columnsA = new Set(Object.keys(tableA[0]));
  const columnsB = Object.keys(tableB[0]);
  return columnsB.filter((col) => columnsA.has(col));
};

export const convertToCSV = (data: any[]): string => {
  if (!data.length) return "";
  
  const headers = Object.keys(data[0]);
  const csvRows = [
    headers.join(","),
    ...data.map((row) =>
      headers.map((header) => {
        const value = row[header];
        const stringValue = String(value);
        // Escape quotes and wrap in quotes if contains comma
        return stringValue.includes(",") || stringValue.includes('"')
          ? `"${stringValue.replace(/"/g, '""')}"`
          : stringValue;
      }).join(",")
    ),
  ];
  return csvRows.join("\n");
};
