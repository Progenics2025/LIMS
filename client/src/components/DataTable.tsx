import React from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

export type ColumnDef<T> = {
    header: string | React.ReactNode;
    accessorKey?: keyof T;
    cell?: (row: T) => React.ReactNode;
    className?: string;
    // Support rowspan for grouping related records (e.g., multiple samples from same batch)
    // Function returns the number of rows this cell should span, or 0 if it should be hidden
    rowSpan?: (row: T, rowIndex: number, data: T[], getRowSpan?: (r: T, i: number) => number) => number;
};

interface DataTableProps<T> {
    data: T[];
    columns: ColumnDef<T>[];
    onRowClick?: (row: T) => void;
    isLoading?: boolean;
    emptyMessage?: string;
    rowClassName?: (row: T) => string;
}

export function DataTable<T>({
    data,
    columns,
    onRowClick,
    isLoading,
    emptyMessage = "No records found",
    rowClassName,
}: DataTableProps<T>) {
    if (isLoading) {
        return <div className="text-center py-8">Loading data...</div>;
    }

    // Track which rows should be skipped due to rowspan
    const rowSpanMap: { [key: number]: { [key: number]: number } } = {};

    // Calculate rowspan for each cell
    for (let colIndex = 0; colIndex < columns.length; colIndex++) {
        const col = columns[colIndex];
        if (!col.rowSpan) continue;

        for (let rowIndex = 0; rowIndex < data.length; rowIndex++) {
            // Skip if this row is already covered by previous rowspan
            if (rowSpanMap[rowIndex]?.[colIndex]) continue;

            const span = col.rowSpan(data[rowIndex], rowIndex, data, (r, i) => {
                return col.rowSpan ? col.rowSpan(r, i, data, col.rowSpan) : 1;
            });

            if (span > 0) {
                // Mark all affected rows
                if (!rowSpanMap[rowIndex]) rowSpanMap[rowIndex] = {};
                rowSpanMap[rowIndex][colIndex] = span;

                // Mark subsequent rows to skip this cell
                for (let i = 1; i < span; i++) {
                    if (!rowSpanMap[rowIndex + i]) rowSpanMap[rowIndex + i] = {};
                    rowSpanMap[rowIndex + i][colIndex] = -1; // Mark as "skip this cell"
                }
            }
        }
    }

    return (
        <div className="overflow-x-auto">
            <div className="max-h-[60vh] overflow-y-auto">
                <Table>
                    <TableHeader className="sticky top-0 bg-white/95 dark:bg-gray-900/95 z-10 border-b border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300">
                        <TableRow>
                            {columns.map((col, index) => (
                                <TableHead
                                    key={index}
                                    className={cn("whitespace-nowrap font-semibold", col.className)}
                                >
                                    {col.header}
                                </TableHead>
                            ))}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={columns.length} className="text-center py-8">
                                    <p className="text-gray-500 dark:text-gray-400">{emptyMessage}</p>
                                </TableCell>
                            </TableRow>
                        ) : (
                            data.map((row, rowIndex) => (
                                <TableRow
                                    key={rowIndex}
                                    className={cn(
                                        "hover:bg-opacity-75 dark:hover:bg-opacity-75 cursor-pointer",
                                        rowClassName ? rowClassName(row) : ""
                                    )}
                                    onClick={() => onRowClick && onRowClick(row)}
                                >
                                    {columns.map((col, colIndex) => {
                                        // Skip cell if covered by rowspan from previous row
                                        if (rowSpanMap[rowIndex]?.[colIndex] === -1) {
                                            return null;
                                        }

                                        const span = rowSpanMap[rowIndex]?.[colIndex] ?? 1;
                                        return (
                                            <TableCell 
                                                key={colIndex} 
                                                className={col.className}
                                                rowSpan={span > 0 ? span : undefined}
                                            >
                                                {col.cell
                                                    ? col.cell(row)
                                                    : col.accessorKey
                                                        ? String((row as any)[col.accessorKey] ?? '-')
                                                        : '-'}
                                            </TableCell>
                                        );
                                    })}
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
