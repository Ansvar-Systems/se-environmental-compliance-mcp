import { buildMeta } from '../metadata.js';
import { validateJurisdiction } from '../jurisdiction.js';
import type { Database } from '../db.js';

interface BufferStripArgs {
  watercourse_type?: string;
  activity?: string;
  jurisdiction?: string;
}

export function handleCheckBufferStripRules(db: Database, args: BufferStripArgs) {
  const jv = validateJurisdiction(args.jurisdiction);
  if (!jv.valid) return jv.error;

  let sql = `SELECT * FROM buffer_strip_rules WHERE jurisdiction = ?`;
  const params: unknown[] = [jv.jurisdiction];

  if (args.watercourse_type) {
    sql += ' AND LOWER(watercourse_type) LIKE ?';
    params.push(`%${args.watercourse_type.toLowerCase()}%`);
  }

  if (args.activity) {
    sql += ' AND (activity IS NULL OR LOWER(activity) LIKE ?)';
    params.push(`%${args.activity.toLowerCase()}%`);
  }

  const rows = db.all<{
    id: number;
    watercourse_type: string;
    activity: string | null;
    min_width_m: number | null;
    conditions: string | null;
    scheme_payment: string | null;
    regulation_ref: string | null;
  }>(sql, params);

  if (rows.length === 0) {
    return {
      query: args,
      jurisdiction: jv.jurisdiction,
      results_count: 0,
      message: 'No buffer strip rules found for the given filters. ' +
        'Try without filters or use watercourse_type "dike", "vattendrag", or "sjo".',
      _meta: buildMeta({ source_url: 'https://jordbruksverket.se/stod' }),
    };
  }

  const rules = rows.map(row => ({
    watercourse_type: row.watercourse_type,
    activity: row.activity,
    min_width_m: row.min_width_m,
    conditions: row.conditions,
    scheme_payment: row.scheme_payment,
    regulation_ref: row.regulation_ref,
  }));

  return {
    query: args,
    jurisdiction: jv.jurisdiction,
    results_count: rules.length,
    rules,
    _meta: buildMeta({ source_url: 'https://jordbruksverket.se/stod' }),
  };
}
