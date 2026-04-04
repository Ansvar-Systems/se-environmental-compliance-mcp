import BetterSqlite3 from 'better-sqlite3';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

export interface Database {
  get<T>(sql: string, params?: unknown[]): T | undefined;
  all<T>(sql: string, params?: unknown[]): T[];
  run(sql: string, params?: unknown[]): void;
  close(): void;
  readonly instance: BetterSqlite3.Database;
}

export function createDatabase(dbPath?: string): Database {
  const resolvedPath =
    dbPath ??
    join(dirname(fileURLToPath(import.meta.url)), '..', 'data', 'database.db');
  const db = new BetterSqlite3(resolvedPath);

  db.pragma('journal_mode = DELETE');
  db.pragma('foreign_keys = ON');

  initSchema(db);

  return {
    get<T>(sql: string, params: unknown[] = []): T | undefined {
      return db.prepare(sql).get(...params) as T | undefined;
    },
    all<T>(sql: string, params: unknown[] = []): T[] {
      return db.prepare(sql).all(...params) as T[];
    },
    run(sql: string, params: unknown[] = []): void {
      db.prepare(sql).run(...params);
    },
    close(): void {
      db.close();
    },
    get instance() {
      return db;
    },
  };
}

function initSchema(db: BetterSqlite3.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS nitratkansliga_omraden (
      id INTEGER PRIMARY KEY,
      activity TEXT NOT NULL,
      material_type TEXT,
      soil_type TEXT,
      closed_period_start TEXT,
      closed_period_end TEXT,
      max_application_rate TEXT,
      conditions TEXT,
      regulation_ref TEXT,
      jurisdiction TEXT NOT NULL DEFAULT 'SE'
    );

    CREATE TABLE IF NOT EXISTS storage_requirements (
      id INTEGER PRIMARY KEY,
      material TEXT NOT NULL,
      min_capacity_months INTEGER,
      construction_standard TEXT,
      separation_distance_m INTEGER,
      inspection_frequency TEXT,
      regulation_ref TEXT,
      jurisdiction TEXT NOT NULL DEFAULT 'SE'
    );

    CREATE TABLE IF NOT EXISTS buffer_strip_rules (
      id INTEGER PRIMARY KEY,
      watercourse_type TEXT NOT NULL,
      activity TEXT,
      min_width_m REAL,
      conditions TEXT,
      scheme_payment TEXT,
      regulation_ref TEXT,
      jurisdiction TEXT NOT NULL DEFAULT 'SE'
    );

    CREATE TABLE IF NOT EXISTS abstraction_rules (
      id INTEGER PRIMARY KEY,
      source_type TEXT,
      threshold_m3_per_day REAL,
      licence_required INTEGER,
      exemptions TEXT,
      conditions TEXT,
      jurisdiction TEXT NOT NULL DEFAULT 'SE'
    );

    CREATE TABLE IF NOT EXISTS pollution_prevention (
      id INTEGER PRIMARY KEY,
      activity TEXT NOT NULL,
      hazards TEXT,
      control_measures TEXT,
      regulatory_requirements TEXT,
      regulation_ref TEXT,
      jurisdiction TEXT NOT NULL DEFAULT 'SE'
    );

    CREATE TABLE IF NOT EXISTS eia_screening (
      id INTEGER PRIMARY KEY,
      project_type TEXT NOT NULL,
      threshold_area_ha REAL,
      threshold_other TEXT,
      screening_required INTEGER,
      process TEXT,
      jurisdiction TEXT NOT NULL DEFAULT 'SE'
    );

    CREATE TABLE IF NOT EXISTS designated_nvz (
      id INTEGER PRIMARY KEY,
      lan TEXT NOT NULL,
      coverage TEXT NOT NULL,
      category TEXT,
      notes TEXT,
      regulation_ref TEXT,
      jurisdiction TEXT NOT NULL DEFAULT 'SE'
    );

    CREATE TABLE IF NOT EXISTS animal_unit_definitions (
      id INTEGER PRIMARY KEY,
      species TEXT NOT NULL,
      count_per_unit INTEGER NOT NULL,
      notes TEXT,
      regulation_ref TEXT,
      jurisdiction TEXT NOT NULL DEFAULT 'SE'
    );

    CREATE TABLE IF NOT EXISTS verksamhetskoder (
      id INTEGER PRIMARY KEY,
      code TEXT NOT NULL,
      classification TEXT NOT NULL,
      activity TEXT NOT NULL,
      threshold TEXT,
      species_scope TEXT,
      process TEXT,
      regulation_ref TEXT,
      jurisdiction TEXT NOT NULL DEFAULT 'SE'
    );

    CREATE TABLE IF NOT EXISTS cistern_rules (
      id INTEGER PRIMARY KEY,
      tank_type TEXT NOT NULL,
      volume_threshold TEXT,
      location_context TEXT,
      inspection_type TEXT,
      inspection_frequency TEXT,
      secondary_containment TEXT,
      notification_required INTEGER,
      conditions TEXT,
      regulation_ref TEXT,
      jurisdiction TEXT NOT NULL DEFAULT 'SE'
    );

    CREATE TABLE IF NOT EXISTS pesticide_buffer_zones (
      id INTEGER PRIMARY KEY,
      watercourse_type TEXT NOT NULL,
      fixed_distance_m REAL,
      adapted_distance_m REAL,
      product_class TEXT,
      conditions TEXT,
      regulation_ref TEXT,
      jurisdiction TEXT NOT NULL DEFAULT 'SE'
    );

    CREATE TABLE IF NOT EXISTS vattenverksamhet (
      id INTEGER PRIMARY KEY,
      activity_type TEXT NOT NULL,
      threshold TEXT,
      permit_type TEXT NOT NULL,
      authority TEXT,
      exemptions TEXT,
      conditions TEXT,
      regulation_ref TEXT,
      jurisdiction TEXT NOT NULL DEFAULT 'SE'
    );

    CREATE TABLE IF NOT EXISTS autumn_cover_requirements (
      id INTEGER PRIMARY KEY,
      region TEXT NOT NULL,
      min_cover_pct REAL,
      crop_types TEXT,
      area_threshold_ha REAL,
      conditions TEXT,
      regulation_ref TEXT,
      jurisdiction TEXT NOT NULL DEFAULT 'SE'
    );

    CREATE VIRTUAL TABLE IF NOT EXISTS search_index USING fts5(
      title, body, topic, jurisdiction
    );

    CREATE TABLE IF NOT EXISTS db_metadata (
      key TEXT PRIMARY KEY,
      value TEXT
    );

    INSERT OR IGNORE INTO db_metadata (key, value) VALUES ('schema_version', '2.0');
    INSERT OR IGNORE INTO db_metadata (key, value) VALUES ('mcp_name', 'Sweden Environmental Compliance MCP');
    INSERT OR IGNORE INTO db_metadata (key, value) VALUES ('jurisdiction', 'SE');
  `);
}

const FTS_COLUMNS = ['title', 'body', 'topic', 'jurisdiction'];

export function ftsSearch(
  db: Database,
  query: string,
  limit: number = 20
): { title: string; body: string; topic: string; jurisdiction: string; rank: number }[] {
  const { results } = tieredFtsSearch(db, 'search_index', FTS_COLUMNS, query, limit);
  return results as { title: string; body: string; topic: string; jurisdiction: string; rank: number }[];
}

/**
 * Tiered FTS5 search with automatic fallback.
 * Tiers: exact phrase -> AND -> prefix -> stemmed prefix -> OR -> LIKE
 */
export function tieredFtsSearch(
  db: Database,
  table: string,
  columns: string[],
  query: string,
  limit: number = 20
): { tier: string; results: Record<string, unknown>[] } {
  const sanitized = sanitizeFtsInput(query);
  if (!sanitized.trim()) return { tier: 'empty', results: [] };

  const columnList = columns.join(', ');
  const select = `SELECT ${columnList}, rank FROM ${table}`;
  const order = `ORDER BY rank LIMIT ?`;

  // Tier 1: Exact phrase
  const phrase = `"${sanitized}"`;
  let results = tryFts(db, select, table, order, phrase, limit);
  if (results.length > 0) return { tier: 'phrase', results };

  // Tier 2: AND
  const words = sanitized.split(/\s+/).filter(w => w.length > 1);
  if (words.length > 1) {
    const andQuery = words.join(' AND ');
    results = tryFts(db, select, table, order, andQuery, limit);
    if (results.length > 0) return { tier: 'and', results };
  }

  // Tier 3: Prefix
  const prefixQuery = words.map(w => `${w}*`).join(' AND ');
  results = tryFts(db, select, table, order, prefixQuery, limit);
  if (results.length > 0) return { tier: 'prefix', results };

  // Tier 4: Stemmed prefix
  const stemmed = words.map(w => stemWord(w) + '*');
  const stemmedQuery = stemmed.join(' AND ');
  if (stemmedQuery !== prefixQuery) {
    results = tryFts(db, select, table, order, stemmedQuery, limit);
    if (results.length > 0) return { tier: 'stemmed', results };
  }

  // Tier 5: OR
  if (words.length > 1) {
    const orQuery = words.join(' OR ');
    results = tryFts(db, select, table, order, orQuery, limit);
    if (results.length > 0) return { tier: 'or', results };
  }

  // Tier 6: LIKE fallback — bypasses FTS, searches pollution_prevention with real column names
  const baseCols = ['activity', 'hazards', 'control_measures'];
  const likeConditions = words.map(() =>
    `(${baseCols.map(c => `${c} LIKE ?`).join(' OR ')})`
  ).join(' AND ');
  const likeParams = words.flatMap(w =>
    baseCols.map(() => `%${w}%`)
  );
  try {
    const likeResults = db.all<Record<string, unknown>>(
      `SELECT activity as title, COALESCE(control_measures, '') as body, 'pollution_prevention' as topic, jurisdiction FROM pollution_prevention WHERE ${likeConditions} LIMIT ?`,
      [...likeParams, limit]
    );
    if (likeResults.length > 0) return { tier: 'like', results: likeResults };
  } catch {
    // LIKE fallback failed
  }

  return { tier: 'none', results: [] };
}

function tryFts(
  db: Database, select: string, table: string,
  order: string, matchExpr: string, limit: number
): Record<string, unknown>[] {
  try {
    return db.all(
      `${select} WHERE ${table} MATCH ? ${order}`,
      [matchExpr, limit]
    );
  } catch {
    return [];
  }
}

/**
 * Sanitize FTS input — preserves Swedish characters (a-o with diacritics).
 */
function sanitizeFtsInput(query: string): string {
  return query
    .replace(/["\u201C\u201D\u2018\u2019\u201E\u201A\u00AB\u00BB]/g, '"')
    .replace(/[^a-zA-Z0-9\s*"_\-\u00E5\u00E4\u00F6\u00C5\u00C4\u00D6\u00E9\u00E8\u00FC\u00F8\u00E6]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function stemWord(word: string): string {
  return word
    .replace(/(ningar|ningar|ande|ning|tion|ment|het|lig|isk|are|ade|igt|iga|ing|ens|ade|ade|ers|ar|en|er|et|na|or|ad|de|at|as|es|ts|s)$/i, '');
}
