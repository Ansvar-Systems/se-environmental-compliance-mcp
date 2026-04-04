import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { type Database } from '../../src/db.js';
import { handleGetStorageRequirements } from '../../src/tools/get-storage-requirements.js';
import { createSeededDatabase } from '../helpers/seed-db.js';
import { existsSync, unlinkSync } from 'fs';

const TEST_DB = 'tests/test-storage-requirements.db';

describe('get_storage_requirements', () => {
  let db: Database;

  beforeAll(() => {
    db = createSeededDatabase(TEST_DB);
  });

  afterAll(() => {
    db.close();
    if (existsSync(TEST_DB)) unlinkSync(TEST_DB);
  });

  it('returns requirements for flytgodsel', () => {
    const result = handleGetStorageRequirements(db, { material: 'flytgodsel' }) as any;
    expect(result).toBeDefined();
    expect(result.results_count).toBeGreaterThan(0);
    expect(result.requirements[0].min_capacity_months).toBe(8);
  });

  it('returns requirements for diesel', () => {
    const result = handleGetStorageRequirements(db, { material: 'diesel' }) as any;
    expect(result.results_count).toBeGreaterThan(0);
    expect(result.requirements[0].construction_standard).toContain('Dubbelmantlad');
  });

  it('returns empty for unknown material', () => {
    const result = handleGetStorageRequirements(db, { material: 'zzz_nonexistent' }) as any;
    expect(result.results_count).toBe(0);
    expect(result.message).toBeDefined();
  });

  it('rejects unsupported jurisdiction', () => {
    const result = handleGetStorageRequirements(db, { material: 'flytgodsel', jurisdiction: 'XX' });
    expect(result).toHaveProperty('error');
  });
});
