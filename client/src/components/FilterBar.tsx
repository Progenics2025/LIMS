import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { Calendar as CalendarIcon, X } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface FilterBarProps {
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    dateRange: { from: Date | undefined; to: Date | undefined };
    setDateRange: (range: { from: Date | undefined; to: Date | undefined }) => void;
    dateFilterField: string;
    setDateFilterField: (field: string) => void;
    dateFieldOptions: { label: string; value: string }[];
    totalItems: number;
    pageSize: number;
    setPageSize: (size: number) => void;
    setPage: (page: number) => void;
    placeholder?: string;
    children?: React.ReactNode;
}

export function FilterBar({
    searchQuery,
    setSearchQuery,
    dateRange,
    setDateRange,
    dateFilterField,
    setDateFilterField,
    dateFieldOptions,
    totalItems,
    pageSize,
    setPageSize,
    setPage,
    placeholder = "Search across all fields...",
    children
}: FilterBarProps) {
    return (
        <div className="p-4 flex flex-col gap-4 border-b bg-gray-50/50 dark:bg-gray-800/50">
            <div className="flex flex-col md:flex-row md:items-center gap-4">
                {/* Global Search */}
                <div className="flex-1">
                    <Input
                        placeholder={placeholder}
                        value={searchQuery}
                        onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                        className="w-full bg-white dark:bg-gray-900"
                    />
                </div>

                {/* Custom Filters */}
                {children}

                {/* Date Field Selector */}
                <div className="w-full md:w-[200px]">
                    <Select value={dateFilterField} onValueChange={setDateFilterField}>
                        <SelectTrigger className="bg-white dark:bg-gray-900">
                            <SelectValue placeholder="Filter by date..." />
                        </SelectTrigger>
                        <SelectContent>
                            {dateFieldOptions.map(option => (
                                <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Date Range Picker */}
                <div className="w-full md:w-auto">
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant={"outline"}
                                className={cn(
                                    "w-full md:w-[280px] justify-start text-left font-normal bg-white dark:bg-gray-900",
                                    !dateRange.from && "text-muted-foreground"
                                )}
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {dateRange.from ? (
                                    dateRange.to ? (
                                        <>
                                            {format(dateRange.from, "LLL dd, y")} -{" "}
                                            {format(dateRange.to, "LLL dd, y")}
                                        </>
                                    ) : (
                                        format(dateRange.from, "LLL dd, y")
                                    )
                                ) : (
                                    <span>Pick a date range</span>
                                )}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="end">
                            <Calendar
                                initialFocus
                                mode="range"
                                defaultMonth={dateRange.from}
                                selected={dateRange}
                                onSelect={(range) => setDateRange({ from: range?.from, to: range?.to })}
                                numberOfMonths={2}
                            />
                        </PopoverContent>
                    </Popover>
                </div>

                {/* Clear Filters */}
                {(searchQuery || dateRange.from) && (
                    <Button
                        variant="ghost"
                        onClick={() => {
                            setSearchQuery('');
                            setDateRange({ from: undefined, to: undefined });
                            setPage(1);
                        }}
                        className="px-3"
                    >
                        <X className="h-4 w-4 mr-2" />
                        Clear
                    </Button>
                )}
            </div>

            <div className="flex items-center justify-between text-sm text-muted-foreground">
                <div>
                    Showing {totalItems} records
                </div>
                <div className="flex items-center space-x-2">
                    <Label>Page size</Label>
                    <Select onValueChange={(v) => { setPageSize(parseInt(v || '25', 10)); setPage(1); }} value={String(pageSize)}>
                        <SelectTrigger className="w-[70px] h-8 bg-white dark:bg-gray-900"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="10">10</SelectItem>
                            <SelectItem value="25">25</SelectItem>
                            <SelectItem value="50">50</SelectItem>
                            <SelectItem value="100">100</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
        </div>
    );
}
