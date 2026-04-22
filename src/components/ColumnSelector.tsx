import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface ColumnSelectorProps {
  columns: string[];
  value: string;
  onChange: (value: string) => void;
  label: string;
  placeholder?: string;
}

export const ColumnSelector = ({ columns, value, onChange, label, placeholder }: ColumnSelectorProps) => {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium text-foreground">{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-full bg-card border-border">
          <SelectValue placeholder={placeholder || "Select a column"} />
        </SelectTrigger>
        <SelectContent className="bg-popover border-border z-50">
          {columns.map((column) => (
            <SelectItem key={column} value={column} className="cursor-pointer hover:bg-muted">
              {column}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

interface MultiColumnSelectorProps {
  columns: string[];
  values: string[];
  onChange: (values: string[]) => void;
  label: string;
  max?: number;
}

export const MultiColumnSelector = ({ columns, values, onChange, label, max = 3 }: MultiColumnSelectorProps) => {
  const toggleColumn = (column: string) => {
    if (values.includes(column)) {
      onChange(values.filter((value) => value !== column));
      return;
    }

    if (values.length < max) onChange([...values, column]);
  };

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium text-foreground">{label}</Label>
      <div className="rounded-md border border-border bg-card p-2 max-h-48 overflow-y-auto">
        <div className="grid gap-2">
          {columns.map((column) => {
            const selected = values.includes(column);
            const disabled = !selected && values.length >= max;

            return (
              <button
                key={column}
                type="button"
                onClick={() => toggleColumn(column)}
                disabled={disabled}
                className={`w-full rounded-md px-3 py-2 text-left text-sm transition-colors ${
                  selected
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                }`}
              >
                {column}
              </button>
            );
          })}
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        {values.length}/{max} selected. Select up to {max} return columns.
      </p>
    </div>
  );
};
