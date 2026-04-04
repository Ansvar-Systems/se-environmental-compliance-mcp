import { buildMeta } from '../metadata.js';
import { validateJurisdiction } from '../jurisdiction.js';
import type { Database } from '../db.js';

interface EiaArgs {
  project_type: string;
  area_ha?: number;
  jurisdiction?: string;
}

export function handleGetEiaScreening(db: Database, args: EiaArgs) {
  const jv = validateJurisdiction(args.jurisdiction);
  if (!jv.valid) return jv.error;

  const rows = db.all<{
    id: number;
    project_type: string;
    threshold_area_ha: number | null;
    threshold_other: string | null;
    screening_required: number | null;
    process: string | null;
  }>(
    `SELECT * FROM eia_screening WHERE jurisdiction = ? AND LOWER(project_type) LIKE ?`,
    [jv.jurisdiction, `%${args.project_type.toLowerCase()}%`]
  );

  if (rows.length === 0) {
    return {
      query: args,
      jurisdiction: jv.jurisdiction,
      results_count: 0,
      message: `No EIA screening rules found for project type '${args.project_type}'. ` +
        'Try "djurhallning", "uppodling", "dikning", "avverkning", "vindkraft", or "takt".',
      _meta: buildMeta({ source_url: 'https://www.naturvardsverket.se/lagar-och-regler/' }),
    };
  }

  const screenings = rows.map(row => {
    let area_assessment: string | null = null;
    if (args.area_ha !== undefined && row.threshold_area_ha !== null) {
      area_assessment = args.area_ha >= row.threshold_area_ha
        ? `Area ${args.area_ha} ha meets or exceeds threshold ${row.threshold_area_ha} ha — screening/EIA likely required`
        : `Area ${args.area_ha} ha is below threshold ${row.threshold_area_ha} ha — screening may not be required (check other criteria)`;
    }

    return {
      project_type: row.project_type,
      threshold_area_ha: row.threshold_area_ha,
      threshold_other: row.threshold_other,
      screening_required: row.screening_required === 1,
      process: row.process,
      area_assessment,
    };
  });

  return {
    query: args,
    jurisdiction: jv.jurisdiction,
    results_count: screenings.length,
    screenings,
    _meta: buildMeta({ source_url: 'https://www.naturvardsverket.se/lagar-och-regler/' }),
  };
}
