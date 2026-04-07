import { buildCitation } from '../citation.js';
import { buildMeta } from '../metadata.js';
import { validateJurisdiction } from '../jurisdiction.js';
import type { Database } from '../db.js';

interface SpreadingArgs {
  manure_type: string;
  land_type: string;
  nitratkansligt?: boolean;
  jurisdiction?: string;
}

export function handleGetSpreadingWindows(db: Database, args: SpreadingArgs) {
  const jv = validateJurisdiction(args.jurisdiction);
  if (!jv.valid) return jv.error;

  // Search nitratkansliga_omraden for matching material and conditions
  let sql = `SELECT * FROM nitratkansliga_omraden WHERE jurisdiction = ?`;
  const params: unknown[] = [jv.jurisdiction];

  sql += ' AND LOWER(material_type) LIKE ?';
  params.push(`%${args.manure_type.toLowerCase()}%`);

  const rows = db.all<{
    id: number;
    activity: string;
    material_type: string | null;
    soil_type: string | null;
    closed_period_start: string | null;
    closed_period_end: string | null;
    max_application_rate: string | null;
    conditions: string | null;
    regulation_ref: string | null;
  }>(sql, params);

  // Filter by land type if present in conditions or soil_type
  const filtered = rows.filter(row => {
    if (!args.land_type) return true;
    const lt = args.land_type.toLowerCase();
    const matchesSoil = row.soil_type?.toLowerCase().includes(lt);
    const matchesCondition = row.conditions?.toLowerCase().includes(lt);
    const matchesActivity = row.activity.toLowerCase().includes(lt);
    return matchesSoil || matchesCondition || matchesActivity || !row.soil_type;
  });

  const windows = filtered.map(row => ({
    activity: row.activity,
    material_type: row.material_type,
    soil_type: row.soil_type,
    closed_period: row.closed_period_start && row.closed_period_end
      ? { start: row.closed_period_start, end: row.closed_period_end }
      : null,
    open_period: row.closed_period_start && row.closed_period_end
      ? `Spreading allowed outside ${row.closed_period_start} - ${row.closed_period_end}`
      : 'No closed period — check conditions',
    max_application_rate: row.max_application_rate,
    conditions: row.conditions,
    regulation_ref: row.regulation_ref,
  }));

  const nitratkansligtNote = args.nitratkansligt
    ? 'Rules shown are for nitratkansliga omraden (nitrate-sensitive areas). Stricter limits apply.'
    : 'Results include general rules. If the farm is in a nitratkansligt omrade, additional restrictions apply — set nitratkansligt=true.';

  if (windows.length === 0) {
    return {
      query: args,
      jurisdiction: jv.jurisdiction,
      results_count: 0,
      message: `No spreading window data found for manure type '${args.manure_type}' on '${args.land_type}'. ` +
        'Try "stallgodsel", "flytgodsel", "handelsgodsel", or "urea".',
      _citation: buildCitation(`SE spreading windows — ${args.manure_type ?? ''}`, `spreading windows (${args.manure_type ?? ''})`, 'get_spreading_windows', { manure_type: String(args.manure_type ?? '') }, 'https://jordbruksverket.se/lagar-och-regler'),
      _meta: buildMeta({ source_url: 'https://jordbruksverket.se/lagar-och-regler' }),
    };
  }

  return {
    query: args,
    jurisdiction: jv.jurisdiction,
    nitratkansligt_note: nitratkansligtNote,
    results_count: windows.length,
    spreading_windows: windows,
    _citation: buildCitation(`SE spreading windows — ${args.manure_type ?? ''}`, `spreading windows (${args.manure_type ?? ''})`, 'get_spreading_windows', { manure_type: String(args.manure_type ?? '') }, 'https://jordbruksverket.se/lagar-och-regler'),
    _meta: buildMeta({ source_url: 'https://jordbruksverket.se/lagar-och-regler' }),
  };
}
