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
    return {
      uid: entry.id,
      entityType: entry.entityType,
      entityId: entry.entityId ?? (entry.data && (entry.data.id || entry.data.sampleId || entry.data.invoiceNumber)) ?? '',
  name: entry.data ? (entry.data.name || entry.data.organization || entry.data.gcName || entry.data.sampleId) : undefined,
      originalPath: entry.originalPath ?? undefined,
      data: entry.data ?? null,
      deletedAt: entry.deletedAt ? new Date(entry.deletedAt).toISOString() : new Date().toISOString(),
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
      try { _addToRecycle({ entityType: payload.entityType, entityId: payload.entityId, name: payload.name, originalPath: payload.originalPath, data: payload.data }); } catch (e) { /* ignore */ }
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
