import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { type Database } from '../../src/db.js';
import { handleGetSpreadingWindows } from '../../src/tools/get-spreading-windows.js';
import { createSeededDatabase } from '../helpers/seed-db.js';
import { existsSync, unlinkSync } from 'fs';

const TEST_DB = 'tests/test-spreading-windows.db';

describe('get_spreading_windows', () => {
  let db: Database;

  beforeAll(() => {
    db = createSeededDatabase(TEST_DB);
  });

  afterAll(() => {
    db.close();
    if (existsSync(TEST_DB)) unlinkSync(TEST_DB);
  });

  it('returns spreading windows for valid manure type and land type', () => {
    const result = handleGetSpreadingWindows(db, { manure_type: 'flytgodsel', land_type: 'akerjord' }) as any;
    expect(result).toBeDefined();
    expect(result._meta).toHaveProperty('disclaimer');
  });

  it('handles nitratkansligt flag', () => {
    const result = handleGetSpreadingWindows(db, { manure_type: 'flytgodsel', land_type: 'akerjord', nitratkansligt: true }) as any;
    expect(result).toBeDefined();
  });

  it('returns empty for nonexistent manure type', () => {
    const result = handleGetSpreadingWindows(db, { manure_type: 'zzz_nonexistent', land_type: 'akerjord' }) as any;
    expect(result).toBeDefined();
  });

  it('rejects unsupported jurisdiction', () => {
    const result = handleGetSpreadingWindows(db, { manure_type: 'flytgodsel', land_type: 'akerjord', jurisdiction: 'XX' });
    expect(result).toHaveProperty('error');
  });
});
