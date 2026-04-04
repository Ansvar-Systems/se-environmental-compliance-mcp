import { createDatabase, type Database } from '../../src/db.js';

export function createSeededDatabase(dbPath: string): Database {
  const db = createDatabase(dbPath);

  // Nitrate-sensitive areas
  db.run(
    `INSERT INTO nitratkansliga_omraden (activity, material_type, soil_type, closed_period_start, closed_period_end, max_application_rate, conditions, regulation_ref, jurisdiction)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ['spridning', 'flytgodsel', 'lerjord', 'november', 'februari', '170 kg N/ha', 'Nitratkansligt omrade - Skane', 'SJVFS 2004:62', 'SE']
  );
  db.run(
    `INSERT INTO nitratkansliga_omraden (activity, material_type, soil_type, closed_period_start, closed_period_end, max_application_rate, conditions, regulation_ref, jurisdiction)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ['spridning', 'fastgodsel', null, 'december', 'februari', '170 kg N/ha', 'Nitratkansligt omrade - alla jordtyper', 'SJVFS 2004:62', 'SE']
  );
  db.run(
    `INSERT INTO nitratkansliga_omraden (activity, material_type, soil_type, closed_period_start, closed_period_end, max_application_rate, conditions, regulation_ref, jurisdiction)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ['lagring', 'flytgodsel', null, null, null, null, 'Tatt behallare med minst 8 manaders kapacitet', 'SJVFS 2004:62', 'SE']
  );

  // Storage requirements
  db.run(
    `INSERT INTO storage_requirements (material, min_capacity_months, construction_standard, separation_distance_m, inspection_frequency, regulation_ref, jurisdiction)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    ['flytgodsel', 8, 'Tatt behallare, betong eller stal', 50, 'arligen', 'SJVFS 2004:62', 'SE']
  );
  db.run(
    `INSERT INTO storage_requirements (material, min_capacity_months, construction_standard, separation_distance_m, inspection_frequency, regulation_ref, jurisdiction)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    ['fastgodsel', 8, 'Platta med uppsamling av lakvatten', 25, 'arligen', 'SJVFS 2004:62', 'SE']
  );
  db.run(
    `INSERT INTO storage_requirements (material, min_capacity_months, construction_standard, separation_distance_m, inspection_frequency, regulation_ref, jurisdiction)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    ['diesel', null, 'Dubbelmantlad tank eller invalning', 50, 'arligen', 'NFS 2003:24', 'SE']
  );

  // Buffer strip rules
  db.run(
    `INSERT INTO buffer_strip_rules (watercourse_type, activity, min_width_m, conditions, scheme_payment, regulation_ref, jurisdiction)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    ['vattendrag', 'spridning av godsel', 6.0, 'Obligatorisk skyddszon', '3000 SEK/ha', 'SJVFS 2011:25', 'SE']
  );
  db.run(
    `INSERT INTO buffer_strip_rules (watercourse_type, activity, min_width_m, conditions, scheme_payment, regulation_ref, jurisdiction)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    ['sjo', 'spridning av godsel', 6.0, 'Obligatorisk skyddszon vid sjoar', '3000 SEK/ha', 'SJVFS 2011:25', 'SE']
  );

  // Abstraction rules
  db.run(
    `INSERT INTO abstraction_rules (source_type, threshold_m3_per_day, licence_required, exemptions, conditions, jurisdiction)
     VALUES (?, ?, ?, ?, ?, ?)`,
    ['grundvatten', 100.0, 1, 'Husbehovsuttag under 10 m3/dag', 'Anmalan till Lansstyrelsen', 'SE']
  );
  db.run(
    `INSERT INTO abstraction_rules (source_type, threshold_m3_per_day, licence_required, exemptions, conditions, jurisdiction)
     VALUES (?, ?, ?, ?, ?, ?)`,
    ['ytvatten', 50.0, 1, null, 'Vattenverksamhet krav i miljobalken', 'SE']
  );

  // Pollution prevention
  db.run(
    `INSERT INTO pollution_prevention (activity, hazards, control_measures, regulatory_requirements, regulation_ref, jurisdiction)
     VALUES (?, ?, ?, ?, ?, ?)`,
    ['flytgodsel', 'Nitratlakage, lukt, vattenfororening', 'Tatt behallare, begransa spridning, buffertzon', 'Anmalningsplikt vid storre djurhallning', 'SJVFS 2004:62', 'SE']
  );
  db.run(
    `INSERT INTO pollution_prevention (activity, hazards, control_measures, regulatory_requirements, regulation_ref, jurisdiction)
     VALUES (?, ?, ?, ?, ?, ?)`,
    ['diesel', 'Markfororening, vattenfororening', 'Dubbelmantlad tank, invalning, spilluppsamling', 'Forbud att forvara mer an 1 m3 utan skydd', 'NFS 2003:24', 'SE']
  );

  // EIA screening
  db.run(
    `INSERT INTO eia_screening (project_type, threshold_area_ha, threshold_other, screening_required, process, jurisdiction)
     VALUES (?, ?, ?, ?, ?, ?)`,
    ['djurhallning', null, 'Mer an 400 djurenheter', 1, 'Anmalan till Lansstyrelsen, samrad med Naturvardsverket', 'SE']
  );
  db.run(
    `INSERT INTO eia_screening (project_type, threshold_area_ha, threshold_other, screening_required, process, jurisdiction)
     VALUES (?, ?, ?, ?, ?, ?)`,
    ['uppodling', 50.0, null, 1, 'Anmalan till Lansstyrelsen for uppodling av betesmark', 'SE']
  );

  // FTS5 search index
  db.run(
    `INSERT INTO search_index (title, body, topic, jurisdiction) VALUES (?, ?, ?, ?)`,
    ['Nitratkansligt omrade spridning', 'Regler for spridning av flytgodsel i nitratkansliga omraden. Stallperiod november-februari.', 'nitratkansligt', 'SE']
  );
  db.run(
    `INSERT INTO search_index (title, body, topic, jurisdiction) VALUES (?, ?, ?, ?)`,
    ['Lagring av flytgodsel', 'Krav pa tatt behallare med minst 8 manaders kapacitet. Separation 50 m fran vattendrag.', 'lagring', 'SE']
  );
  db.run(
    `INSERT INTO search_index (title, body, topic, jurisdiction) VALUES (?, ?, ?, ?)`,
    ['Buffertzoner vattendrag', 'Obligatorisk skyddszon pa minst 6 meter vid spridning av godsel nara vattendrag.', 'buffertzon', 'SE']
  );

  return db;
}
