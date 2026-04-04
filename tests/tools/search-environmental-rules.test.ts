import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { type Database } from '../../src/db.js';
import { handleSearchEnvironmentalRules } from '../../src/tools/search-environmental-rules.js';
import { createSeededDatabase } from '../helpers/seed-db.js';
import { existsSync, unlinkSync } from 'fs';

const TEST_DB = 'tests/test-search-env-rules.db';

describe('search_environmental_rules', () => {
  let db: Database;

  beforeAll(() => {
    db = createSeededDatabase(TEST_DB);
  });

  afterAll(() => {
    db.close();
    if (existsSync(TEST_DB)) unlinkSync(TEST_DB);
  });

  it('returns results for a valid query', () => {
    const result = handleSearchEnvironmentalRules(db, { query: 'nitratkansligt' }) as any;
    expect(result).toBeDefined();
    expect(result.results_count).toBeGreaterThan(0);
  });

  it('filters by topic', () => {
    const result = handleSearchEnvironmentalRules(db, { query: 'spridning', topic: 'nitratkansligt' }) as any;
    expect(result).toBeDefined();
  });

  it('returns empty for nonexistent query', () => {
    const result = handleSearchEnvironmentalRules(db, { query: 'zzz_nonexistent_zzz' }) as any;
    expect(result.results_count).toBe(0);
  });

  it('rejects unsupported jurisdiction', () => {
    const result = handleSearchEnvironmentalRules(db, { query: 'test', jurisdiction: 'XX' });
    expect(result).toHaveProperty('error');
  });

  it('respects limit parameter', () => {
    const result = handleSearchEnvironmentalRules(db, { query: 'nitratkansligt', limit: 1 }) as any;
    expect(result.results.length).toBeLessThanOrEqual(1);
  });
});
