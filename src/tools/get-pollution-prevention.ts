import { buildMeta } from '../metadata.js';
import { validateJurisdiction } from '../jurisdiction.js';
import type { Database } from '../db.js';

interface PollutionArgs {
  activity: string;
  jurisdiction?: string;
}

export function handleGetPollutionPrevention(db: Database, args: PollutionArgs) {
  const jv = validateJurisdiction(args.jurisdiction);
  if (!jv.valid) return jv.error;

  const rows = db.all<{
    id: number;
    activity: string;
    hazards: string | null;
    control_measures: string | null;
    regulatory_requirements: string | null;
    regulation_ref: string | null;
  }>(
    `SELECT * FROM pollution_prevention WHERE jurisdiction = ? AND LOWER(activity) LIKE ?`,
    [jv.jurisdiction, `%${args.activity.toLowerCase()}%`]
  );

  if (rows.length === 0) {
    return {
      query: args,
      jurisdiction: jv.jurisdiction,
      results_count: 0,
      message: `No pollution prevention rules found for activity '${args.activity}'. ` +
        'Try "flytgodsel", "ensilage", "diesel", "bekampningsmedel", "kadaver", or "veterinaravfall".',
      _meta: buildMeta({ source_url: 'https://www.naturvardsverket.se/lagar-och-regler/' }),
    };
  }

  const measures = rows.map(row => ({
    activity: row.activity,
    hazards: row.hazards,
    control_measures: row.control_measures,
    regulatory_requirements: row.regulatory_requirements,
    regulation_ref: row.regulation_ref,
  }));

  return {
    query: args,
    jurisdiction: jv.jurisdiction,
    results_count: measures.length,
    measures,
    _meta: buildMeta({ source_url: 'https://www.naturvardsverket.se/lagar-och-regler/' }),
  };
}
