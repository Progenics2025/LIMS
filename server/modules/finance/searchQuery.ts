// Safe SQL search helper
export function buildFinanceSearchQuery(searchColumns: string[], q: string, orderBy: string | null = null, sortDir: 'asc' | 'desc' = 'desc') {
  const whereClause = searchColumns.length ? `WHERE ${searchColumns.map(col => `${col} LIKE ?`).join(' OR ')}` : '';
  
  const orderClause = orderBy 
    ? `ORDER BY ${orderBy} ${sortDir === 'asc' ? 'ASC' : 'DESC'}` 
    : `ORDER BY fr.created_at DESC`;

    return {
    sql: `
      SELECT 
        fr.*,
        s.organisation_hospital AS sample_organisation,
        l.organisation_hospital AS lead_organisation
      FROM finance_sheet fr
      LEFT JOIN sample_tracking s ON s.project_id = fr.project_id
      LEFT JOIN lead_management l ON l.project_id = fr.project_id
      ${whereClause}
      ${orderClause}
      LIMIT ? OFFSET ?
    `,
    countSql: `
      SELECT COUNT(DISTINCT fr.id) as cnt
      FROM finance_sheet fr
      LEFT JOIN sample_tracking s ON s.project_id = fr.project_id
      LEFT JOIN lead_management l ON l.project_id = fr.project_id
      ${whereClause}
    `,
    searchColumns
  };
}