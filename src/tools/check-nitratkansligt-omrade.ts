import { buildMeta } from '../metadata.js';
import { validateJurisdiction } from '../jurisdiction.js';
import type { Database } from '../db.js';

interface NvzArgs {
  activity: string;
  season?: string;
  soil_type?: string;
  jurisdiction?: string;
}

export function handleCheckNitratkansligtOmrade(db: Database, args: NvzArgs) {
  const jv = validateJurisdiction(args.jurisdiction);
  if (!jv.valid) return jv.error;

  let sql = `SELECT * FROM nitratkansliga_omraden WHERE jurisdiction = ?`;
  const params: unknown[] = [jv.jurisdiction];

  // Match activity with LIKE for flexible matching
  sql += ' AND LOWER(activity) LIKE ?';
  params.push(`%${args.activity.toLowerCase()}%`);

  if (args.soil_type) {
    sql += ' AND (soil_type IS NULL OR LOWER(soil_type) LIKE ?)';
    params.push(`%${args.soil_type.toLowerCase()}%`);
  }

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

  // If season provided, highlight which rules are active
  const enriched = rows.map(row => {
    let period_active: boolean | null = null;
    if (args.season && row.closed_period_start && row.closed_period_end) {
      const seasonMonth = seasonToMonth(args.season);
      if (seasonMonth !== null) {
        const start = monthIndex(row.closed_period_start);
        const end = monthIndex(row.closed_period_end);
        if (start !== null && end !== null) {
          period_active = isInClosedPeriod(seasonMonth, start, end);
        }
      }
    }
    return {
      activity: row.activity,
      material_type: row.material_type,
      soil_type: row.soil_type,
      closed_period: row.closed_period_start && row.closed_period_end
        ? `${row.closed_period_start} - ${row.closed_period_end}`
        : null,
      currently_in_closed_period: period_active,
      max_application_rate: row.max_application_rate,
      conditions: row.conditions,
      regulation_ref: row.regulation_ref,
    };
  });

  if (enriched.length === 0) {
    return {
      query: args,
      jurisdiction: jv.jurisdiction,
      results_count: 0,
      message: `No nitratkansligt omrade rules found for activity '${args.activity}'. ` +
        'Try broader terms like "godsel", "stallgodsel", or "flytgodsel".',
      _meta: buildMeta({ source_url: 'https://jordbruksverket.se/lagar-och-regler' }),
    };
  }

  return {
    query: args,
    jurisdiction: jv.jurisdiction,
    results_count: enriched.length,
    rules: enriched,
    _meta: buildMeta({ source_url: 'https://jordbruksverket.se/lagar-och-regler' }),
  };
}

function seasonToMonth(season: string): number | null {
  const s = season.toLowerCase();
  const map: Record<string, number> = {
    jan: 1, january: 1, januari: 1,
    feb: 2, february: 2, februari: 2,
    mar: 3, march: 3, mars: 3,
    apr: 4, april: 4,
    may: 5, maj: 5,
    jun: 6, june: 6, juni: 6,
    jul: 7, july: 7, juli: 7,
    aug: 8, august: 8, augusti: 8,
    sep: 9, september: 9,
    oct: 10, october: 10, oktober: 10,
    nov: 11, november: 11,
    dec: 12, december: 12,
    winter: 1, vinter: 1,
    spring: 4, var: 4,
    summer: 7, sommar: 7,
    autumn: 10, host: 10,
  };
  return map[s] ?? null;
}

function monthIndex(monthStr: string): number | null {
  // Handles "Nov 1" or "Feb 28" or just "Nov" or "November"
  const match = monthStr.match(/^([A-Za-z]+)/);
  if (!match) return null;
  return seasonToMonth(match[1]);
}

function isInClosedPeriod(month: number, startMonth: number, endMonth: number): boolean {
  if (startMonth <= endMonth) {
    return month >= startMonth && month <= endMonth;
  }
  // Wraps around year boundary (e.g. Nov-Feb)
  return month >= startMonth || month <= endMonth;
}
