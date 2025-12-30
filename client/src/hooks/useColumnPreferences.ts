import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export interface ColumnConfig {
    id: string;
    label: string;
    defaultVisible?: boolean;
    canHide?: boolean; // false = always visible (e.g., Actions column)
}

export interface ColumnPreferences {
    visibleColumns: string[];
    columnOrder: string[];
}

const PREFS_KEY_PREFIX = 'lims_col_prefs_';

function getStorageKey(tableId: string, userId?: string): string {
    return `${PREFS_KEY_PREFIX}${tableId}_${userId || 'guest'}`;
}

export function useColumnPreferences(tableId: string, columns: ColumnConfig[]) {
    const { user } = useAuth();
    const userId = user?.id?.toString();

    // Initialize with defaults
    const getDefaultPrefs = useCallback((): ColumnPreferences => {
        return {
            visibleColumns: columns.filter(c => c.defaultVisible !== false).map(c => c.id),
            columnOrder: columns.map(c => c.id),
        };
    }, [columns]);

    const [prefs, setPrefs] = useState<ColumnPreferences>(getDefaultPrefs);
    const [isLoaded, setIsLoaded] = useState(false);

    // Load from localStorage on mount
    useEffect(() => {
        try {
            const key = getStorageKey(tableId, userId);
            const stored = localStorage.getItem(key);
            if (stored) {
                const parsed = JSON.parse(stored) as ColumnPreferences;

                // Validate and merge with current columns (in case columns changed)
                const validOrder = parsed.columnOrder.filter(id => columns.some(c => c.id === id));
                const newColumnIds = columns.filter(c => !parsed.columnOrder.includes(c.id)).map(c => c.id);

                const validVisible = parsed.visibleColumns.filter(id => columns.some(c => c.id === id));
                // Add new columns that are visible by default
                const newVisibleColumns = columns
                    .filter(c => !parsed.columnOrder.includes(c.id) && c.defaultVisible !== false)
                    .map(c => c.id);

                setPrefs({
                    columnOrder: [...validOrder, ...newColumnIds],
                    visibleColumns: [...validVisible, ...newVisibleColumns],
                });
            } else {
                setPrefs(getDefaultPrefs());
            }
        } catch (e) {
            console.warn('Failed to load column preferences:', e);
            setPrefs(getDefaultPrefs());
        }
        setIsLoaded(true);
    }, [tableId, userId, columns, getDefaultPrefs]);

    // Save to localStorage whenever prefs change
    useEffect(() => {
        if (!isLoaded) return; // Don't save during initial load
        try {
            const key = getStorageKey(tableId, userId);
            localStorage.setItem(key, JSON.stringify(prefs));
        } catch (e) {
            console.warn('Failed to save column preferences:', e);
        }
    }, [tableId, userId, prefs, isLoaded]);

    // Toggle a column's visibility
    const toggleColumn = useCallback((columnId: string) => {
        const col = columns.find(c => c.id === columnId);
        if (!col || col.canHide === false) return;

        setPrefs(prev => {
            const isVisible = prev.visibleColumns.includes(columnId);
            return {
                ...prev,
                visibleColumns: isVisible
                    ? prev.visibleColumns.filter(id => id !== columnId)
                    : [...prev.visibleColumns, columnId],
            };
        });
    }, [columns]);

    // Set multiple columns visible/hidden
    const setColumnVisibility = useCallback((columnId: string, visible: boolean) => {
        const col = columns.find(c => c.id === columnId);
        if (!col || col.canHide === false) return;

        setPrefs(prev => {
            const isCurrentlyVisible = prev.visibleColumns.includes(columnId);
            if (visible && !isCurrentlyVisible) {
                return { ...prev, visibleColumns: [...prev.visibleColumns, columnId] };
            } else if (!visible && isCurrentlyVisible) {
                return { ...prev, visibleColumns: prev.visibleColumns.filter(id => id !== columnId) };
            }
            return prev;
        });
    }, [columns]);

    // Reorder columns
    const moveColumn = useCallback((fromIndex: number, toIndex: number) => {
        setPrefs(prev => {
            const newOrder = [...prev.columnOrder];
            const [moved] = newOrder.splice(fromIndex, 1);
            newOrder.splice(toIndex, 0, moved);
            return { ...prev, columnOrder: newOrder };
        });
    }, []);

    // Reset to defaults
    const resetToDefaults = useCallback(() => {
        setPrefs(getDefaultPrefs());
    }, [getDefaultPrefs]);

    // Show all columns
    const showAllColumns = useCallback(() => {
        setPrefs(prev => ({
            ...prev,
            visibleColumns: columns.map(c => c.id),
        }));
    }, [columns]);

    // Show only essential columns (compact view)
    const showCompactView = useCallback(() => {
        const essentialColumns = columns
            .filter(c => c.canHide === false || c.defaultVisible === true)
            .map(c => c.id);
        setPrefs(prev => ({
            ...prev,
            visibleColumns: essentialColumns.length > 0 ? essentialColumns : columns.slice(0, 8).map(c => c.id),
        }));
    }, [columns]);

    // Get ordered and filtered columns
    const getVisibleColumns = useCallback((): ColumnConfig[] => {
        return prefs.columnOrder
            .map(id => columns.find(c => c.id === id))
            .filter((c): c is ColumnConfig => c !== undefined && prefs.visibleColumns.includes(c.id));
    }, [columns, prefs]);

    // Check if a column is visible
    const isColumnVisible = useCallback((columnId: string): boolean => {
        return prefs.visibleColumns.includes(columnId);
    }, [prefs.visibleColumns]);

    return {
        prefs,
        isLoaded,
        toggleColumn,
        setColumnVisibility,
        moveColumn,
        resetToDefaults,
        showAllColumns,
        showCompactView,
        getVisibleColumns,
        isColumnVisible,
        visibleCount: prefs.visibleColumns.length,
        totalCount: columns.filter(c => c.canHide !== false).length,
    };
}

export default useColumnPreferences;
