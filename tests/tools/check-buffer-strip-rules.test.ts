import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { type Database } from '../../src/db.js';
import { handleCheckBufferStripRules } from '../../src/tools/check-buffer-strip-rules.js';
import { createSeededDatabase } from '../helpers/seed-db.js';
import { existsSync, unlinkSync } from 'fs';

const TEST_DB = 'tests/test-buffer-strips.db';

describe('check_buffer_strip_rules', () => {
  let db: Database;

  beforeAll(() => {
    db = createSeededDatabase(TEST_DB);
  });

  afterAll(() => {
    db.close();
    if (existsSync(TEST_DB)) unlinkSync(TEST_DB);
  });

  it('returns rules for vattendrag', () => {
    const result = handleCheckBufferStripRules(db, { watercourse_type: 'vattendrag' }) as any;
    expect(result).toBeDefined();
    expect(result.results_count).toBeGreaterThan(0);
  });

  it('includes minimum width', () => {
    const result = handleCheckBufferStripRules(db, { watercourse_type: 'vattendrag' }) as any;
    const rules = result.rules ?? result.results ?? [];
    expect(rules[0].min_width_m).toBe(6.0);
  });

  it('returns all rules when no filters', () => {
    const result = handleCheckBufferStripRules(db, {}) as any;
    expect(result.results_count).toBeGreaterThan(0);
  });

  it('returns empty for unknown watercourse type', () => {
    const result = handleCheckBufferStripRules(db, { watercourse_type: 'zzz_nonexistent' }) as any;
    expect(result.results_count).toBe(0);
  });

  it('rejects unsupported jurisdiction', () => {
    const result = handleCheckBufferStripRules(db, { jurisdiction: 'XX' });
    expect(result).toHaveProperty('error');
  });
});
