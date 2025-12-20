import React, { useMemo, useState } from "react";
import { useRecycle } from "@/contexts/RecycleContext";
import { useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

// Helper to format timestamp - database stores in IST so just format it
// Don't convert timezone since it's already in IST
// Helper to format timestamp - database stores in IST so just format it
// Don't convert timezone since it's already in IST
function formatTimestamp(dateValue: string | Date | null | undefined): string {
  if (!dateValue) return '-';

  try {
    if (typeof dateValue === 'string') {
      const s = dateValue.trim();

      // Case 1: MySQL style "2025-11-22 19:39:20"
      if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(s)) {
        const [datePart, timePart] = s.split(' '); // ["2025-11-22", "19:39:20"]
        const [year, month, day] = datePart.split('-');
        return `${day}/${month}/${year}, ${timePart}`;
      }

      // Case 2: ISO without timezone or with extra stuff
      // e.g. "2025-11-22T19:39:20", "2025-11-22T19:39:20.000Z"
      if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(s)) {
        const [datePart, timeAndRest] = s.split('T');
        // strip milliseconds / Z / +offset
        const timePart = timeAndRest.split(/[.,Z+]/)[0]; // "19:39:20"
        const [year, month, day] = datePart.split('-');
        return `${day}/${month}/${year}, ${timePart}`;
      }

      // Already formatted like "22/11/2025, 19:39:20"
      if (s.includes('/')) {
        return s;
      }

      // Fallback: just return raw string
      return s;
    }

    // If a real Date object is passed, just format it as-is (local time)
    if (dateValue instanceof Date && !isNaN(dateValue.getTime())) {
      return formatDateOnly(dateValue);
    }

    return 'Invalid date';
  } catch {
    return 'Invalid date';
  }
}

