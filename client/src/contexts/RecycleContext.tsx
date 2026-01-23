import React, { createContext, useContext, useEffect, useState } from 'react';
import type { RecycleItem } from '@/lib/recycleBin';
import { listRecycle as _listRecycle, addToRecycle as _addToRecycle, removeFromRecycle as _removeFromRecycle, clearRecycle as _clearRecycle } from '@/lib/recycleBin';

type RecycleContextType = {
    items: RecycleItem[];
    refresh: () => Promise<void>;
    add: (payload: { entityType: string; entityId: string; name?: string; originalPath?: string; data: any; deletedAt?: string }) => Promise<RecycleItem>;
    remove: (uid: string) => Promise<void>;
    clear: () => Promise<void>;
};

const RecycleContext = createContext<RecycleContextType | null>(null);

export const RecycleProvider = ({ children }: { children: React.ReactNode }) => {
    const [items, setItems] = useState<RecycleItem[]>(() => _listRecycle());

    const mapServer = (entry: any): RecycleItem => {
        // Handle deletedAt timestamp from database
        // Database stores as DATETIME in IST (2025-11-22 19:15:54)
        // We need to treat it as IST, not convert it to UTC
        let deletedAtStr = '';
        if (entry.deletedAt) {
            if (typeof entry.deletedAt === 'string') {
                // If it's a string like "2025-11-22 19:15:54", treat as IST
                // Append 'T' to make it valid ISO format for parsing
                if (entry.deletedAt.includes('T') || entry.deletedAt.includes('Z')) {
                    deletedAtStr = entry.deletedAt;
                } else {
                    // Convert "2025-11-22 19:15:54" → "2025-11-22T19:15:54"
                    deletedAtStr = entry.deletedAt.replace(' ', 'T');
                }
            } else if (entry.deletedAt instanceof Date) {
                deletedAtStr = entry.deletedAt.toISOString();
            } else {
                // Treat as IST datetime string
                deletedAtStr = new Date(entry.deletedAt).toISOString();
            }
        } else {
            deletedAtStr = new Date().toISOString();
        }

        return {
            uid: entry.id,
            entityType: entry.entityType,
            entityId: entry.entityId ?? (entry.data && (entry.data.id || entry.data.uniqueId || entry.data.sampleId || entry.data.invoiceNumber)) ?? '',
            name: entry.data ? (
                entry.data.name ||
                entry.data.organisationHospital ||
                entry.data.organisation_hospital ||
                entry.data.gcName ||
                entry.data.gc_name ||
                entry.data.sampleId ||
                entry.data.unique_id ||
                entry.data.uniqueId
            ) : undefined,
            originalPath: entry.originalPath ?? undefined,
            data: entry.data ?? null,
            deletedAt: deletedAtStr,
            createdBy: entry.createdBy ?? undefined,
        };
    };

    const refresh = async () => {
        try {
            const res = await fetch('/api/recycle');
            if (!res.ok) throw new Error('server recycle list failed');
            const json = await res.json();
            const mapped = Array.isArray(json) ? json.map(mapServer) : [];
            setItems(mapped);
            return;
        } catch (err) {
            // fallback to local storage
            setItems(_listRecycle());
        }
    };

    useEffect(() => {
        const onUpdate = () => refresh();
        window.addEventListener('ll:recycle:update', onUpdate);
        // initial load from server
        refresh();
        return () => window.removeEventListener('ll:recycle:update', onUpdate);
    }, []);

    const add = async (payload: { entityType: string; entityId: string; name?: string; originalPath?: string; data: any; deletedAt?: string }) => {
        try {
            const res = await fetch('/api/recycle', {
                method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ entityType: payload.entityType, entityId: payload.entityId, data: payload.data, originalPath: payload.originalPath })
            });
            if (!res.ok) throw new Error('server add failed');
            const json = await res.json();
            const it = mapServer(json);
            // update local list
            setItems((s) => [it, ...s]);
            // Pass server's deletedAt timestamp to local storage
            try { _addToRecycle({ entityType: payload.entityType, entityId: payload.entityId, name: payload.name, originalPath: payload.originalPath, data: payload.data, deletedAt: it.deletedAt }); } catch (e) { /* ignore */ }
            return it;
        } catch (err) {
            // fallback: local only
            const it = _addToRecycle(payload);
            setItems(_listRecycle());
            return it;
        }
    };

    const remove = async (uid: string) => {
        try {
            const res = await fetch(`/api/recycle/${uid}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('server delete failed');
            setItems((s) => s.filter(i => i.uid !== uid));
            try { _removeFromRecycle(uid); } catch (e) { /* ignore */ }
        } catch (err) {
            _removeFromRecycle(uid);
            setItems(_listRecycle());
        }
    };

    const clear = async () => {
        try {
            const res = await fetch('/api/recycle');
            if (!res.ok) throw new Error('server list failed');
            const list = await res.json();
            for (const e of list) {
                try {
                    await fetch(`/api/recycle/${e.id}`, { method: 'DELETE' });
                } catch (e) { /* continue */ }
            }
            setItems([]);
            try { _clearRecycle(); } catch (e) { /* ignore */ }
        } catch (err) {
            _clearRecycle();
            setItems([]);
        }
    };

    return (
        <RecycleContext.Provider value={{ items, refresh, add, remove, clear }}>
            {children}
        </RecycleContext.Provider>
    );
};

export function useRecycle() {
    const ctx = useContext(RecycleContext);
    if (!ctx) throw new Error('useRecycle must be used within RecycleProvider');
    return ctx;
}
