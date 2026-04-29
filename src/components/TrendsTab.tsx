import { useState, useMemo } from "react";
import { SharedFileUpload } from "@/components/SharedFileUpload";
import { ColumnSelector } from "@/components/ColumnSelector";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TablePreview } from "@/components/TablePreview";
import {
  Download,
  InfoIcon,
  TrendingUp,
  BarChart2,
  Sparkles,
  Calculator,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import {
  detectColumnTypes,
  computeSummaryStats,
  buildTimeSeries,
  buildDistribution,
  summarizeForAI,
  type Aggregation,
  type Granularity,
} from "@/lib/trendTools";
import { convertToCSV } from "@/lib/vlookup";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

const formatNum = (n: number) =>
  Math.abs(n) >= 1000 ? n.toLocaleString(undefined, { maximumFractionDigits: 2 }) : n.toFixed(2);

export const TrendsTab = () => {
  const { user } = useAuth();
  const [data, setData] = useState<Record<string, any>[]>([]);
  const [fileName, setFileName] = useState("");

  const [dateCol, setDateCol] = useState("");
  const [valueCol, setValueCol] = useState("");
  const [aggregation, setAggregation] = useState<Aggregation>("sum");
  const [granularity, setGranularity] = useState<Granularity>("month");

  const [distCol, setDistCol] = useState("");

  const [aiHeadline, setAiHeadline] = useState("");
  const [aiInsights, setAiInsights] = useState<string[]>([]);
  const [aiLoading, setAiLoading] = useState(false);

  const types = useMemo(() => detectColumnTypes(data), [data]);
  const stats = useMemo(() => computeSummaryStats(data, types.numerics), [data, types]);

  const allColumns = data.length > 0 ? Object.keys(data[0]) : [];

  const series = useMemo(() => {
    if (!dateCol || !valueCol) return [];
    return buildTimeSeries(data, dateCol, valueCol, aggregation, granularity);
  }, [data, dateCol, valueCol, aggregation, granularity]);

  const distribution = useMemo(() => {
    if (!distCol) return [];
    return buildDistribution(data, distCol, 10);
  }, [data, distCol]);

  const trackUsage = async (actionType: string) => {
    if (!user) return;
    await supabase.from("usage_analytics").insert({
      user_id: user.id,
      action_type: actionType,
      lookup_count: 0,
      files_processed: 0,
    });
  };

  const handleAiAnalyze = async () => {
    if (data.length === 0) {
      toast.error("Upload a file first");
      return;
    }
    setAiLoading(true);
    setAiHeadline("");
    setAiInsights([]);
    try {
      const payload = summarizeForAI(data, types, stats);
      const { data: resp, error } = await supabase.functions.invoke("analyze-trends", {
        body: payload,
      });
      if (error) throw error;
      setAiHeadline(resp.headline || "");
      setAiInsights(resp.insights || []);
      trackUsage("ai_insights");
      toast.success("AI insights generated");
    } catch (err: any) {
      console.error(err);
      const msg = err?.message || "";
      if (msg.includes("429")) toast.error("Rate limit exceeded. Try again later.");
      else if (msg.includes("402")) toast.error("AI credits depleted.");
      else toast.error("Failed to generate insights");
    } finally {
      setAiLoading(false);
    }
  };

  const handleExportStats = () => {
    if (stats.length === 0) {
      toast.error("No stats to export");
      return;
    }
    const rows = stats.map((s) => ({
      Column: s.column,
      Count: s.count,
      Missing: s.missing,
      Min: s.min,
      Max: s.max,
      Mean: s.mean,
      Median: s.median,
      "Std Dev": s.stdDev,
      Sum: s.sum,
    }));
    const csv = convertToCSV(rows);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "summary-stats.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <Card className="p-6 bg-primary/5 border-primary/20">
        <div className="flex items-start gap-3">
          <InfoIcon className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-foreground mb-3">How to Analyze Trends</h3>
            <ol className="space-y-2 text-sm text-muted-foreground">
              <li className="flex gap-2">
                <span className="font-semibold text-primary">1.</span>
                <span>Upload a CSV or Excel file containing your dataset</span>
              </li>
              <li className="flex gap-2">
                <span className="font-semibold text-primary">2.</span>
                <span>Review auto-detected column types (date, numeric, categorical) and summary statistics</span>
              </li>
              <li className="flex gap-2">
                <span className="font-semibold text-primary">3.</span>
                <span>Build a time-series chart by picking a date column and a numeric value</span>
              </li>
              <li className="flex gap-2">
                <span className="font-semibold text-primary">4.</span>
                <span>Build a distribution chart for any column to see top values</span>
              </li>
              <li className="flex gap-2">
                <span className="font-semibold text-primary">5.</span>
                <span>Click "Generate AI Insights" for plain-English trend highlights</span>
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
            setDateCol("");
            setValueCol("");
            setDistCol("");
            setAiHeadline("");
            setAiInsights([]);
          }}
        />
      </Card>

      {data.length > 0 && (
        <Card className="p-6 border-border shadow-soft">
          <h3 className="text-sm font-semibold text-foreground mb-3">Detected Column Types</h3>
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-muted-foreground w-24">Dates:</span>
              {types.dates.length === 0 && <span className="text-xs text-muted-foreground">none</span>}
              {types.dates.map((c) => (
                <Badge key={c} variant="secondary">{c}</Badge>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-muted-foreground w-24">Numerics:</span>
              {types.numerics.length === 0 && <span className="text-xs text-muted-foreground">none</span>}
              {types.numerics.map((c) => (
                <Badge key={c} variant="secondary">{c}</Badge>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-muted-foreground w-24">Categoricals:</span>
              {types.categoricals.length === 0 && <span className="text-xs text-muted-foreground">none</span>}
              {types.categoricals.map((c) => (
                <Badge key={c} variant="outline">{c}</Badge>
              ))}
            </div>
          </div>
        </Card>
      )}

      {data.length > 0 && stats.length > 0 && (
        <Card className="p-6 border-border shadow-soft">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Calculator className="h-5 w-5" /> Summary Statistics
            </h2>
            <Button onClick={handleExportStats} variant="outline" size="sm" className="gap-2">
              <Download className="h-4 w-4" /> Export CSV
            </Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted-foreground">
                  <th className="py-2 pr-4">Column</th>
                  <th className="py-2 pr-4">Count</th>
                  <th className="py-2 pr-4">Missing</th>
                  <th className="py-2 pr-4">Min</th>
                  <th className="py-2 pr-4">Max</th>
                  <th className="py-2 pr-4">Mean</th>
                  <th className="py-2 pr-4">Median</th>
                  <th className="py-2 pr-4">Std Dev</th>
                  <th className="py-2 pr-4">Sum</th>
                </tr>
              </thead>
              <tbody>
                {stats.map((s) => (
                  <tr key={s.column} className="border-b border-border/50">
                    <td className="py-2 pr-4 font-medium">{s.column}</td>
                    <td className="py-2 pr-4">{s.count}</td>
                    <td className="py-2 pr-4">{s.missing}</td>
                    <td className="py-2 pr-4">{formatNum(s.min)}</td>
                    <td className="py-2 pr-4">{formatNum(s.max)}</td>
                    <td className="py-2 pr-4">{formatNum(s.mean)}</td>
                    <td className="py-2 pr-4">{formatNum(s.median)}</td>
                    <td className="py-2 pr-4">{formatNum(s.stdDev)}</td>
                    <td className="py-2 pr-4">{formatNum(s.sum)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {data.length > 0 && (
        <Card className="p-6 border-border shadow-soft">
          <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5" /> Time-Series Trend
          </h2>
          <div className="grid sm:grid-cols-4 gap-3 mb-4">
            <ColumnSelector
              columns={types.dates}
              value={dateCol}
              onChange={setDateCol}
              label="Date column"
              placeholder="Pick date column"
            />
            <ColumnSelector
              columns={types.numerics}
              value={valueCol}
              onChange={setValueCol}
              label="Value column"
              placeholder="Pick numeric column"
            />
            <div>
              <Label className="text-xs">Aggregation</Label>
              <Select value={aggregation} onValueChange={(v) => setAggregation(v as Aggregation)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="sum">Sum</SelectItem>
                  <SelectItem value="mean">Mean</SelectItem>
                  <SelectItem value="count">Count</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Group by</Label>
              <Select value={granularity} onValueChange={(v) => setGranularity(v as Granularity)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">Day</SelectItem>
                  <SelectItem value="month">Month</SelectItem>
                  <SelectItem value="year">Year</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          {series.length > 0 ? (
            <div className="w-full h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={series}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <Tooltip
                    contentStyle={{
                      background: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: 8,
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Pick a date and a numeric column to render the trend.
            </p>
          )}
        </Card>
      )}

      {data.length > 0 && (
        <Card className="p-6 border-border shadow-soft">
          <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <BarChart2 className="h-5 w-5" /> Distribution (Top 10)
          </h2>
          <div className="max-w-xs mb-4">
            <ColumnSelector
              columns={allColumns}
              value={distCol}
              onChange={setDistCol}
              label="Column"
              placeholder="Pick column"
            />
          </div>
          {distribution.length > 0 ? (
            <div className="w-full h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={distribution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="value" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <Tooltip
                    contentStyle={{
                      background: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: 8,
                    }}
                  />
                  <Bar dataKey="count" fill="hsl(var(--accent))" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Pick a column to see its top values.</p>
          )}
        </Card>
      )}

      {data.length > 0 && (
        <Card className="p-6 border-border shadow-soft">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" /> AI-Powered Insights
            </h2>
            <Button onClick={handleAiAnalyze} disabled={aiLoading} className="gap-2">
              {aiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {aiLoading ? "Analyzing..." : "Generate AI Insights"}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mb-4">
            Only aggregated summaries (column types, stats, top values) are sent to the AI — your raw data stays in your browser.
          </p>
          {aiHeadline && (
            <p className="text-base font-semibold text-foreground mb-3">{aiHeadline}</p>
          )}
          {aiInsights.length > 0 && (
            <ul className="space-y-2">
              {aiInsights.map((ins, i) => (
                <li key={i} className="flex gap-2 text-sm text-foreground">
                  <span className="text-primary font-bold">•</span>
                  <span>{ins}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}

      {data.length > 0 && (
        <Card className="p-6 border-border shadow-soft">
          <h2 className="text-lg font-semibold text-foreground mb-4">Data Preview</h2>
          <TablePreview data={data} title="" maxRows={5} />
        </Card>
      )}
    </div>
  );
};