function formatDateOnly(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${day}/${month}/${year}, ${hours}:${minutes}:${seconds}`;
}


export default function RecycleBin() {
  const { items, remove, add, clear, refresh } = useRecycle();
  const queryClient = useQueryClient();
  const [confirmUid, setConfirmUid] = useState<string | null>(null);
  const [confirmType, setConfirmType] = useState<'permanent' | 'restore' | null>(null);

  const grouped = useMemo(() => {
    const map: Record<string, typeof items> = {};
    items.forEach((it) => {
      if (!map[it.entityType]) map[it.entityType] = [];
      map[it.entityType].push(it);
    });
    return map;
  }, [items]);

  function handleRestore(uid: string) {
    // Try server restore, then invalidate relevant queries so restored entity
    // appears immediately without a full page refresh. Fallback: remove locally.
    (async () => {
      try {
        const res = await fetch(`/api/recycle/${uid}/restore`, { method: 'POST' });
        if (!res.ok) throw new Error('restore failed');
        const body = await res.json().catch(() => null);
        // remove recycle entry from UI
        await remove(uid);
        // invalidate queries depending on entity type so lists refresh
        const entityType = body?.entityType || null;
        if (entityType) {
          switch (entityType) {
            case 'leads':
              queryClient.invalidateQueries({ queryKey: ['/api/leads'] });
              break;
            case 'samples':
              queryClient.invalidateQueries({ queryKey: ['/api/samples'] });
              break;
            case 'finance_records':
            case 'finance':
              queryClient.invalidateQueries({ queryKey: ['/api/finance-sheet'] });
              queryClient.invalidateQueries({ queryKey: ['/api/finance/stats'] });
              break;
            case 'lab_processing':
              queryClient.invalidateQueries({ queryKey: ['/api/lab-processing'] });
              break;
            case 'users':
              queryClient.invalidateQueries({ queryKey: ['/api/users'] });
              break;
            case 'genetic_counselling':
              queryClient.invalidateQueries({ queryKey: ['/api/gc-registration'] });
              break;
            default:
              // generic invalidation for unknown types
              queryClient.invalidateQueries();
          }
        } else {
          queryClient.invalidateQueries();
        }
        // notify any other listeners that recycle state changed
        window.dispatchEvent(new Event('ll:recycle:update'));
        window.dispatchEvent(new CustomEvent('ll:data:changed', { detail: { action: 'restore', uid } }));
      } catch (err) {
        // fallback: just remove from recycle list locally
        await remove(uid);
      }
    })();
  }

  function handlePermanentDelete(uid: string) {
    // Permanently delete via server (remove also updates UI)
    (async () => {
      await remove(uid);
      // notify other pages to refresh lists if needed
      window.dispatchEvent(new Event('ll:recycle:update'));
      window.dispatchEvent(new CustomEvent('ll:data:changed', { detail: { action: 'permanent-delete', uid } }));
    })();
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Recycle bin</h1>
        <div className="flex items-center space-x-2">
          {items.length > 0 && (
            <Button variant="destructive" onClick={() => { if (confirmUid === 'clear') { setConfirmType('permanent'); } setConfirmUid('clear'); }}>
              Empty Recycle Bin
            </Button>
          )}
        </div>
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-gray-600 dark:text-gray-300">No deleted items to display.</p>
      ) : (
        <div className="space-y-4">
          {Object.keys(grouped).map((entityType) => (
            <div key={entityType} className="rounded-md border bg-card p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="text-sm font-medium">{entityType}</div>
                <div className="text-sm text-muted-foreground">{grouped[entityType].length} item(s)</div>
              </div>
              <div className="space-y-2">
                {grouped[entityType].map((it) => (
                    <div key={it.uid} className="flex items-center justify-between gap-4 p-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800">
                    <div className="flex-1">
                      <div className="font-medium">{it.name ?? `${it.entityType} — ${it.entityId}`}</div>
                      <div className="text-xs text-muted-foreground space-y-1">
                        <div>Deleted at {formatTimestamp(it.deletedAt)}{it.originalPath ? ` • from ${it.originalPath}` : ''}</div>
                        {it.createdBy && <div>Deleted by {it.createdBy}</div>}
                      </div>
                    </div>
                    <div className="action-buttons flex items-center space-x-2 h-full bg-white dark:bg-gray-900 px-2 py-1">
                      <Button size="sm" className="min-w-[40px] px-2 py-1 text-sm" onClick={() => { handleRestore(it.uid); }}>
                        <span className="sm:hidden">Restore</span>
                        <span className="hidden sm:inline">Restore</span>
                      </Button>
                      <Button size="sm" variant="destructive" className="min-w-[40px] px-2 py-1 text-sm" onClick={() => { setConfirmUid(it.uid); setConfirmType('permanent'); }}>
                        <span className="sm:hidden">Delete</span>
                        <span className="hidden sm:inline">Delete permanently</span>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Confirm dialog for permanent delete / clear */}
      <Dialog open={!!confirmUid && confirmType !== null} onOpenChange={() => { setConfirmUid(null); setConfirmType(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{confirmType === 'permanent' ? 'Permanently delete item' : 'Restore item'}</DialogTitle>
            <DialogDescription>
              {confirmType === 'permanent'
                ? 'This will permanently remove the item from the recycle bin. This action cannot be undone.'
                : 'Restore the item back to its original location (frontend-only action).'}
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 flex justify-end space-x-2">
            <Button variant="outline" onClick={() => { setConfirmUid(null); setConfirmType(null); }}>Cancel</Button>
            <Button variant={confirmType === 'permanent' ? 'destructive' : 'default'} onClick={() => {
              if (!confirmUid) return;
              if (confirmUid === 'clear') {
                if (confirmType === 'permanent') clear();
              } else if (confirmType === 'permanent') {
                handlePermanentDelete(confirmUid);
              } else if (confirmType === 'restore') {
                handleRestore(confirmUid);
              }
              setConfirmUid(null);
              setConfirmType(null);
            }}>
              {confirmType === 'permanent' ? 'Delete permanently' : 'Confirm'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

