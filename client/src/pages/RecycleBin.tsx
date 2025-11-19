import React, { useMemo, useState } from "react";
import { useRecycle } from "@/contexts/RecycleContext";
import { useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

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
              queryClient.invalidateQueries({ queryKey: ['/api/finance/records'] });
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
                    <div>
                      <div className="font-medium">{it.name ?? `${it.entityType} — ${it.entityId}`}</div>
                      <div className="text-xs text-muted-foreground">Deleted at {new Date(it.deletedAt).toLocaleString()}{it.originalPath ? ` • from ${it.originalPath}` : ''}</div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button size="sm" onClick={() => { handleRestore(it.uid); }}>Restore</Button>
                      <Button size="sm" variant="destructive" onClick={() => { setConfirmUid(it.uid); setConfirmType('permanent'); }}>Delete permanently</Button>
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

