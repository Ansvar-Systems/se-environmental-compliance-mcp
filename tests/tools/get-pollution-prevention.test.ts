import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { type Database } from '../../src/db.js';
import { handleGetPollutionPrevention } from '../../src/tools/get-pollution-prevention.js';
import { createSeededDatabase } from '../helpers/seed-db.js';
import { existsSync, unlinkSync } from 'fs';

const TEST_DB = 'tests/test-pollution-prevention.db';

describe('get_pollution_prevention', () => {
  let db: Database;

  beforeAll(() => {
    db = createSeededDatabase(TEST_DB);
  });

  afterAll(() => {
    db.close();
    if (existsSync(TEST_DB)) unlinkSync(TEST_DB);
  });

  it('returns measures for flytgodsel', () => {
    const result = handleGetPollutionPrevention(db, { activity: 'flytgodsel' }) as any;
    expect(result).toBeDefined();
    expect(result.results_count).toBeGreaterThan(0);
    expect(result.measures[0].hazards).toContain('Nitratlakage');
  });

  it('returns measures for diesel', () => {
    const result = handleGetPollutionPrevention(db, { activity: 'diesel' }) as any;
    expect(result.results_count).toBeGreaterThan(0);
    expect(result.measures[0].control_measures).toContain('Dubbelmantlad');
  });

  it('returns empty for unknown activity', () => {
    const result = handleGetPollutionPrevention(db, { activity: 'zzz_nonexistent' }) as any;
    expect(result.results_count).toBe(0);
    expect(result.message).toBeDefined();
  });

  it('rejects unsupported jurisdiction', () => {
    const result = handleGetPollutionPrevention(db, { activity: 'diesel', jurisdiction: 'XX' });
    expect(result).toHaveProperty('error');
  });
});
