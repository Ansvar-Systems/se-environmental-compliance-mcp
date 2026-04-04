import { buildMeta } from '../metadata.js';
import { validateJurisdiction } from '../jurisdiction.js';
import type { Database } from '../db.js';

interface AbstractionArgs {
  source_type?: string;
  volume_m3_per_day?: number;
  jurisdiction?: string;
}

export function handleGetAbstractionRules(db: Database, args: AbstractionArgs) {
  const jv = validateJurisdiction(args.jurisdiction);
  if (!jv.valid) return jv.error;

  let sql = `SELECT * FROM abstraction_rules WHERE jurisdiction = ?`;
  const params: unknown[] = [jv.jurisdiction];

  if (args.source_type) {
    sql += ' AND LOWER(source_type) LIKE ?';
    params.push(`%${args.source_type.toLowerCase()}%`);
  }

  const rows = db.all<{
    id: number;
    source_type: string | null;
    threshold_m3_per_day: number | null;
    licence_required: number | null;
    exemptions: string | null;
    conditions: string | null;
  }>(sql, params);

  // Enrich with volume-based licence determination
  const enriched = rows.map(row => {
    let licence_determination: string | null = null;
    if (args.volume_m3_per_day !== undefined && row.threshold_m3_per_day !== null) {
      licence_determination = args.volume_m3_per_day > row.threshold_m3_per_day
        ? 'Licence/permit likely required (volume exceeds threshold)'
        : 'Notification to Lansstyrelsen may be sufficient (volume below threshold)';
    }

    return {
      source_type: row.source_type,
      threshold_m3_per_day: row.threshold_m3_per_day,
      licence_required: row.licence_required === 1,
      exemptions: row.exemptions,
      conditions: row.conditions,
      volume_assessment: licence_determination,
    };
  });

  if (enriched.length === 0) {
    return {
      query: args,
      jurisdiction: jv.jurisdiction,
      results_count: 0,
      message: 'No water abstraction rules found. ' +
        'Try source_type "ytvatten", "grundvatten", or "vattenverksamhet".',
      _meta: buildMeta({ source_url: 'https://www.havochvatten.se/regelverk.html' }),
    };
  }

  return {
    query: args,
    jurisdiction: jv.jurisdiction,
    results_count: enriched.length,
    rules: enriched,
    _meta: buildMeta({ source_url: 'https://www.havochvatten.se/regelverk.html' }),
  };
}
