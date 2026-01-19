import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function sortData<T>(data: T[], sortKey: keyof T | null, sortDir: 'asc' | 'desc'): T[] {
  if (!sortKey) return data;

  return [...data].sort((a, b) => {
    const valA = a[sortKey];
    const valB = b[sortKey];

    if (valA === valB) return 0;
    if (valA === null || valA === undefined) return 1; // Nulls last
    if (valB === null || valB === undefined) return -1;

    const compareVal = (() => {
      if (typeof valA === 'number' && typeof valB === 'number') {
        return valA - valB;
      }
      // Handle dates if they are Date objects
      if (valA instanceof Date && valB instanceof Date) {
        return valA.getTime() - valB.getTime();
      }

      const strA = String(valA).toLowerCase();
      const strB = String(valB).toLowerCase();
      if (strA < strB) return -1;
      if (strA > strB) return 1;
      return 0;
    })();

    return sortDir === 'asc' ? compareVal : -compareVal;
  });
}
