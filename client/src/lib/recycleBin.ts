export type RecycleItem = {
  uid: string; // unique id for the recycle entry
  entityType: string; // e.g. 'leads', 'bioinformatics'
  entityId: string; // original id of the item
  name?: string; // human readable name/title
  originalPath?: string; // optional route where item belonged
  data: any; // full item payload
  deletedAt: string; // ISO timestamp
  createdBy?: string; // user who deleted the item
};

const STORAGE_KEY = 'll_recycle_bin_v1';

function readStorage(): RecycleItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as RecycleItem[];
  } catch (err) {
    console.warn('Failed to read recycle storage', err);
    return [];
  }
}

function writeStorage(items: RecycleItem[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    // dispatch storage event for same-window subscribers
    window.dispatchEvent(new Event('ll:recycle:update'));
  } catch (err) {
    console.warn('Failed to write recycle storage', err);
  }
}

export function listRecycle(): RecycleItem[] {
  return readStorage();
}

export function addToRecycle(payload: {
  entityType: string;
  entityId: string;
  name?: string;
  originalPath?: string;
  data: any;
  deletedAt?: string; // optional: use database timestamp if provided
}): RecycleItem {
  const items = readStorage();
  const uid = `${payload.entityType}::${payload.entityId}::${Date.now()}::${Math.floor(Math.random()*10000)}`;
  const item: RecycleItem = {
    uid,
    entityType: payload.entityType,
    entityId: payload.entityId,
    name: payload.name,
    originalPath: payload.originalPath,
    data: payload.data,
    deletedAt: payload.deletedAt || new Date().toISOString(),
  };
  items.unshift(item);
  writeStorage(items);
  return item;
}

export function removeFromRecycle(uid: string): void {
  const items = readStorage().filter(i => i.uid !== uid);
  writeStorage(items);
}

export function clearRecycle(): void {
  writeStorage([]);
}
