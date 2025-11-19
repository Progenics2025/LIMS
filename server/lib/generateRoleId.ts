export function generateRoleId(role: string) {
  // Map roles to short codes
  const roleMap: Record<string, string> = {
    administration: 'AD',
    admin: 'AD',
    manager: 'MG',
    discovery: 'DG',
    production: 'PG',
    finance: 'FN',
    hr: 'HR'
  };

  const code =
    roleMap[role?.toLowerCase()] ||
    (role ? role.substring(0, 2).toUpperCase() : 'AD'); // fallback if unmapped

  const now = new Date();

  const yy = String(now.getFullYear()).slice(2);     // last two digits
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const hh = String(now.getHours()).padStart(2, '0');
  const min = String(now.getMinutes()).padStart(2, '0');

  return `${yy}${code}${mm}${dd}${hh}${min}`;
}

export default generateRoleId;
