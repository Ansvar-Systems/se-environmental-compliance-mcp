import { buildCitation } from '../citation.js';
import { buildMeta } from '../metadata.js';
import { validateJurisdiction } from '../jurisdiction.js';
import type { Database } from '../db.js';

interface StorageArgs {
  material: string;
  volume?: number;
  jurisdiction?: string;
}

export function handleGetStorageRequirements(db: Database, args: StorageArgs) {
  const jv = validateJurisdiction(args.jurisdiction);
  if (!jv.valid) return jv.error;

  const rows = db.all<{
    id: number;
    material: string;
    min_capacity_months: number | null;
    construction_standard: string | null;
    separation_distance_m: number | null;
    inspection_frequency: string | null;
    regulation_ref: string | null;
  }>(
    `SELECT * FROM storage_requirements WHERE jurisdiction = ? AND LOWER(material) LIKE ?`,
    [jv.jurisdiction, `%${args.material.toLowerCase()}%`]
  );

  if (rows.length === 0) {
    return {
      query: args,
      jurisdiction: jv.jurisdiction,
      results_count: 0,
      message: `No storage requirements found for '${args.material}'. ` +
        'Try "flytgodsel", "fastgodsel", "ensilage", "diesel", or "bekampningsmedel".',
      _citation: buildCitation(`SE storage requirements — ${args.material ?? ''}`, `storage requirements (${args.material ?? ''})`, 'get_storage_requirements', { material: String(args.material ?? '') }, 'https://jordbruksverket.se/lagar-och-regler'),
      _meta: buildMeta({ source_url: 'https://jordbruksverket.se/lagar-och-regler' }),
    };
  }

  const requirements = rows.map(row => ({
    material: row.material,
    min_capacity_months: row.min_capacity_months,
    construction_standard: row.construction_standard,
    separation_distance_m: row.separation_distance_m,
    inspection_frequency: row.inspection_frequency,
    regulation_ref: row.regulation_ref,
  }));

  return {
    query: args,
    jurisdiction: jv.jurisdiction,
    results_count: requirements.length,
    requirements,
    _citation: buildCitation(`SE storage requirements — ${args.material ?? ''}`, `storage requirements (${args.material ?? ''})`, 'get_storage_requirements', { material: String(args.material ?? '') }, 'https://jordbruksverket.se/lagar-och-regler'),
    _meta: buildMeta({ source_url: 'https://jordbruksverket.se/lagar-och-regler' }),
  };
}
