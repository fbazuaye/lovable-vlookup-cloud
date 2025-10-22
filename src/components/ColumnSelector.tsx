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
