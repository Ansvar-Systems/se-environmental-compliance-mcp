import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { type Database } from '../../src/db.js';
import { handleGetEiaScreening } from '../../src/tools/get-eia-screening.js';
import { createSeededDatabase } from '../helpers/seed-db.js';
import { existsSync, unlinkSync } from 'fs';

const TEST_DB = 'tests/test-eia-screening.db';

describe('get_eia_screening', () => {
  let db: Database;

  beforeAll(() => {
    db = createSeededDatabase(TEST_DB);
  });

  afterAll(() => {
    db.close();
    if (existsSync(TEST_DB)) unlinkSync(TEST_DB);
  });

  it('returns screening info for djurhallning', () => {
    const result = handleGetEiaScreening(db, { project_type: 'djurhallning' }) as any;
    expect(result).toBeDefined();
    expect(result.results_count).toBeGreaterThan(0);
    expect(result.screenings[0].screening_required).toBe(true);
  });

  it('includes area assessment when area_ha given', () => {
    const result = handleGetEiaScreening(db, { project_type: 'uppodling', area_ha: 60 }) as any;
    expect(result.results_count).toBeGreaterThan(0);
    expect(result.screenings[0].area_assessment).toBeDefined();
    expect(result.screenings[0].area_assessment).toContain('meets or exceeds');
  });

  it('returns empty for unknown project type', () => {
    const result = handleGetEiaScreening(db, { project_type: 'zzz_nonexistent' }) as any;
    expect(result.results_count).toBe(0);
  });

  it('rejects unsupported jurisdiction', () => {
    const result = handleGetEiaScreening(db, { project_type: 'djurhallning', jurisdiction: 'XX' });
    expect(result).toHaveProperty('error');
  });
});
