import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Settings2, GripVertical, RotateCcw, Eye, EyeOff } from 'lucide-react';
import { cn } from "@/lib/utils";
import { useAuth } from '@/contexts/AuthContext';

export type ColumnDef<T> = {
    id: string; // Unique identifier for the column
    header: string | React.ReactNode;
    accessorKey?: keyof T;
    cell?: (row: T) => React.ReactNode;
    className?: string;
    minWidth?: string;
    isSticky?: 'left' | 'right';
    defaultHidden?: boolean; // Whether column is hidden by default
    canHide?: boolean; // false = column cannot be hidden (e.g., Actions)
};

interface ColumnPreferences {
    order: string[]; // Column IDs in order
    hidden: string[]; // Column IDs that are hidden
}

interface ConfigurableDataTableProps<T> {
    tableId: string; // Unique ID for this table (for storing preferences)
    data: T[];
    columns: ColumnDef<T>[];
    onRowClick?: (row: T) => void;
    isLoading?: boolean;
    emptyMessage?: string;
    rowClassName?: (row: T) => string;
    stickyHeader?: boolean;
    maxHeight?: string;
}

const PREFERENCES_KEY_PREFIX = 'table_column_prefs_';

function getPreferencesKey(tableId: string, userId?: string): string {
    return `${PREFERENCES_KEY_PREFIX}${tableId}_${userId || 'anonymous'}`;
}

function loadPreferences(tableId: string, userId?: string): ColumnPreferences | null {
    try {
        const key = getPreferencesKey(tableId, userId);
        const stored = localStorage.getItem(key);
        if (stored) {
            return JSON.parse(stored);
        }
    } catch (e) {
        console.warn('Failed to load column preferences', e);
    }
    return null;
}

function savePreferences(tableId: string, userId: string | undefined, prefs: ColumnPreferences) {
    try {
        const key = getPreferencesKey(tableId, userId);
        localStorage.setItem(key, JSON.stringify(prefs));
    } catch (e) {
        console.warn('Failed to save column preferences', e);
    }
}

