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
                                    {columns.map((col, colIndex) => (
                                        <TableCell key={colIndex} className={col.className}>
                                            {col.cell
                                                ? col.cell(row)
                                                : col.accessorKey
                                                    ? String((row as any)[col.accessorKey] ?? '-')
                                                    : '-'}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
