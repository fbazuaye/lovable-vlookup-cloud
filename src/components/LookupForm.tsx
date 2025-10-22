import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, Sparkles } from "lucide-react";
import { useState } from "react";

interface LookupFormProps {
  onSingleLookup: (value: string) => void;
  onBulkLookup: () => void;
  onAiSuggest: () => void;
  disabled?: boolean;
  isAiLoading?: boolean;
}

export const LookupForm = ({ onSingleLookup, onBulkLookup, onAiSuggest, disabled, isAiLoading }: LookupFormProps) => {
  const [lookupValue, setLookupValue] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (lookupValue.trim()) {
      onSingleLookup(lookupValue);
    }
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="space-y-2">
          <Label htmlFor="lookup-value" className="text-sm font-medium text-foreground">
            Single Value Lookup
          </Label>
          <div className="flex gap-2">
            <Input
              id="lookup-value"
              type="text"
              value={lookupValue}
              onChange={(e) => setLookupValue(e.target.value)}
              placeholder="Enter value to lookup..."
              className="flex-1 bg-card border-border"
              disabled={disabled}
            />
            <Button type="submit" disabled={disabled || !lookupValue.trim()} className="bg-primary hover:bg-primary/90">
              <Search className="h-4 w-4 mr-2" />
              Lookup
            </Button>
          </div>
        </div>
      </form>

      <div className="flex gap-2">
        <Button
          onClick={onBulkLookup}
          disabled={disabled}
          className="flex-1 bg-accent hover:bg-accent/90 text-accent-foreground"
        >
          Perform Bulk VLOOKUP
        </Button>
        <Button
          onClick={onAiSuggest}
          disabled={disabled || isAiLoading}
          variant="outline"
          className="border-primary text-primary hover:bg-primary/10"
        >
          <Sparkles className="h-4 w-4 mr-2" />
          {isAiLoading ? "Analyzing..." : "AI Suggest Columns"}
        </Button>
      </div>
    </div>
  );
};
