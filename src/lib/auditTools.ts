/**
 * Data Audit utility functions
 */

export interface DuplicateResult {
  Value: string;
  Count: number;
  Status: "Duplicate" | "Unique";
}

export interface CountResult {
  Value: string;
  Count: number;
}

export const findDuplicates = (
  data: Record<string, any>[],
  column: string
): DuplicateResult[] => {
  const counts = new Map<string, number>();

  for (const row of data) {
    const val = String(row[column] ?? "").trim();
    counts.set(val, (counts.get(val) ?? 0) + 1);
  }

  return Array.from(counts.entries()).map(([value, count]) => ({
    Value: value,
    Count: count,
    Status: count > 1 ? "Duplicate" : "Unique",
  }));
};

export const countValues = (
  data: Record<string, any>[],
  column: string
): CountResult[] => {
  const counts = new Map<string, number>();

  for (const row of data) {
    const val = String(row[column] ?? "").trim();
    counts.set(val, (counts.get(val) ?? 0) + 1);
  }

  return Array.from(counts.entries())
    .map(([Value, Count]) => ({ Value, Count }))
    .sort((a, b) => b.Count - a.Count);
};

export const countIf = (
  data: Record<string, any>[],
  column: string,
  condition: string
): number => {
  const normalized = condition.toLowerCase().trim();
  return data.filter(
    (row) => String(row[column] ?? "").toLowerCase().trim() === normalized
  ).length;
};

export const extractUnique = (
  data: Record<string, any>[],
  column: string
): Record<string, any>[] => {
  const seen = new Set<string>();
  return data.filter((row) => {
    const val = String(row[column] ?? "").trim();
    if (seen.has(val)) return false;
    seen.add(val);
    return true;
  });
};

export const flagDuplicatesInData = (
  data: Record<string, any>[],
  column: string
): Record<string, any>[] => {
  const counts = new Map<string, number>();
  for (const row of data) {
    const val = String(row[column] ?? "").trim();
    counts.set(val, (counts.get(val) ?? 0) + 1);
  }

  return data.map((row) => {
    const val = String(row[column] ?? "").trim();
    return {
      ...row,
      _Duplicate: (counts.get(val) ?? 0) > 1 ? "Yes" : "No",
      _Occurrences: counts.get(val) ?? 0,
    };
  });
};