export function ConfigurableDataTable<T>({
    tableId,
    data,
    columns,
    onRowClick,
    isLoading,
    emptyMessage = "No records found",
    rowClassName,
    stickyHeader = true,
    maxHeight = "60vh",
}: ConfigurableDataTableProps<T>) {
    const { user } = useAuth();
    const userId = user?.id?.toString();

    // Initialize column order and hidden state
    const [columnOrder, setColumnOrder] = useState<string[]>(() => columns.map(c => c.id));
    const [hiddenColumns, setHiddenColumns] = useState<Set<string>>(() => {
        return new Set(columns.filter(c => c.defaultHidden).map(c => c.id));
    });
    const [isDragging, setIsDragging] = useState(false);
    const [draggedColumn, setDraggedColumn] = useState<string | null>(null);
    const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

    // Load preferences from localStorage on mount
    useEffect(() => {
        const prefs = loadPreferences(tableId, userId);
        if (prefs) {
            // Validate that all columns exist in the preferences
            const validOrder = prefs.order.filter(id => columns.some(c => c.id === id));
            // Add any new columns that weren't in preferences
            const newColumns = columns.filter(c => !prefs.order.includes(c.id)).map(c => c.id);
            setColumnOrder([...validOrder, ...newColumns]);
            setHiddenColumns(new Set(prefs.hidden.filter(id => columns.some(c => c.id === id))));
        }
    }, [tableId, userId, columns]);

    // Save preferences whenever they change
    useEffect(() => {
        savePreferences(tableId, userId, {
            order: columnOrder,
            hidden: Array.from(hiddenColumns),
        });
    }, [tableId, userId, columnOrder, hiddenColumns]);

    // Get columns in the configured order, filtered by visibility
    const orderedColumns = columnOrder
        .map(id => columns.find(c => c.id === id))
        .filter((c): c is ColumnDef<T> => c !== undefined && !hiddenColumns.has(c.id));

    // Get all hideable columns for the settings menu
    const hideableColumns = columns.filter(c => c.canHide !== false);

    // Toggle column visibility
    const toggleColumnVisibility = (columnId: string) => {
        setHiddenColumns(prev => {
            const next = new Set(prev);
            if (next.has(columnId)) {
                next.delete(columnId);
            } else {
                next.add(columnId);
            }
            return next;
        });
    };

    // Reset to default column configuration
    const resetToDefaults = () => {
        setColumnOrder(columns.map(c => c.id));
        setHiddenColumns(new Set(columns.filter(c => c.defaultHidden).map(c => c.id)));
    };

    // Drag and drop handlers
    const handleDragStart = (e: React.DragEvent, columnId: string) => {
        setIsDragging(true);
        setDraggedColumn(columnId);
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', columnId);
    };

    const handleDragOver = (e: React.DragEvent, columnId: string) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        if (draggedColumn !== columnId) {
            setDragOverColumn(columnId);
        }
    };

    const handleDragLeave = () => {
        setDragOverColumn(null);
    };

    const handleDrop = (e: React.DragEvent, targetColumnId: string) => {
        e.preventDefault();
        if (!draggedColumn || draggedColumn === targetColumnId) {
            setIsDragging(false);
            setDraggedColumn(null);
            setDragOverColumn(null);
            return;
        }

        const currentOrder = [...columnOrder];
        const draggedIndex = currentOrder.indexOf(draggedColumn);
        const targetIndex = currentOrder.indexOf(targetColumnId);

        if (draggedIndex !== -1 && targetIndex !== -1) {
            currentOrder.splice(draggedIndex, 1);
            currentOrder.splice(targetIndex, 0, draggedColumn);
            setColumnOrder(currentOrder);
        }

        setIsDragging(false);
        setDraggedColumn(null);
        setDragOverColumn(null);
    };

    const handleDragEnd = () => {
        setIsDragging(false);
        setDraggedColumn(null);
        setDragOverColumn(null);
    };

    // Count visible vs total columns
    const visibleCount = orderedColumns.length;
    const totalCount = columns.filter(c => c.canHide !== false).length;

    if (isLoading) {
        return <div className="text-center py-8">Loading data...</div>;
    }

    return (
        <div className="space-y-2">
            {/* Column Configuration Toolbar */}
            <div className="flex items-center justify-between px-2 py-1 bg-gray-50 dark:bg-gray-800/50 rounded-lg border">
                <div className="text-sm text-muted-foreground">
                    Showing {visibleCount} of {totalCount} columns
                </div>
                <div className="flex items-center gap-2">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="h-8 gap-2">
                                <Settings2 className="h-4 w-4" />
                                <span className="hidden sm:inline">Columns</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-64 max-h-[400px] overflow-y-auto">
                            <DropdownMenuLabel className="flex items-center justify-between">
                                <span>Toggle Columns</span>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 px-2 text-xs"
                                    onClick={resetToDefaults}
                                >
                                    <RotateCcw className="h-3 w-3 mr-1" />
                                    Reset
                                </Button>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {hideableColumns.map((column) => (
                                <DropdownMenuCheckboxItem
                                    key={column.id}
                                    checked={!hiddenColumns.has(column.id)}
                                    onCheckedChange={() => toggleColumnVisibility(column.id)}
                                    className="flex items-center gap-2"
                                >
                                    {hiddenColumns.has(column.id) ? (
                                        <EyeOff className="h-3 w-3 text-muted-foreground" />
                                    ) : (
                                        <Eye className="h-3 w-3 text-green-600" />
                                    )}
                                    <span className="truncate">
                                        {typeof column.header === 'string' ? column.header : column.id}
                                    </span>
                                </DropdownMenuCheckboxItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Quick hide/show all */}
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 text-xs"
                        onClick={() => {
                            if (hiddenColumns.size > 0) {
                                setHiddenColumns(new Set());
                            } else {
                                setHiddenColumns(new Set(hideableColumns.filter(c => c.defaultHidden).map(c => c.id)));
                            }
                        }}
                    >
                        {hiddenColumns.size > 0 ? 'Show All' : 'Compact View'}
                    </Button>
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <div className={`overflow-y-auto`} style={{ maxHeight }}>
                    <Table>
                        <TableHeader className={cn(
                            stickyHeader && "sticky top-0 bg-white/95 dark:bg-gray-900/95 z-30 border-b border-gray-200 dark:border-gray-700"
                        )}>
                            <TableRow>
                                {orderedColumns.map((col, index) => (
                                    <TableHead
                                        key={col.id}
                                        className={cn(
                                            "whitespace-nowrap font-semibold select-none",
                                            col.className,
                                            col.isSticky === 'left' && "sticky left-0 z-40 bg-white dark:bg-gray-900 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]",
                                            col.isSticky === 'right' && "sticky right-0 z-40 bg-white dark:bg-gray-900 border-l-2",
                                            dragOverColumn === col.id && "bg-blue-100 dark:bg-blue-900/30",
                                            draggedColumn === col.id && "opacity-50"
                                        )}
                                        style={{ minWidth: col.minWidth }}
                                        draggable={!col.isSticky}
                                        onDragStart={(e) => handleDragStart(e, col.id)}
                                        onDragOver={(e) => handleDragOver(e, col.id)}
                                        onDragLeave={handleDragLeave}
                                        onDrop={(e) => handleDrop(e, col.id)}
                                        onDragEnd={handleDragEnd}
                                    >
                                        <div className="flex items-center gap-1">
                                            {!col.isSticky && (
                                                <GripVertical className="h-3 w-3 text-gray-400 cursor-grab hover:text-gray-600 flex-shrink-0" />
                                            )}
                                            <span>{col.header}</span>
                                        </div>
                                    </TableHead>
                                ))}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={orderedColumns.length} className="text-center py-8">
                                        <p className="text-gray-500 dark:text-gray-400">{emptyMessage}</p>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                data.map((row, rowIndex) => (
                                    <TableRow
                                        key={rowIndex}
                                        className={cn(
                                            "hover:bg-opacity-75 dark:hover:bg-opacity-75",
                                            onRowClick && "cursor-pointer",
                                            rowClassName ? rowClassName(row) : ""
                                        )}
                                        onClick={() => onRowClick && onRowClick(row)}
                                    >
                                        {orderedColumns.map((col) => (
                                            <TableCell
                                                key={col.id}
                                                className={cn(
                                                    col.className,
                                                    col.isSticky === 'left' && "sticky left-0 z-20 bg-white dark:bg-gray-900 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]",
                                                    col.isSticky === 'right' && "sticky right-0 z-20 bg-white dark:bg-gray-900 border-l-2"
                                                )}
                                                style={{ minWidth: col.minWidth }}
                                            >
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
        </div>
    );
}

export default ConfigurableDataTable;
