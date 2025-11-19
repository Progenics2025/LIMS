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
        s.id as s_id,
        s.sample_id as s_sample_id,
        s.*,
        l.*,
        lp.title_unique_id as lp_title_unique_id 
      FROM finance_records fr
      LEFT JOIN samples s ON fr.sample_id = s.id
      LEFT JOIN leads l ON fr.lead_id = l.id
      LEFT JOIN lab_processing lp ON lp.sample_id = s.id
      ${whereClause}
      ${orderClause}
      LIMIT ? OFFSET ?
    `,
    countSql: `
      SELECT COUNT(*) as cnt
      FROM finance_records fr
      LEFT JOIN samples s ON fr.sample_id = s.id
      LEFT JOIN leads l ON fr.lead_id = l.id
      ${whereClause}
    `,
    searchColumns
  };
}