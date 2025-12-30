import React from 'react';
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Settings2, RotateCcw, Eye, EyeOff, Columns3, Minimize2, Maximize2 } from 'lucide-react';
import type { ColumnConfig } from '@/hooks/useColumnPreferences';

interface ColumnSettingsProps {
    columns: ColumnConfig[];
    isColumnVisible: (id: string) => boolean;
    toggleColumn: (id: string) => void;
    resetToDefaults: () => void;
    showAllColumns: () => void;
    showCompactView: () => void;
    visibleCount: number;
    totalCount: number;
}

export function ColumnSettings({
    columns,
    isColumnVisible,
    toggleColumn,
    resetToDefaults,
    showAllColumns,
    showCompactView,
    visibleCount,
    totalCount,
}: ColumnSettingsProps) {
    const hideableColumns = columns.filter(c => c.canHide !== false);

    return (
        <div className="flex items-center gap-2 px-2 py-1.5 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700">
            <Columns3 className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-muted-foreground hidden sm:inline">
                {visibleCount} of {totalCount} columns
            </span>

            <div className="flex items-center gap-1 ml-auto">
                {/* Quick toggle buttons */}
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs gap-1"
                    onClick={showCompactView}
                    title="Compact view - show fewer columns"
                >
                    <Minimize2 className="h-3 w-3" />
                    <span className="hidden lg:inline">Compact</span>
                </Button>

                <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs gap-1"
                    onClick={showAllColumns}
                    title="Show all columns"
                >
                    <Maximize2 className="h-3 w-3" />
                    <span className="hidden lg:inline">Show All</span>
                </Button>

                <div className="w-px h-5 bg-gray-300 dark:bg-gray-600 mx-1" />

                {/* Column visibility dropdown */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-7 gap-1.5 bg-white dark:bg-gray-800 shadow-sm hover:shadow"
                        >
                            <Settings2 className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">Columns</span>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        align="end"
                        className="w-72 max-h-[420px] overflow-y-auto shadow-xl border-gray-200 dark:border-gray-700"
                    >
                        <DropdownMenuLabel className="flex items-center justify-between py-2">
                            <span className="flex items-center gap-2">
                                <Settings2 className="h-4 w-4 text-gray-500" />
                                Toggle Columns
                            </span>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 px-2 text-xs text-muted-foreground hover:text-primary"
                                onClick={resetToDefaults}
                            >
                                <RotateCcw className="h-3 w-3 mr-1" />
                                Reset
                            </Button>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />

                        <div className="py-1">
                            {hideableColumns.map((column) => {
                                const visible = isColumnVisible(column.id);
                                return (
                                    <DropdownMenuCheckboxItem
                                        key={column.id}
                                        checked={visible}
                                        onCheckedChange={() => toggleColumn(column.id)}
                                        className="flex items-center gap-2 py-1.5 cursor-pointer"
                                    >
                                        <div className="flex items-center gap-2 flex-1 min-w-0">
                                            {visible ? (
                                                <Eye className="h-3.5 w-3.5 text-green-600 flex-shrink-0" />
                                            ) : (
                                                <EyeOff className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                                            )}
                                            <span className={`truncate ${!visible ? 'text-muted-foreground' : ''}`}>
                                                {column.label}
                                            </span>
                                        </div>
                                    </DropdownMenuCheckboxItem>
                                );
                            })}
                        </div>

                        <DropdownMenuSeparator />
                        <div className="p-2 text-xs text-muted-foreground text-center">
                            💡 Your preferences are saved automatically
                        </div>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    );
}

export default ColumnSettings;
