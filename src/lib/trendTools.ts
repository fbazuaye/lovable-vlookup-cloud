/**
 * Trend Analysis utilities (client-side only)
 */

export type ColumnTypes = {
  dates: string[];
  numerics: string[];
  categoricals: string[];
};

export type SummaryStat = {
  column: string;
  count: number;
  missing: number;
  min: number;
  max: number;
  mean: number;
  median: number;
  stdDev: number;
  sum: number;
};

export type SeriesPoint = { date: string; value: number };
export type DistPoint = { value: string; count: number };

const isEmpty = (v: any) =>
  v === null || v === undefined || (typeof v === "string" && v.trim() === "");

export const parseNumber = (v: any): number | null => {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (isEmpty(v)) return null;
  const s = String(v).replace(/[\s,$%]/g, "");
  if (s === "" || s === "-") return null;
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : null;
};

export const parseDate = (v: any): Date | null => {
  if (isEmpty(v)) return null;
  if (v instanceof Date && !isNaN(v.getTime())) return v;
  // Excel serial date
  if (typeof v === "number" && Number.isFinite(v) && v >= 20000 && v <= 60000) {
    const d = new Date(Date.UTC(1899, 11, 30) + v * 86400000);
    if (!isNaN(d.getTime())) return d;
  }
  const s = String(v).trim();
  // Try native parse
  let t = Date.parse(s);
  if (!isNaN(t)) {
    const d = new Date(t);
    const y = d.getFullYear();
    if (y >= 1900 && y <= 2100) return d;
  }
  // DD/MM/YYYY or MM/DD/YYYY
  const m = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
  if (m) {
    let [_, a, b, y] = m;
    let yr = parseInt(y);
    if (yr < 100) yr += 2000;
    // assume DD/MM/YYYY
    const d = new Date(yr, parseInt(b) - 1, parseInt(a));
    if (!isNaN(d.getTime()) && d.getFullYear() >= 1900 && d.getFullYear() <= 2100) return d;
  }
  return null;
};

export const detectColumnTypes = (data: Record<string, any>[]): ColumnTypes => {
  const result: ColumnTypes = { dates: [], numerics: [], categoricals: [] };
  if (data.length === 0) return result;
  const cols = Object.keys(data[0]);
  const sample = data.slice(0, Math.min(data.length, 200));

  const dateHeaderRe = /date|day|month|time|period|year|timestamp/i;
  for (const col of cols) {
    let nonEmpty = 0;
    let numCount = 0;
    let dateCount = 0;
    let hasDateHint = false; // Date instance or string with date separators
    for (const row of sample) {
      const v = row[col];
      if (isEmpty(v)) continue;
      nonEmpty++;
      if (parseNumber(v) !== null) numCount++;
      if (parseDate(v) !== null) dateCount++;
      if (v instanceof Date) hasDateHint = true;
      else if (typeof v === "string" && /[-\/]/.test(v)) hasDateHint = true;
    }
    if (nonEmpty === 0) {
      result.categoricals.push(col);
      continue;
    }
    const numRatio = numCount / nonEmpty;
    const dateRatio = dateCount / nonEmpty;
    const headerIsDate = dateHeaderRe.test(col);
    // Prefer date when strong date signal
    if (dateRatio >= 0.8 && (hasDateHint || headerIsDate || numRatio < 0.95)) {
      result.dates.push(col);
    } else if (numRatio >= 0.8) {
      result.numerics.push(col);
    } else {
      result.categoricals.push(col);
    }
  }
  return result;
};

export const computeSummaryStats = (
  data: Record<string, any>[],
  numericColumns: string[]
): SummaryStat[] => {
  return numericColumns.map((column) => {
    const values: number[] = [];
    let missing = 0;
    for (const row of data) {
      const n = parseNumber(row[column]);
      if (n === null) missing++;
      else values.push(n);
    }
    const count = values.length;
    if (count === 0) {
      return { column, count: 0, missing, min: 0, max: 0, mean: 0, median: 0, stdDev: 0, sum: 0 };
    }
    const sum = values.reduce((a, b) => a + b, 0);
    const mean = sum / count;
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(count / 2);
    const median = count % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
    const variance = values.reduce((a, b) => a + (b - mean) ** 2, 0) / count;
    const stdDev = Math.sqrt(variance);
    return {
      column,
      count,
      missing,
      min: sorted[0],
      max: sorted[count - 1],
      mean,
      median,
      stdDev,
      sum,
    };
  });
};

export type Granularity = "day" | "month" | "year";
export type Aggregation = "sum" | "mean" | "count";

const bucketKey = (d: Date, g: Granularity): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  if (g === "year") return `${y}`;
  if (g === "month") return `${y}-${m}`;
  return `${y}-${m}-${day}`;
};

export const buildTimeSeries = (
  data: Record<string, any>[],
  dateCol: string,
  valueCol: string,
  aggregation: Aggregation,
  granularity: Granularity
): SeriesPoint[] => {
  const buckets = new Map<string, { sum: number; count: number }>();
  for (const row of data) {
    const d = parseDate(row[dateCol]);
    if (!d) continue;
    const v = aggregation === "count" ? 1 : parseNumber(row[valueCol]);
    if (v === null) continue;
    const key = bucketKey(d, granularity);
    const cur = buckets.get(key) ?? { sum: 0, count: 0 };
    cur.sum += v;
    cur.count += 1;
    buckets.set(key, cur);
  }
  return Array.from(buckets.entries())
    .map(([date, b]) => ({
      date,
      value: aggregation === "mean" ? b.sum / b.count : aggregation === "count" ? b.count : b.sum,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
};

export const buildDistribution = (
  data: Record<string, any>[],
  column: string,
  topN = 10
): DistPoint[] => {
  const counts = new Map<string, number>();
  for (const row of data) {
    const v = row[column];
    if (isEmpty(v)) continue;
    const key = String(v).trim();
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, topN);
};

export const summarizeForAI = (
  data: Record<string, any>[],
  types: ColumnTypes,
  stats: SummaryStat[]
) => {
  const distributions: Record<string, DistPoint[]> = {};
  for (const c of types.categoricals.slice(0, 5)) {
    distributions[c] = buildDistribution(data, c, 10);
  }
  const timeSeries: Record<string, SeriesPoint[]> = {};
  if (types.dates[0] && types.numerics.length > 0) {
    for (const numCol of types.numerics.slice(0, 3)) {
      const series = buildTimeSeries(data, types.dates[0], numCol, "sum", "month");
      // downsample to 50 points max
      const step = Math.max(1, Math.ceil(series.length / 50));
      timeSeries[`${types.dates[0]} → ${numCol} (sum, monthly)`] = series.filter(
        (_, i) => i % step === 0
      );
    }
  }
  return {
    rowCount: data.length,
    columnTypes: types,
    summaryStats: stats,
    topDistributions: distributions,
    timeSeries,
    sampleRows: data.slice(0, 3),
  };
};
