import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";

interface TablePreviewProps {
  data: any[];
  title: string;
  maxRows?: number;
}

export const TablePreview = ({ data, title, maxRows = 5 }: TablePreviewProps) => {
  if (!data || data.length === 0) {
    return null;
  }

  const headers = Object.keys(data[0]);
  const displayData = data.slice(0, maxRows);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        <span className="text-sm text-muted-foreground">
          Showing {displayData.length} of {data.length} rows
        </span>
      </div>
      <ScrollArea className="rounded-lg border border-border bg-card shadow-soft">
        <div className="max-h-[300px]">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                {headers.map((header, index) => (
                  <TableHead key={index} className="font-semibold text-foreground">
                    {header}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayData.map((row, rowIndex) => (
                <TableRow key={rowIndex} className="hover:bg-muted/30">
                  {headers.map((header, cellIndex) => (
                    <TableCell key={cellIndex} className="text-foreground">
                      {row[header]}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </ScrollArea>
    </div>
  );
};
