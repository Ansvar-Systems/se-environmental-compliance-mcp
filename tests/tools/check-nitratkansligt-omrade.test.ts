import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { type Database } from '../../src/db.js';
import { handleCheckNitratkansligtOmrade } from '../../src/tools/check-nitratkansligt-omrade.js';
import { createSeededDatabase } from '../helpers/seed-db.js';
import { existsSync, unlinkSync } from 'fs';

const TEST_DB = 'tests/test-nitratkansligt.db';

describe('check_nitratkansligt_omrade', () => {
  let db: Database;

  beforeAll(() => {
    db = createSeededDatabase(TEST_DB);
  });

  afterAll(() => {
    db.close();
    if (existsSync(TEST_DB)) unlinkSync(TEST_DB);
  });

  it('returns rules for a valid activity', () => {
    const result = handleCheckNitratkansligtOmrade(db, { activity: 'spridning' }) as any;
    expect(result).toBeDefined();
    expect(result.results_count).toBeGreaterThan(0);
  });

  it('filters by soil type', () => {
    const result = handleCheckNitratkansligtOmrade(db, { activity: 'spridning', soil_type: 'lerjord' }) as any;
    expect(result).toBeDefined();
  });

  it('handles season parameter for period checking', () => {
    const result = handleCheckNitratkansligtOmrade(db, { activity: 'spridning', season: 'winter' }) as any;
    expect(result).toBeDefined();
  });

  it('returns empty for unknown activity', () => {
    const result = handleCheckNitratkansligtOmrade(db, { activity: 'zzz_nonexistent_zzz' }) as any;
    expect(result.results_count).toBe(0);
  });

  it('rejects unsupported jurisdiction', () => {
    const result = handleCheckNitratkansligtOmrade(db, { activity: 'spridning', jurisdiction: 'XX' });
    expect(result).toHaveProperty('error');
  });
});
