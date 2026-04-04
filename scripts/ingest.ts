/**
 * Sweden Environmental Compliance MCP — Data Ingestion Script
 *
 * Sources:
 *   - Jordbruksverket (SJVFS 2004:62, SJVFS 2011:25, SJVFS 2020:2, SJVFS 2026:2)
 *   - Naturvardsverket (NFS 2015:2, NFS 2021:10)
 *   - Havs- och vattenmyndigheten (HaV, HVMFS 2015:34)
 *   - Miljobalken (1998:808) kap 2, 6, 7, 9, 11, 14, 15, 26
 *   - Miljoprovningsforordningen (2013:251)
 *   - Forordning (1998:899) om miljofarlig verksamhet och halsoskydd
 *   - Forordning (1998:915) om miljohansyn i jordbruket
 *   - Forordning (1998:1388) om vattenverksamheter
 *   - Kemikalieinspektionen (KIFS 2022:3, formerly KIFS 2008:3)
 *   - Skogsstyrelsen (Skogsvardslag 1979:429)
 *   - MSB (MSBFS 2018:3)
 *   - EU Nitratdirektivet (91/676/EEG)
 *   - EU Ramdirektivet for vatten (2000/60/EG)
 *   - EU ABP-forordningen (EG 1069/2009)
 *   - EU NEC-direktivet (2016/2284)
 *   - Sevesodirektivet (2012/18/EU)
 *
 * Usage: npm run ingest
 */

import { createDatabase } from '../src/db.js';
import { mkdirSync, writeFileSync } from 'fs';

mkdirSync('data', { recursive: true });
const db = createDatabase('data/database.db');

const now = new Date().toISOString().split('T')[0];

// ---------------------------------------------------------------------------
// NITRATKANSLIGA OMRADEN (Nitrate-sensitive areas — SJVFS 2004:62)
// Full corpus: spreading rules by material type x season x soil type x zone
// ---------------------------------------------------------------------------
const nitratkansligaOmraden = [
  // === Stallgodsel: fastgodsel (solid manure) ===
  {
    activity: 'Spridning av fastgodsel i nitratkansliga omraden',
    material_type: 'Fastgodsel (stallgodsel)',
    soil_type: null,
    closed_period_start: 'Nov 1',
    closed_period_end: 'Feb 28',
    max_application_rate: '170 kg N/ha/ar',
    conditions: 'Nedbrukning minst 5 cm inom 4 timmar pa obevuxen mark i Skane, Blekinge och Halland. Ovriga nitratkansliga omraden: nedbrukning minst 10 cm inom 12 timmar. Spridning pa frusen, vattenmatad eller snotackt mark forbjuden.',
    regulation_ref: 'SJVFS 2004:62, 5 kap; SJVFS 2020:2',
  },
  {
    activity: 'Spridning av fastgodsel pa obevuxen mark i oktober',
    material_type: 'Fastgodsel (stallgodsel)',
    soil_type: null,
    closed_period_start: 'Nov 1',
    closed_period_end: 'Feb 28',
    max_application_rate: '170 kg N/ha/ar',
    conditions: 'Tillaten i nitratkansliga omraden under oktober om nedbrukning sker till minst 10 cm djup inom 4 timmar fran spridning.',
    regulation_ref: 'SJVFS 2004:62, 5 kap',
  },
  {
    activity: 'Spridning av fastgodsel pa lerjord',
    material_type: 'Fastgodsel (stallgodsel)',
    soil_type: 'Lera',
    closed_period_start: 'Nov 1',
    closed_period_end: 'Feb 28',
    max_application_rate: '22 kg P/ha/5 ar; 170 kg N/ha/ar',
    conditions: 'Striktare fosforbegransning pa lerjord. Hogre risk for ytavrinning. Undvik spridning vid kraftigt regn. Nedbrukning inom 4 timmar.',
    regulation_ref: 'SJVFS 2004:62, 5-6 kap',
  },

  // === Stallgodsel: flytgodsel (liquid manure / slurry) ===
  {
    activity: 'Spridning av flytgodsel i nitratkansliga omraden',
    material_type: 'Flytgodsel',
    soil_type: null,
    closed_period_start: 'Nov 1',
    closed_period_end: 'Feb 28',
    max_application_rate: '170 kg N/ha/ar',
    conditions: 'Nedbrukning inom 4 timmar pa obevuxen mark. Myllning eller bandspridning rekommenderas for att minska ammoniakforluster.',
    regulation_ref: 'SJVFS 2004:62, 5 kap',
  },
  {
    activity: 'Spridning av flytgodsel pa lerjord',
    material_type: 'Flytgodsel',
    soil_type: 'Lera',
    closed_period_start: 'Nov 1',
    closed_period_end: 'Feb 28',
    max_application_rate: '22 kg P/ha/5 ar; 170 kg N/ha/ar',
    conditions: 'Striktare fosforbegransning pa lerjord. Ytavrinningsrisk. Nedbrukning inom 4 timmar. Undvik spridning vid matad eller kompakterad jord.',
    regulation_ref: 'SJVFS 2004:62, 5-6 kap',
  },
  {
    activity: 'Spridning av flytgodsel pa sandjord',
    material_type: 'Flytgodsel',
    soil_type: 'Sand',
    closed_period_start: 'Nov 1',
    closed_period_end: 'Feb 28',
    max_application_rate: '170 kg N/ha/ar',
    conditions: 'Hogre kvavelakerisk pa sandjord. Varspridning rekommenderas starkt. Hostspridning avrads. Nedbrukning inom 4 timmar.',
    regulation_ref: 'SJVFS 2004:62, 5 kap',
  },
  {
    activity: 'Spridning av flytgodsel i vaxande groda',
    material_type: 'Flytgodsel',
    soil_type: null,
    closed_period_start: 'Nov 1',
    closed_period_end: 'Feb 28',
    max_application_rate: '170 kg N/ha/ar',
    conditions: 'I vaxande groda: bandspridning, myllning, spadning med minst 50% vatten, eller bevattning med minst 10 mm vatten inom 4-12 timmar efter spridning.',
    regulation_ref: 'SJVFS 2004:62, 5 kap; SJVFS 2026:2',
  },
  {
    activity: 'Spridning av flytgodsel pa mulljord',
    material_type: 'Flytgodsel',
    soil_type: 'Mulljord',
    closed_period_start: 'Nov 1',
    closed_period_end: 'Feb 28',
    max_application_rate: '170 kg N/ha/ar',
    conditions: 'Mulljord mineraliserar mycket kvave. Anpassa givan nedat. Jordbruksverket rekommenderar lagre stallgodselgiva pa mulljord.',
    regulation_ref: 'SJVFS 2004:62, 5 kap; Jordbruksverket radgivning',
  },

  // === Stallgodsel: urin ===
  {
    activity: 'Spridning av urin (notkreatur/svin)',
    material_type: 'Urin',
    soil_type: null,
    closed_period_start: 'Nov 1',
    closed_period_end: 'Feb 28',
    max_application_rate: '170 kg N/ha/ar',
    conditions: 'Urin har hog andel ammoniumkvave. Nedbrukning inom 4 timmar pa obevuxen mark. Bandspridning rekommenderas pa vall. Stor ammoniakrisk vid varm vader.',
    regulation_ref: 'SJVFS 2004:62, 5 kap',
  },

  // === Hostspridning (autumn application limits) ===
  {
    activity: 'Hostspridning av stallgodsel till hostraps',
    material_type: 'Stallgodsel',
    soil_type: null,
    closed_period_start: 'Nov 1',
    closed_period_end: 'Feb 28',
    max_application_rate: '60 kg NH4-N/ha (hostraps)',
    conditions: 'Hostspridning tillaten for oljevaxter (hostraps) med max 60 kg lattillgangligt kvave per hektar efter skoord. Galler i nitratkansliga omraden.',
    regulation_ref: 'SJVFS 2004:62, 5 kap; SJVFS 2020:2',
  },
  {
    activity: 'Hostspridning av stallgodsel till hostsadda grodor',
    material_type: 'Stallgodsel',
    soil_type: null,
    closed_period_start: 'Nov 1',
    closed_period_end: 'Feb 28',
    max_application_rate: '30 kg NH4-N/ha',
    conditions: 'Max 30 kg lattillgangligt kvave per hektar for hostsadda grodor (hostvete, hostrag, hostkorn). Tidigare grans var 40 kg, sanktes 2020.',
    regulation_ref: 'SJVFS 2004:62, 5 kap; SJVFS 2020:2',
  },
  {
    activity: 'Hostspridning av stallgodsel pa bevuxen mark (fanggroda/mellangroda)',
    material_type: 'Stallgodsel',
    soil_type: null,
    closed_period_start: 'Nov 1',
    closed_period_end: 'Feb 28',
    max_application_rate: '30 kg NH4-N/ha',
    conditions: 'Tillaten pa bevuxen mark (fanggroda, mellangroda) med max 30 kg lattillgangligt kvave per hektar fram till 1 november.',
    regulation_ref: 'SJVFS 2004:62, 5 kap; SJVFS 2020:2',
  },

  // === Handelsgodsel (mineral fertiliser) ===
  {
    activity: 'Spridning av handelsgodsel (kvavegodsel)',
    material_type: 'Handelsgodsel',
    soil_type: null,
    closed_period_start: null,
    closed_period_end: null,
    max_application_rate: 'Enligt godselplan',
    conditions: 'Ingen formell stangd period men spridning pa frusen, vattenmatad eller snotackt mark forbjuden. Godselplanering kravs i nitratkansliga omraden. All kvave raknas som lattillgangligt.',
    regulation_ref: 'SJVFS 2004:62, 4 kap',
  },
  {
    activity: 'Hostgodsling med handelsgodsel i nitratkansliga omraden',
    material_type: 'Handelsgodsel',
    soil_type: null,
    closed_period_start: null,
    closed_period_end: null,
    max_application_rate: '60 kg N/ha (oljevaxter); 30 kg N/ha (ovriga hostsadda)',
    conditions: 'Kvavegodsling pa hosten begransad. Max 60 kg N/ha till hostraps, max 30 kg N/ha till hostsadda grodor. Bara till groda med kvavebehov pa hosten.',
    regulation_ref: 'SJVFS 2004:62, 4 kap; SJVFS 2020:2',
  },
  {
    activity: 'Kvavegodsling till hostvete',
    material_type: 'Handelsgodsel',
    soil_type: null,
    closed_period_start: null,
    closed_period_end: null,
    max_application_rate: '200 kg N/ha (delad giva)',
    conditions: 'Normgiva ca 160-200 kg N/ha beroende pa skordenivamal. Delad giva rekommenderas: 40-60% pa varen, resten vid straskorning. Godselplan kravs.',
    regulation_ref: 'SJVFS 2004:62, 4 kap; Jordbruksverket radgivning',
  },

  // === Urea ===
  {
    activity: 'Spridning av urea pa akermark',
    material_type: 'Urea',
    soil_type: null,
    closed_period_start: null,
    closed_period_end: null,
    max_application_rate: 'Enligt godselplan',
    conditions: 'Urea maste brukas ned inom 4 timmar efter spridning eller anvandas med ureasinhibitor. Annars stora ammoniakforluster. EU-forordning 2019/1009 om godselmedel galler.',
    regulation_ref: 'SJVFS 2004:62, 4 kap; EU 2019/1009',
  },

  // === Rotrester (biogas residues) ===
  {
    activity: 'Spridning av rotrester (biogodsel)',
    material_type: 'Rotrester',
    soil_type: null,
    closed_period_start: 'Nov 1',
    closed_period_end: 'Feb 28',
    max_application_rate: '170 kg N/ha/ar',
    conditions: 'Samma regler som flytgodsel. Certifierad rotrester fran biogasanlaggning. Nedbrukning inom 4 timmar pa obevuxen mark.',
    regulation_ref: 'SJVFS 2004:62, 5 kap; SPCR 120',
  },

  // === Fosforbegransning (phosphorus limits) ===
  {
    activity: 'Fosforgodsling i nitratkansliga omraden',
    material_type: 'Alla godselmedel',
    soil_type: null,
    closed_period_start: null,
    closed_period_end: null,
    max_application_rate: '22 kg P/ha/5 ar',
    conditions: 'Maximalt 22 kg fosfor per hektar i genomsnitt over 5 ar i nitratkansliga omraden. Galler organiskt och mineralgodsel sammanlagt.',
    regulation_ref: 'SJVFS 2004:62, 6 kap',
  },
  {
    activity: 'Fosforgodsling pa fosforrik jord (P-AL >16)',
    material_type: 'Alla godselmedel',
    soil_type: 'Fosforrik jord',
    closed_period_start: null,
    closed_period_end: null,
    max_application_rate: '0 kg P/ha (avrad)',
    conditions: 'Pa marker med hoga fosfortal (P-AL >16) rekommenderas ingen fosforgodsling. Maxgivan 22 kg P/ha/5 ar galler fortfarande men bor inte utnyttjas fullt.',
    regulation_ref: 'SJVFS 2004:62, 6 kap; Greppa naringen',
  },

  // === Betesmark (grazing land) ===
  {
    activity: 'Godsling av betesmark',
    material_type: 'Stallgodsel',
    soil_type: 'Betesmark',
    closed_period_start: 'Nov 1',
    closed_period_end: 'Feb 28',
    max_application_rate: '170 kg N/ha/ar',
    conditions: 'Betesdjurens avgang raknas in i kvavegivan. Anpassad godsling. Vid mer an 2 djurenheter per hektar kraver extra planering.',
    regulation_ref: 'SJVFS 2004:62, 5 kap',
  },

  // === Vallar (grassland/ley) ===
  {
    activity: 'Godsling av vall (flytgodsel)',
    material_type: 'Flytgodsel',
    soil_type: 'Vall',
    closed_period_start: 'Nov 1',
    closed_period_end: 'Feb 28',
    max_application_rate: '170 kg N/ha/ar',
    conditions: 'Bandspridning rekommenderas for att minska ammoniakforluster. Tidig varspridning ger bast utnyttjande. Undvik spridning vid temperaturer over 20 grader.',
    regulation_ref: 'SJVFS 2004:62, 5 kap',
  },

  // === Avloppsslam (sewage sludge) ===
  {
    activity: 'Spridning av avloppsslam pa akermark',
    material_type: 'Avloppsslam',
    soil_type: null,
    closed_period_start: 'Nov 1',
    closed_period_end: 'Feb 28',
    max_application_rate: 'Max 7 ton TS/ha/5 ar',
    conditions: 'Krav pa REVAQ-certifiering eller likvardigt. Nedbrukning inom 4 timmar. Karenstid 10 manader for livsmedelsgroda. Max kadmiumhalt 2 mg/kg TS. Ej pa betesmark.',
    regulation_ref: 'SNFS 1994:2; SJVFS 2004:62; Forordning 1998:944',
  },

  // === Regler utanfor nitratkansliga omraden (outside nitrate zones) ===
  {
    activity: 'Spridning av stallgodsel utanfor nitratkansliga omraden',
    material_type: 'Stallgodsel',
    soil_type: null,
    closed_period_start: 'Dec 1',
    closed_period_end: 'Feb 28',
    max_application_rate: '170 kg N/ha/ar (rekommendation)',
    conditions: 'Utanfor nitratkansliga omraden galler kortare stangd period (1 dec-28 feb). Jordbruksverket rekommenderar att folja samma begransning 170 kg N/ha/ar.',
    regulation_ref: 'SJVFS 2004:62; Jordbruksverket allmanna rad',
  },
  {
    activity: 'Spridning utanfor nitratkansliga omraden i Skane, Blekinge, Halland',
    material_type: 'Stallgodsel',
    soil_type: null,
    closed_period_start: 'Dec 1',
    closed_period_end: 'Feb 28',
    max_application_rate: '170 kg N/ha/ar',
    conditions: 'I Skane, Blekinge och Halland utanfor nitratkansliga omraden: stallgodsel ska brukas ned minst 10 cm inom 12 timmar pa obevuxen mark. Forbudet 1 dec-28 feb.',
    regulation_ref: 'SJVFS 2004:62; Jordbruksverket TGA',
  },

  // === Godselplan (nutrient planning) ===
  {
    activity: 'Godselplanering i nitratkansliga omraden',
    material_type: 'Alla godselmedel',
    soil_type: null,
    closed_period_start: null,
    closed_period_end: null,
    max_application_rate: null,
    conditions: 'Kvavegivan ska beraknas, bedommas och dokumenteras for varje falt. Galler alla jordbruksforetag med mer an 10 ha akermark eller mer an 10 djurenheter i nitratkansliga omraden.',
    regulation_ref: 'SJVFS 2004:62, 4 kap; Nitratdirektivet 91/676/EEG',
  },

  // === Fjaderfagodsel (poultry manure) ===
  {
    activity: 'Spridning av fjaderfagodsel',
    material_type: 'Fjaderfagodsel',
    soil_type: null,
    closed_period_start: 'Nov 1',
    closed_period_end: 'Feb 28',
    max_application_rate: '170 kg N/ha/ar',
    conditions: 'Fjaderfagodsel har hogt kvaveinnehall och snabb mineralisering. Nedbrukning inom 4 timmar. Risk for ammoniakforluster. Varspridning starkt rekommenderad.',
    regulation_ref: 'SJVFS 2004:62, 5 kap; Jordbruksverket JO 05:13',
  },

  // === Lutningsbegransningar (slope restrictions) ===
  {
    activity: 'Spridning av godsel pa sluttande mark (>10% lutning)',
    material_type: 'Alla godselmedel',
    soil_type: null,
    closed_period_start: null,
    closed_period_end: null,
    max_application_rate: null,
    conditions: 'Forbjudet att sprida stallgodsel pa mark med mer an 10% lutning inom 2 meter fran vattendrag. Anpassad teknik (myllning) kravs pa sluttande mark.',
    regulation_ref: 'SJVFS 2004:62, 5 kap; Grundvillkor SMR 2',
  },

  // === Regional Skane/Blekinge/Halland closed-period detail ===
  {
    activity: 'Flytgodsel 1 aug-31 okt i Skane/Blekinge/Halland (NVZ)',
    material_type: 'Flytgodsel',
    soil_type: null,
    closed_period_start: 'Nov 1',
    closed_period_end: 'Feb 28',
    max_application_rate: '170 kg N/ha/ar',
    conditions: 'Skane, Blekinge, Halland NVZ: flytgodsel aug-okt tillaten enbart i vaxande groda eller fore hostsadd. Bandspridning, myllning, spadning med minst 50% vatten, eller 10 mm bevattning inom 4 timmar.',
    regulation_ref: 'SJVFS 2004:62, 5 kap',
  },
  {
    activity: 'Fastgodsel 1-31 okt pa obevuxen mark i Skane/Blekinge/Halland (NVZ)',
    material_type: 'Fastgodsel (stallgodsel)',
    soil_type: null,
    closed_period_start: 'Nov 1',
    closed_period_end: 'Feb 28',
    max_application_rate: '170 kg N/ha/ar',
    conditions: 'Skane, Blekinge, Halland NVZ: fastgodsel i oktober pa obevuxen mark tillaten om nedbrukning minst 5 cm inom 4 timmar. Fjaderfagodsel: enbart i vaxande groda.',
    regulation_ref: 'SJVFS 2004:62, 5 kap',
  },
  {
    activity: 'Ovriga NVZ 1-31 okt pa obevuxen mark',
    material_type: 'Fastgodsel (stallgodsel)',
    soil_type: null,
    closed_period_start: 'Nov 1',
    closed_period_end: 'Feb 28',
    max_application_rate: '170 kg N/ha/ar',
    conditions: 'Ovriga NVZ: fastgodsel i oktober pa obevuxen mark tillaten om nedbrukning minst 10 cm inom 12 timmar.',
    regulation_ref: 'SJVFS 2004:62, 5 kap',
  },

  // === Phosphorus documentation ===
  {
    activity: 'Fosfordokumentation i nitratkansliga omraden',
    material_type: 'Alla organiska godselmedel',
    soil_type: null,
    closed_period_start: null,
    closed_period_end: null,
    max_application_rate: '22 kg P/ha genomsnitt 5 ar',
    conditions: 'Dokumentation kravs for allt in- och utflode av stallgodsel och andra organiska godselmedel med fosforinnehall. Sparas minst 6 ar.',
    regulation_ref: 'SJVFS 2004:62, 6 kap; Grundvillkor SMR 2',
  },

  // === Forbidden conditions (all materials) ===
  {
    activity: 'Forbjudna forhallanden for spridning',
    material_type: 'Alla godselmedel',
    soil_type: null,
    closed_period_start: null,
    closed_period_end: null,
    max_application_rate: null,
    conditions: 'Spridning ar forbjuden pa mark som ar: vattenmatad, snotackt, djupfrusen, eller inom 2 meter fran oeppna diken eller vattendrag. Galler hela Sverige.',
    regulation_ref: 'SJVFS 2004:62, 5 kap; Miljobalken 2 kap',
  },
];

for (const row of nitratkansligaOmraden) {
  db.run(
    `INSERT INTO nitratkansliga_omraden (activity, material_type, soil_type, closed_period_start, closed_period_end, max_application_rate, conditions, regulation_ref)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [row.activity, row.material_type, row.soil_type, row.closed_period_start, row.closed_period_end, row.max_application_rate, row.conditions, row.regulation_ref],
  );
}
console.log(`Inserted ${nitratkansligaOmraden.length} nitratkansliga omraden rules`);

// ---------------------------------------------------------------------------
// STORAGE REQUIREMENTS (SJVFS 2004:62, Forordning 1998:915, NFS 2021:10, MSBFS 2018:3)
// ---------------------------------------------------------------------------
const storageRequirements = [
  // === Flytgodsel by region and herd size (from Forordning 1998:915 sec 6) ===
  {
    material: 'Flytgodsel (over 100 DE, Skane/Blekinge/Halland/Gotland/Oland/kustzoner)',
    min_capacity_months: 8,
    construction_standard: 'Betong- eller stalkladd behallare, tatkontrollerad. Tackningsplikt i Gotaland och sodra Svealand for bruk med over 10 djurenheter (flytande tackning, plastfolie, stro, torv, lecakulor eller tak).',
    separation_distance_m: 50,
    inspection_frequency: 'Arlig visuell kontroll; tatkontroll vart 6:e ar',
    regulation_ref: 'Forordning 1998:915, 6 sek; SJVFS 2004:62, 3 kap',
  },
  {
    material: 'Flytgodsel (over 100 DE, ovriga nitratkansliga omraden)',
    min_capacity_months: 8,
    construction_standard: 'Betong- eller stalkladd behallare. Tackningsplikt i Gotaland och sodra Svealand for bruk med over 10 djurenheter.',
    separation_distance_m: 50,
    inspection_frequency: 'Arlig visuell kontroll; tatkontroll vart 6:e ar',
    regulation_ref: 'Forordning 1998:915, 6 sek; SJVFS 2004:62, 3 kap',
  },
  {
    material: 'Flytgodsel (over 100 DE, utanfor nitratkansliga omraden)',
    min_capacity_months: 8,
    construction_standard: 'Betong- eller stalkladd behallare. 8 manaders kapacitet for notkreatur/hastar/far/getter, 10 manader for svin/fjaderfae.',
    separation_distance_m: 50,
    inspection_frequency: 'Arlig visuell kontroll; tatkontroll vart 6:e ar',
    regulation_ref: 'Forordning 1998:915, 6 sek',
  },
  {
    material: 'Flytgodsel (10-100 DE, svin/fjaderfae i Skane/Blekinge/Halland/Gotland/Oland)',
    min_capacity_months: 10,
    construction_standard: 'Betong- eller stalkladd behallare med tak eller flytande tackning. Tathetskontroll obligatorisk. 10 manaders kapacitet for grisar och fjaderfae.',
    separation_distance_m: 50,
    inspection_frequency: 'Arlig visuell kontroll; tatkontroll vart 6:e ar',
    regulation_ref: 'Forordning 1998:915, 6 sek; SJVFS 2004:62, 3 kap',
  },
  {
    material: 'Flytgodsel (10-100 DE, notkreatur/hastar/far/getter i Skane/Blekinge/Halland/Gotland/Oland)',
    min_capacity_months: 8,
    construction_standard: 'Betong- eller stalkladd behallare. 8 manaders kapacitet for notkreatur, hastar, far och getter vid 10-100 djurenheter i kaensliga kustomraden.',
    separation_distance_m: 50,
    inspection_frequency: 'Arlig visuell kontroll; tatkontroll vart 6:e ar',
    regulation_ref: 'Forordning 1998:915, 6 sek; SJVFS 2004:62, 3 kap',
  },
  {
    material: 'Flytgodsel (10-100 DE, notkreatur/hastar i ovriga nitratkansliga omraden)',
    min_capacity_months: 6,
    construction_standard: 'Betong- eller stalkladd behallare. 6 manaders kapacitet for notkreatur, hastar, far och getter vid 10-100 djurenheter i ovriga nitratkansliga omraden.',
    separation_distance_m: 50,
    inspection_frequency: 'Arlig visuell kontroll; tatkontroll vart 6:e ar',
    regulation_ref: 'Forordning 1998:915, 6 sek; SJVFS 2004:62, 3 kap',
  },
  {
    material: 'Flytgodsel (10-100 DE, svin/fjaderfae i ovriga nitratkansliga omraden)',
    min_capacity_months: 10,
    construction_standard: 'Betong- eller stalkladd behallare. 10 manaders kapacitet for svin och fjaderfae oavsett region vid over 10 DE.',
    separation_distance_m: 50,
    inspection_frequency: 'Arlig visuell kontroll; tatkontroll vart 6:e ar',
    regulation_ref: 'Forordning 1998:915, 6 sek; SJVFS 2004:62, 3 kap',
  },
  {
    material: 'Flytgodsel (2-10 DE, nitratkansliga omraden)',
    min_capacity_months: 6,
    construction_standard: 'Behallare som forhindrar avrinning eller lackage till omgivningen. 6 manaders kapacitet oavsett djurslag for 2-10 djurenheter.',
    separation_distance_m: 50,
    inspection_frequency: 'Arlig visuell kontroll',
    regulation_ref: 'Forordning 1998:915, 6 sek; SJVFS 2004:62, 3 kap',
  },
  {
    material: 'Flytgodsel (10-100 DE, utanfor nitratkansliga omraden, notkreatur/hastar)',
    min_capacity_months: 6,
    construction_standard: 'Betong- eller stalkladd behallare. 6 manaders kapacitet for notkreatur/hastar/far/getter, 10 manader for svin/fjaderfae.',
    separation_distance_m: 50,
    inspection_frequency: 'Arlig visuell kontroll; tatkontroll vart 6:e ar',
    regulation_ref: 'Forordning 1998:915, 6 sek',
  },
  {
    material: 'Flytgodsel (10-100 DE, utanfor nitratkansliga omraden, svin/fjaderfae)',
    min_capacity_months: 10,
    construction_standard: 'Betong- eller stalkladd behallare. 10 manaders kapacitet for svin och fjaderfae.',
    separation_distance_m: 50,
    inspection_frequency: 'Arlig visuell kontroll; tatkontroll vart 6:e ar',
    regulation_ref: 'Forordning 1998:915, 6 sek',
  },

  // === Fastgodsel (solid manure) ===
  {
    material: 'Fastgodsel (stallgodsel)',
    min_capacity_months: 8,
    construction_standard: 'Godselplatta med ogenomslapplig botten och uppsamling av lakvatten. Tackning rekommenderas for att minska ammoniakforluster.',
    separation_distance_m: 30,
    inspection_frequency: 'Arlig kontroll av botten och avrinning',
    regulation_ref: 'SJVFS 2004:62, 3 kap',
  },
  {
    material: 'Fastgodsel (djupstro)',
    min_capacity_months: 8,
    construction_standard: 'Ogenomslapplig platta eller containelosning. Lakvatten maste samlas upp. Djupstro i stallbyggnad raknas in i lagringskapaciteten om golvet ar tatskiktat.',
    separation_distance_m: 30,
    inspection_frequency: 'Arlig kontroll',
    regulation_ref: 'SJVFS 2004:62, 3 kap',
  },
  {
    material: 'Godselstuka (tillfaellig faltlagring)',
    min_capacity_months: null,
    construction_standard: 'Tillfaellig faltlagring tillaten for fastgodsel men kan inte ersatta godselplatta eller raknas in i lagringskapaciteten. Platsval: undvik nara vattendrag och dranering.',
    separation_distance_m: 30,
    inspection_frequency: 'Kontroll vid anvandning',
    regulation_ref: 'SJVFS 2004:62, 3 kap',
  },

  // === Tackning/covering requirements ===
  {
    material: 'Flytgodsel och urin (tackningskrav, Gotaland och sodra Svealand)',
    min_capacity_months: null,
    construction_standard: 'Tackningsplikt for flytgodsel- och urinbehallare pa bruk med over 10 DE i Stockholm, Uppsala, Sodermanland, Ostergotland, Jonkoping, Kronoberg, Kalmar, Gotland, Blekinge, Skane, Halland, Vastra Gotaland, samt slattbygd i Varmland, Orebro, Vastmanland. Godkanda metoder: stabil flytande tackning (skumflotor), plastfolie, stro, torv, lecakulor, tak.',
    separation_distance_m: null,
    inspection_frequency: 'Kontroll att tackning ar stabil och sammanhangande',
    regulation_ref: 'SJVFS 2004:62, 3 kap; Forordning 1998:915, 9a sek',
  },

  // === Ensilage (silage) ===
  {
    material: 'Ensilage (pressaft)',
    min_capacity_months: null,
    construction_standard: 'Pressaft maste samlas upp i behallare. Ej slappas till dike eller vattendrag. Ogenomslappligt underlag. Hog BOD-belastning om pressaft nar recipient.',
    separation_distance_m: 30,
    inspection_frequency: 'Kontroll vid ensilering',
    regulation_ref: 'SJVFS 2004:62, 3 kap; Miljobalken 2 kap',
  },

  // === Diesel och bransle ===
  {
    material: 'Diesel (cistern i mark, over 1 m3)',
    min_capacity_months: null,
    construction_standard: 'Dubbelvaggig tank eller invallning med 110% kapacitet. Sekundart skydd obligatoriskt. Invallning ska vara tat, hallbar och inspekterbar. Anmalan till kommunen kravs for cisterner >1 m3 i mark.',
    separation_distance_m: 50,
    inspection_frequency: 'Installationskontroll; revisionskontroll vart 6:e ar (vart 3:e ar i vattenskyddsomrade)',
    regulation_ref: 'NFS 2021:10; MSBFS 2018:3',
  },
  {
    material: 'Diesel (cistern ovan mark, over 1 m3 i vattenskyddsomrade)',
    min_capacity_months: null,
    construction_standard: 'Dubbelvaggig tank ELLER tathetsprovad cistern med invallning. Installationskontroll och revisionskontroll vart 3:e ar. Anmalan till kommunen vid installation.',
    separation_distance_m: 50,
    inspection_frequency: 'Revisionskontroll vart 3:e ar; ackrediterad kontrollant',
    regulation_ref: 'NFS 2021:10, 4 kap; Miljobalken 7 kap 21-22 sek',
  },
  {
    material: 'Diesel (cistern ovan mark, 150 L - 1 m3)',
    min_capacity_months: null,
    construction_standard: 'NFS 2021:10 galler fran 150 liter (sanktes fran 250 liter i NFS 2017:5). Sekundart skydd rekommenderas. Ingen installationskontroll kravs under 1 m3 utanfor vattenskyddsomrade.',
    separation_distance_m: null,
    inspection_frequency: 'Egenkontroll',
    regulation_ref: 'NFS 2021:10',
  },
  {
    material: 'Diesel (mobil tank, under 150 L)',
    min_capacity_months: null,
    construction_standard: 'ADR-godkand transportbehallare. Spill-kit obligatoriskt. Anvand droppskydd vid tankning. Ingen installationskontroll kravs.',
    separation_distance_m: null,
    inspection_frequency: 'Kontroll fore varje anvandning',
    regulation_ref: 'MSBFS 2018:3; ADR-S',
  },

  // === Bekampningsmedel ===
  {
    material: 'Bekampningsmedel (vaxtskyddsmedel)',
    min_capacity_months: null,
    construction_standard: 'Last forvaringsskip, ventilerat, frostfritt. Avstand fran brunnar och vattendrag. Skylt "Gift". Tillsluten forvaring. Barnsaker las.',
    separation_distance_m: null,
    inspection_frequency: 'Arlig inventering; utgangna medel som farligt avfall till godkand mottagare',
    regulation_ref: 'KIFS 2022:3 (ersatter KIFS 2008:3); SFS 2014:425',
  },

  // === Kemikalier ===
  {
    material: 'Kemikalier (ovriga, t.ex. syror, baser, losningsmedel)',
    min_capacity_months: null,
    construction_standard: 'Invallning eller uppsamlingskar. Sakerhetsdatablad tillgangligt. Separata utrymmen for ofortliga amnen. Ventilation.',
    separation_distance_m: null,
    inspection_frequency: 'Arlig kemikalieinventering; egenkontroll enligt Miljobalken 26 kap',
    regulation_ref: 'Miljobalken 14 kap; Forordning 2008:245',
  },

  // === Konstgodsel ===
  {
    material: 'Konstgodsel (handelsgodsel, ammoniumnitrat)',
    min_capacity_months: null,
    construction_standard: 'Torrt, under tak, borta fran vattendrag. AN-godsel (ammoniumnitrat) har sarskilda krav for stold- och brandskydd. SEVESO for >50 ton AN hog kategori.',
    separation_distance_m: null,
    inspection_frequency: 'Arlig kontroll; SEVESO-anmalan vid >50 ton AN',
    regulation_ref: 'MSBFS 2013:3; SJVFS 2004:62; Sevesodirektivet 2012/18/EU',
  },

  // === Rotrester (biogas digestate) ===
  {
    material: 'Rotrester (biogodsel)',
    min_capacity_months: 8,
    construction_standard: 'Samma krav som flytgodsel. Sluten behallare rekommenderas for att minska lukt och ammoniakforluster. SPCR 120-certifiering kravs for godsling.',
    separation_distance_m: 50,
    inspection_frequency: 'Arlig visuell kontroll; tatkontroll vart 6:e ar',
    regulation_ref: 'SJVFS 2004:62, 3 kap; SPCR 120',
  },

  // === Doda djur (dead animals) ===
  {
    material: 'Doda djur (kadaver, tillfaellig forvaring)',
    min_capacity_months: null,
    construction_standard: 'Tillfaellig forvaring pa hardgjord yta. Skyddad fran rovdjur och skadedjur. Kyld forvaring om hamtning drojer over 24 timmar sommartid. Nedgravning tillaten for enskilt mindre djur (ej notkreatur).',
    separation_distance_m: null,
    inspection_frequency: 'Omedelbar anmalan till Svensk Lantbrukstjanst for hamtning',
    regulation_ref: 'EG 1069/2009; SJVFS 2007:21; Miljobalken 15 kap',
  },
];

for (const row of storageRequirements) {
  db.run(
    `INSERT INTO storage_requirements (material, min_capacity_months, construction_standard, separation_distance_m, inspection_frequency, regulation_ref)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [row.material, row.min_capacity_months, row.construction_standard, row.separation_distance_m, row.inspection_frequency, row.regulation_ref],
  );
}
console.log(`Inserted ${storageRequirements.length} storage requirements`);

// ---------------------------------------------------------------------------
// BUFFER STRIP RULES (Jordbruksverket, Miljobalken, NFS 2015:2, KIFS 2022:3)
// ---------------------------------------------------------------------------
const bufferStripRules = [
  // === Godsling ===
  { watercourse_type: 'Dike (oeppet dike)', activity: 'Godsling', min_width_m: 2.0, conditions: 'Minst 2 meters skyddsavstand vid spridning av godsel intill oeppna diken. Galler for alla godseltyper.', scheme_payment: null, regulation_ref: 'SJVFS 2004:62; Jordbruksverket allmanna rad' },
  { watercourse_type: 'Dike (oeppet dike, sluttande mark >10%)', activity: 'Godsling', min_width_m: 6.0, conditions: 'Pa mark med mer an 10% lutning mot dike kravs minst 6 meters skyddszon for godsling.', scheme_payment: null, regulation_ref: 'SJVFS 2004:62, 5 kap; Grundvillkor SMR 2' },
  { watercourse_type: 'Vattendrag (baeck, a)', activity: 'Godsling', min_width_m: 6.0, conditions: 'Minst 6 meters skyddszon vid godsling nara storre vattendrag. Galler bade stallgodsel och handelsgodsel.', scheme_payment: null, regulation_ref: 'SJVFS 2004:62; Jordbruksverket allmanna rad' },
  { watercourse_type: 'Sjo eller hav', activity: 'Godsling', min_width_m: 6.0, conditions: 'Minst 6 meters skyddszon mot sjo eller havskust. Lansstyrelsen kan besluta om storre zon i kaensliga omraden.', scheme_payment: null, regulation_ref: 'SJVFS 2004:62; Miljobalken 2 kap' },

  // === Vaxtskyddsmedel (plant protection products) ===
  { watercourse_type: 'Dike (oeppet dike)', activity: 'Vaxtskyddsbehandling', min_width_m: 2.0, conditions: 'Fast skyddsavstand: minst 2 meter till oeppna diken vid spridning av vaxtskyddsmedel. Produktspecifika villkor kan krava storre avstand (6-20 m). Se produktetikett.', scheme_payment: null, regulation_ref: 'NFS 2015:2; KIFS 2022:3; produktetikett' },
  { watercourse_type: 'Draneringsbrunn', activity: 'Vaxtskyddsbehandling', min_width_m: 2.0, conditions: 'Fast skyddsavstand: minst 2 meters avstand till draneringsbrunnar och dagvattenbrunnar vid spridning av vaxtskyddsmedel.', scheme_payment: null, regulation_ref: 'NFS 2015:2; KIFS 2022:3' },
  { watercourse_type: 'Vattendrag (baeck, a)', activity: 'Vaxtskyddsbehandling', min_width_m: 6.0, conditions: 'Fast skyddsavstand: minst 6 meter till sjor och vattendrag matts fran strandbrinken eller hogvattenlinjen. Vindavsatt sprutning kraver extra avstand.', scheme_payment: null, regulation_ref: 'NFS 2015:2; KIFS 2022:3' },
  { watercourse_type: 'Sjo eller hav', activity: 'Vaxtskyddsbehandling', min_width_m: 6.0, conditions: 'Fast skyddsavstand: minst 6 meters avstand till sjor och havskust. Produktspecifika villkor kan krava storre avstand.', scheme_payment: null, regulation_ref: 'NFS 2015:2; KIFS 2022:3' },
  { watercourse_type: 'Dricksvattenbrunn', activity: 'Vaxtskyddsbehandling', min_width_m: 12.0, conditions: 'Fast skyddsavstand: minst 12 meters avstand till dricksvattenbrunnar. Avstand galler bade enskilda och kommunala brunnar.', scheme_payment: null, regulation_ref: 'NFS 2015:2; KIFS 2022:3' },
  { watercourse_type: 'Anpassat skyddsavstand', activity: 'Vaxtskyddsbehandling', min_width_m: 2.0, conditions: 'Utover fasta avstand ska anpassade skyddsavstand bestammas vid varje spridningstillfalle med hjalp av Kemikalieinspektionens Hjalpreda. Minsta anpassade avstand ar 2 meter. Anpassas efter vindstyrka, riktning, temperatur, avsattningsteknologi.', scheme_payment: null, regulation_ref: 'KIFS 2022:3; NFS 2015:2' },

  // === Miljoersattning skyddszoner (CAP scheme) ===
  { watercourse_type: 'Alla vattendrag', activity: 'Miljoersattning skyddszoner (6-20 m)', min_width_m: 6.0, conditions: 'Skyddszon 6-20 m med permanent graes. Insas senast 1 september, ej godslas eller besprutas. Arlig slatter kravs, slatterrester bortfors.', scheme_payment: '3000 SEK/ha (CAP 2023-2027)', regulation_ref: 'Jordbruksverket miljoersattning; SAM-ansokan' },
  { watercourse_type: 'Alla vattendrag', activity: 'Miljoersattning skyddszoner (bredare, prioriterat omrade)', min_width_m: 20.0, conditions: 'Upp till 20 meters bredd i prioriterade omraden. Hogre ersattning for bredare zoner. Prioriterade omraden definieras av Vattenmyndigheterna.', scheme_payment: '3000 SEK/ha (CAP 2023-2027)', regulation_ref: 'Jordbruksverket miljoersattning; SAM-ansokan' },
  { watercourse_type: 'Alla vattendrag', activity: 'Anlagda vatmarker (miljoersattning)', min_width_m: null, conditions: 'Ersattning for anlagda vatmarker och dammar som renar vatten fran jordbruksmark. Minst 0,1 ha. Atagande 5 ar.', scheme_payment: '4000-8000 SEK/ha (CAP 2023-2027)', regulation_ref: 'Jordbruksverket miljoersattning; SAM-ansokan' },

  // === Vattenskyddsomrade och biotopskydd ===
  { watercourse_type: 'Vattenskyddsomrade', activity: 'All jordbruksverksamhet', min_width_m: null, conditions: 'Lokala foreskrifter galler. Ofta totalforbud mot godsling och bekampning i inre skyddszonen. Kontakta kommunen for galtande foreskrift.', scheme_payment: null, regulation_ref: 'Miljobalken 7 kap 21-22 sek; lokal foreskrift' },
  { watercourse_type: 'Biotopskyddsomrade (smaavatten, naturliga backfavor)', activity: 'All jordbruksverksamhet', min_width_m: null, conditions: 'Generellt biotopskydd for smaavatten, oeppna diken, dammar och naturliga backfaror i jordbruksmark. Forbud mot atgarder som skadar naturmiljon. Dispens kan sokas.', scheme_payment: null, regulation_ref: 'Miljobalken 7 kap 11 sek; Forordning 1998:1252' },
  { watercourse_type: 'Strandskyddsomrade', activity: 'Nyodling och anlaggning', min_width_m: null, conditions: 'Strandskydd 100 m fran strandlinjen (utokat till 300 m i vissa omraden). Forbud mot nybebyggelse och atgarder som forandrar livsvillkor for vaxter och djur. Dispens fran Lansstyrelsen.', scheme_payment: null, regulation_ref: 'Miljobalken 7 kap 13-18 sek' },

  // === Dranering ===
  { watercourse_type: 'Dranering (tackdike)', activity: 'Godsling', min_width_m: null, conditions: 'Inte direkt buffertbredskrav men strukturkalkning och anpassade brunnar rekommenderas for att minska lakning. Reglerbar dranering kan minska kvaveutlakningen med 20-30%.', scheme_payment: null, regulation_ref: 'Jordbruksverket radgivning; Greppa naringen' },
  { watercourse_type: 'Natura 2000-omrade', activity: 'Godsling och bekampning', min_width_m: null, conditions: 'Tillstand fran Lansstyrelsen kravs for atgarder som pa ett betydande satt kan paverka miljon i Natura 2000-omrade. Inte generellt forbud mot pagaende markanvandning.', scheme_payment: null, regulation_ref: 'Miljobalken 7 kap 28a sek; Artskyddsforordningen' },
];

for (const row of bufferStripRules) {
  db.run(
    `INSERT INTO buffer_strip_rules (watercourse_type, activity, min_width_m, conditions, scheme_payment, regulation_ref)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [row.watercourse_type, row.activity, row.min_width_m, row.conditions, row.scheme_payment, row.regulation_ref],
  );
}
console.log(`Inserted ${bufferStripRules.length} buffer strip rules`);

// ---------------------------------------------------------------------------
// ABSTRACTION RULES (Miljobalken 11 kap, Forordning 1998:1388, HaV)
// ---------------------------------------------------------------------------
const abstractionRules = [
  // === Ytvatten (surface water) — Forordning 1998:1388 sec 19 ===
  { source_type: 'Ytvatten fran vattendrag (anmaelningsplikt)', threshold_m3_per_day: 600, licence_required: 0, exemptions: 'Uttag hogst 600 m3/dag och hogst 100 000 m3/ar fran vattendrag kan anmalas till Lansstyrelsen (Forordning 1998:1388, 19 sek punkt 6).', conditions: 'Anmalan till tillsynsmyndigheten (Lansstyrelsen) minst 8 veckor fore uttag paborjas. Lansstyrelsen kan forelagga om tillstandsplikt vid paverkan pa vattenmiljon.' },
  { source_type: 'Ytvatten fran vattendrag (tillstandsplikt)', threshold_m3_per_day: 600, licence_required: 1, exemptions: 'Hushalls- och djurbehov for en- och tvafamiljsfastighet undantas fran tillstandsplikt (MB 11 kap 11 sek).', conditions: 'Uttag over 600 m3/dag eller over 100 000 m3/ar fran vattendrag kraver tillstand fran Mark- och miljodomstolen. Hydrogeologisk utredning kravs.' },
  { source_type: 'Ytvatten fran sjo (anmaelningsplikt)', threshold_m3_per_day: 1000, licence_required: 0, exemptions: 'Uttag hogst 1000 m3/dag och hogst 200 000 m3/ar fran sjo/annat vattenomrade kan anmalas till Lansstyrelsen (Forordning 1998:1388, 19 sek punkt 7).', conditions: 'Anmalan minst 8 veckor fore uttag. For storre uttag kravs tillstand fran Mark- och miljodomstolen.' },
  { source_type: 'Ytvatten fran sjo (tillstandsplikt)', threshold_m3_per_day: 1000, licence_required: 1, exemptions: null, conditions: 'Uttag over 1000 m3/dag fran sjo eller over 200 000 m3/ar kraver tillstand fran Mark- och miljodomstolen.' },

  // === Grundvatten (groundwater) ===
  { source_type: 'Grundvatten (borrning av brunn)', threshold_m3_per_day: null, licence_required: 1, exemptions: 'Enskild vattenforsorjning for hushall undantagen (MB 11 kap 11 sek). Certifierad brunnsborrentreprenor kravs. Anmalan till SGU brunnsarkiv.', conditions: 'Borrning av brunn ar anmalningspliktigt till kommunen. Vid vasentlig paverkan pa vattenmiljon kan Lansstyrelsen forelagga om tillstandsplikt.' },
  { source_type: 'Grundvatten (storre uttag)', threshold_m3_per_day: null, licence_required: 1, exemptions: null, conditions: 'Storre grundvattenuttag kraver tillstand fran Mark- och miljodomstolen. Hydrologisk undersokning med konsekvensbedoming obligatorisk. Paverkan pa grannar och natur ska utredas.' },
  { source_type: 'Grundvatten i vattenskyddsomrade', threshold_m3_per_day: null, licence_required: 1, exemptions: null, conditions: 'Sarskilt restriktivt i vattenskyddsomraden. Kommunen kan krava tillstand for alla grundvattenuttag (MB 9 kap 10 sek). Lokala foreskrifter styr.' },

  // === Bevattning (irrigation) ===
  { source_type: 'Bevattning fran vattendrag (jordbruk)', threshold_m3_per_day: 600, licence_required: 0, exemptions: 'Bevattning fran vattendrag med hogst 600 m3/dag och hogst 100 000 m3/ar anmalan till Lansstyrelsen (1998:1388, 19 sek).', conditions: 'Lansstyrelsen eller kommunen kan besluta om bevattningsforbud vid torka. Kontrollera aktuella restriktioner. Begransa uttag vid lag vattenfoering.' },
  { source_type: 'Bevattning fran sjo (jordbruk)', threshold_m3_per_day: 1000, licence_required: 0, exemptions: 'Bevattning fran sjo med hogst 1000 m3/dag och hogst 200 000 m3/ar anmalan till Lansstyrelsen.', conditions: 'Storre uttag kraver tillstand. Restriktioner vid lag vattennivaer. Anmalan 8 veckor fore sasongen.' },
  { source_type: 'Bevattning fran grundvatten (jordbruk)', threshold_m3_per_day: null, licence_required: 1, exemptions: 'Enskilt hushallsbehov undantas. Jordbruksbevattning fran grundvatten kraver normalt tillstand.', conditions: 'Risk for grundvattensankning. Hydrogeologisk utredning kan kravas. Sarskilt restriktivt i vattenskyddsomrade.' },

  // === Vattenverksamhet (general water operations) — Forordning 1998:1388 ===
  { source_type: 'Vattenverksamhet (generellt)', threshold_m3_per_day: null, licence_required: 1, exemptions: 'Underhall av befintliga anlaggningar undantas i vissa fall (MB 11 kap 12 sek). Aktivitet som uppenbart inte skadar allman eller enskild intressen undantas (tolkas restriktivt).', conditions: 'All vattenverksamhet enligt MB 11 kap kraver antingen tillstand (Mark- och miljodomstolen) eller anmalan (Lansstyrelsen).' },
  { source_type: 'Anlaggning i vattendrag (anmaelningsplikt)', threshold_m3_per_day: null, licence_required: 0, exemptions: 'Bottenyta som verksamheten omfattar i vattendraget hogst 500 m2 (Forordning 1998:1388, 19 sek punkt 2).', conditions: 'Anlaggning i vattendrag kan anmalas om bottenarean ar hogst 500 m2. Storre anlaggningar kraver tillstand.' },
  { source_type: 'Anlaggning i annat vattenomrade (anmaelningsplikt)', threshold_m3_per_day: null, licence_required: 0, exemptions: 'Bottenyta som verksamheten omfattar i vattenomradet hogst 3000 m2 (Forordning 1998:1388, 19 sek punkt 3).', conditions: 'Anlaggning i sjo eller annat vattenomrade kan anmalas om bottenarean ar hogst 3000 m2.' },
  { source_type: 'Gravning i vattendrag (anmaelningsplikt)', threshold_m3_per_day: null, licence_required: 0, exemptions: 'Medelvattenforingen hogst 1 m3/sekund (Forordning 1998:1388, 19 sek punkt 4).', conditions: 'Gravning, rensning eller muddring i vattendrag med medelvattenfoering hogst 1 m3/s kan anmalas.' },
  { source_type: 'Vatmark (anlaggande, anmaelningsplikt)', threshold_m3_per_day: null, licence_required: 0, exemptions: 'Vattenomradet har en yta som inte overstiger 5 hektar (Forordning 1998:1388, 19 sek punkt 1).', conditions: 'Anlaggning av vatmark med yta hogst 5 ha kan anmalas. Strandskyddsdispens kan behovas. Miljoersattning kan sokas via SAM-ansokan.' },
  { source_type: 'Damm (uppforande eller andrande)', threshold_m3_per_day: null, licence_required: 1, exemptions: null, conditions: 'Tillstand fran Mark- och miljodomstolen. Dammsakerhetsklass bestams av Lansstyrelsen. Underhallsskyldighet.' },
  { source_type: 'Markavvattning (nydikning)', threshold_m3_per_day: null, licence_required: 1, exemptions: 'Underhallsdikning av befintliga diken kraver anmalan, ej tillstand (om ej vasentlig andring).', conditions: 'Nydikning ar forbjuden i Skane, Blekinge, Halland, Gotland (inkl 6 lan enl Forordning 1998:1388, 4 sek) utan dispens. I ovriga Sverige kraver nydikning tillstand fran Mark- och miljodomstolen.' },
  { source_type: 'Vatmark (aterstaellning)', threshold_m3_per_day: null, licence_required: 0, exemptions: 'Aterstaellning av vatmark kan i vissa fall vara undantagen fran tillstandsplikt om det syftar till att forbattra vattnets ekologiska status.', conditions: 'Anmalan till Lansstyrelsen. Kan behoeva strandskyddsdispens. Miljoersattning kan sokas via SAM-ansokan.' },
];

for (const row of abstractionRules) {
  db.run(
    `INSERT INTO abstraction_rules (source_type, threshold_m3_per_day, licence_required, exemptions, conditions)
     VALUES (?, ?, ?, ?, ?)`,
    [row.source_type, row.threshold_m3_per_day, row.licence_required, row.exemptions, row.conditions],
  );
}
console.log(`Inserted ${abstractionRules.length} abstraction rules`);

// ---------------------------------------------------------------------------
// POLLUTION PREVENTION (Miljobalken, NFS, SJVFS, SFS 2014:425)
// ---------------------------------------------------------------------------
const pollutionPrevention = [
  {
    activity: 'Flytgodselhantering (spridning och lagring)',
    hazards: 'Ammoniakavgang, kvavelakning till grundvatten, fosforavrinning till vattendrag, lukt',
    control_measures: 'Bandspridning eller myllning. Nedbrukning inom 4 timmar pa obevuxen mark. Sluten lagring med tackning. Spridning enligt godselplan.',
    regulatory_requirements: 'Godselberakning kravs (SJVFS 2004:62). Miljofarlig verksamhet vid >100 djurenheter (anmalan C), >400 djurenheter (tillstand B). Egenkontroll enligt MB 26 kap.',
    regulation_ref: 'SJVFS 2004:62; Miljobalken 9 kap; MPF 2013:251',
  },
  {
    activity: 'Ensilering (beredning och lagring)',
    hazards: 'Pressaft med hogt BOD-varde fororenar vattendrag. Syreutarmning vid utslopp i fiskevatten.',
    control_measures: 'Uppsamling av pressaft i sluten behallare. Ogenomslappligt underlag under ensilagestack. Avstand minst 30 m fran vattendrag.',
    regulatory_requirements: 'Egenkontroll enligt MB 26 kap. Dagvatten fran foderplatser hanteras separat.',
    regulation_ref: 'Miljobalken 2 kap; SJVFS 2004:62',
  },
  {
    activity: 'Diesellagring och tankning pa gard',
    hazards: 'Markfororeningar, grundvattenfororeningar vid lackage eller spill',
    control_measures: 'Dubbelvaggig tank eller invallning (110% kapacitet). Spillkit vid tankstation. Droppskydd vid tankning. Tat underlag.',
    regulatory_requirements: 'Cisternkontroll: installationskontroll + revisionskontroll vart 6:e ar (vart 3:e ar i vattenskyddsomrade). Anmalan till kommunen for cisterner >1 m3 i mark. NFS 2021:10 galler fran 150 liter.',
    regulation_ref: 'NFS 2021:10; MSBFS 2018:3; Miljobalken 2 kap',
  },
  {
    activity: 'Bekampningsmedelshantering (vaxtskyddsmedel)',
    hazards: 'Grundvattenfororeningar, skadar vattenlevande organismer, bianvorgifter',
    control_measures: 'Pafyllning pa biobad eller tat platta med uppsamling. Inre och yttre skyddsavstand. Funktionstest av spruta vart 3:e ar. Dokumentation av all anvandning. Behorighetskrav.',
    regulatory_requirements: 'Behorigetsbevis kravs (Jordbruksverket). Integrerat vaxtskydd (IPM) obligatoriskt sedan 2014. Anmalan vid yrkesmassig anvandning i vattenskyddsomrade. Medel i klass 1 och 2 enbart yrkesmassig anvandning.',
    regulation_ref: 'SFS 2014:425; KIFS 2022:3; NFS 2015:2; Miljobalken 14 kap',
  },
  {
    activity: 'Vaxtskyddsmedel i vattenskyddsomrade',
    hazards: 'Grundvattenfororening, fororenad dricksvattenforsorjning',
    control_measures: 'Tillstandsansokan eller anmalan till kommunen. Anvand produkter med lag lakagerisk. Extra skyddsavstand. Biobad for spolvatten.',
    regulatory_requirements: 'Tillstand fran kommunen kravs for yrkesmassig anvandning i vattenskyddsomrade. Lansstyrelsen kan forbjuda anvandning helt.',
    regulation_ref: 'SFS 2014:425, 2 kap 37-40 sek; NFS 2015:2',
  },
  {
    activity: 'Kadaverhantering (doda djur)',
    hazards: 'Sjukdomsspridning, fororeningar av mark och vatten, skadedjurstillgang',
    control_measures: 'Anmalan till Jordbruksverket (TSE-fall) eller Svensk Lantbrukstjanst for hamtning. Tillfaellig forvaring pa hardgjord yta. Nedgravning tillaten for enskilt mindre djur (ej notkreatur, kontrollera lokala regler).',
    regulatory_requirements: 'ABP-forordningen (EG 1069/2009). Anmalan till kommunens miljokontor vid storstald dodlighet. Folja lokala halsoskyddsforeskrifter.',
    regulation_ref: 'EG 1069/2009; SJVFS 2007:21; Miljobalken 15 kap',
  },
  {
    activity: 'Veterinaravfall (lakemedelsrester, kanyler)',
    hazards: 'Lakemedelsrester i miljon, stickskador, antibiotikaresistens',
    control_measures: 'Separera kanyler i sticksakra behallare. Lakemedelsrester som farligt avfall till apotek eller godkand mottagare. Dokumentera karensstider.',
    regulatory_requirements: 'Avfallsforordningen (SFS 2020:614). Lakemedelsverkets foreskrifter. Karensstider enligt FASS Vet.',
    regulation_ref: 'SFS 2020:614; LVFS; Miljobalken 15 kap',
  },
  {
    activity: 'Plastavfall fran jordbruket',
    hazards: 'Mikroplastspridning, markfororeningar, nedskrapning',
    control_measures: 'Ensilageplast, godselsackar och draneringsror till atervinning (SvepRetur eller likvardigt). Branning av plastavfall forbjuden.',
    regulatory_requirements: 'Avfallsforordningen (SFS 2020:614). Producentansvar for forpackningar. Kommunens avfallsplan.',
    regulation_ref: 'SFS 2020:614; Miljobalken 15 kap',
  },
  {
    activity: 'Maskintvatt och verkstadsarbete',
    hazards: 'Olje- och kemikalieutslepp till dagvatten och mark',
    control_measures: 'Tvattplatta med oljeavskiljare ansluten till spillvattennat eller sluten tank. Spanprodukter for lackageskydd. Periodisk tomning.',
    regulatory_requirements: 'Oljeavskiljare enligt SS-EN 858. Tomning av avskiljare till godkand mottagare. Egenkontroll.',
    regulation_ref: 'Miljobalken 2 kap; SS-EN 858',
  },
  {
    activity: 'Grovfoderodling (avrinning fran foderplatser)',
    hazards: 'Naringslakage fran foderplatser och utfodringsytor till vattendrag',
    control_measures: 'Hardgjord yta under foderplatser. Uppsamling av dagvatten fran foderplatser. Avledning till godselbrunn eller slutet system.',
    regulatory_requirements: 'Egenkontroll enligt MB 26 kap. Foderplatser pa ogenomslappligt underlag om over 10 djurenheter.',
    regulation_ref: 'SJVFS 2004:62; Miljobalken 2 kap',
  },
  {
    activity: 'Ammoniakutslapp fran djurstallar',
    hazards: 'Forsuming, overgodning av kaensliga naturomraden, halsoeffekter',
    control_measures: 'Val av stallsystem (golv, ventilation). Tackta godselbehallare. Bandspridning/myllning vid spridning. Utfodringsstrategi (lagproteinfoderstat).',
    regulatory_requirements: 'MKB-plikt for >400 djurenheter (B-verksamhet). NEC-direktivet 2016/2284. Miljokvalitetsnormer for luft.',
    regulation_ref: 'Miljobalken 9 kap; NEC-direktivet 2016/2284; MPF 2013:251',
  },
  {
    activity: 'Brandfarlig vara pa lantbruk',
    hazards: 'Brand, explosion, miljofororeningar vid brandslackning',
    control_measures: 'Brandklassad forvaring. Separat lagring av AN-godsel. Brandslackare tillganglig. Avstend fran byggnader och foder.',
    regulatory_requirements: 'Anmalan eller tillstand fran kommunens raddningstjanst for hantering av brandfarlig vara over vissa mangder. SEVESO-anmalan vid >50 ton AN.',
    regulation_ref: 'Lag 2010:1011 om brandfarliga och explosiva varor; MSBFS 2013:3',
  },
  {
    activity: 'Buller fran jordbruksverksamhet',
    hazards: 'Storning for grannar, paverkan pa djurliv i skyddade omraden',
    control_measures: 'Arbetsschema anpassat till tider. Underhall av maskiner. Bullerdampande atgarder vid stallar nara bostader.',
    regulatory_requirements: 'Riktvarden for industri- och verksamhetsbuller (Naturvardsverket). Kan ingra i miljovillkor for B/C-verksamheter.',
    regulation_ref: 'Miljobalken 9 kap; Naturvardsverket allmanna rad 1978:5',
  },
  {
    activity: 'Dagvattenhantering fran gardsplan',
    hazards: 'Oljespill, godselrester och sediment transporteras till recipient',
    control_measures: 'Oljeavskiljare vid gardsplan. Sedimentationsdam. Avledning av rent dagvatten separat fran fororenat dagvatten.',
    regulatory_requirements: 'Egenkontroll. B/C-verksamheter ska hantera dagvatten i miljorapport.',
    regulation_ref: 'Miljobalken 2 kap; Forordning 1998:899',
  },
  {
    activity: 'Markfoeroreningar (aeldre verksamhetsomraden)',
    hazards: 'Rester fran tidigare bekampningsmedelsdopning, dieselspill, kvicksilverbetning',
    control_measures: 'Miljoundersokning vid misstanke. Anmalan till tillsynsmyndigheten vid paborjad sanering. Avhjalpandeansvar enligt MB 10 kap.',
    regulatory_requirements: 'Anmalan till tillsynsmyndigheten om fororening upptacks. Avhjalpandeansvar oavsett om fororeningen ar gammal. Lansstyrelsen har EBH-databasen (efterbehandling).',
    regulation_ref: 'Miljobalken 10 kap; Forordning 2007:667',
  },
];

for (const row of pollutionPrevention) {
  db.run(
    `INSERT INTO pollution_prevention (activity, hazards, control_measures, regulatory_requirements, regulation_ref)
     VALUES (?, ?, ?, ?, ?)`,
    [row.activity, row.hazards, row.control_measures, row.regulatory_requirements, row.regulation_ref],
  );
}
console.log(`Inserted ${pollutionPrevention.length} pollution prevention rules`);

// ---------------------------------------------------------------------------
// EIA SCREENING (Miljobalken 6 kap, Miljoprovningsforordningen 2013:251)
// Complete with all verksamhetskoder from MPF
// ---------------------------------------------------------------------------
const eiaScreening = [
  // === Djurhallning (animal husbandry) — MPF 2013:251 ===
  { project_type: 'Djurhallning — intensiv (verksamhetskod 1.10-i, B)', threshold_area_ha: null, threshold_other: '>40 000 platser for fjaderfae ELLER >2 000 platser for slaktsvin >30 kg ELLER >750 platser for suggor', screening_required: 1, process: 'Tillstandspliktig B-verksamhet (MPF 2013:251, 1.10-i). Tillstand fran Lansstyrelsen med MKB. IED-anlaggning (Industriutslappsforordningen). Automatisk MKB-plikt.' },
  { project_type: 'Djurhallning — notkreatur/hastar/mink (verksamhetskod 1.11, B)', threshold_area_ha: null, threshold_other: '>400 djurenheter notkreatur, hastar eller mink', screening_required: 1, process: 'Tillstandspliktig B-verksamhet (MPF 2013:251, 1.11). Tillstand fran Lansstyrelsen med MKB. 1 djurenhet = 1 mjolkko inkl kalv, 3 ovriga not, 1 hast, 10 minkhonor. Inhagnad undantas.' },
  { project_type: 'Djurhallning — mellanstor (verksamhetskod 1.20, C)', threshold_area_ha: null, threshold_other: '>100 djurenheter (alla djurslag)', screening_required: 1, process: 'Anmalningspliktig C-verksamhet (MPF 2013:251, 1.20). Anmalan till kommunens miljonamnd. Behovsbedoming av MKB kan kravas. Inhagnad undantas.' },
  { project_type: 'Djurhallning — fjaderfae (B-verksamhet)', threshold_area_ha: null, threshold_other: '>40 000 platser for fjaderfae', screening_required: 1, process: 'Tillstandspliktig B-verksamhet (MPF 2013:251, 1.10-i punkt 1). Tillstand fran Lansstyrelsen med MKB. Galler hons, kalkoner och andra fjaderfae.' },
  { project_type: 'Djurhallning — slaktsvin (B-verksamhet)', threshold_area_ha: null, threshold_other: '>2 000 platser for slaktsvin >30 kg', screening_required: 1, process: 'Tillstandspliktig B-verksamhet (MPF 2013:251, 1.10-i punkt 2). Tillstand fran Lansstyrelsen med MKB.' },
  { project_type: 'Djurhallning — suggor (B-verksamhet)', threshold_area_ha: null, threshold_other: '>750 platser for suggor', screening_required: 1, process: 'Tillstandspliktig B-verksamhet (MPF 2013:251, 1.10-i punkt 3). Tillstand fran Lansstyrelsen med MKB.' },
  { project_type: 'Djurhallning — palsdjur/minkfarm (B-verksamhet)', threshold_area_ha: null, threshold_other: '>400 djurenheter mink (1 DE = 10 minkhonor)', screening_required: 1, process: 'Tillstandspliktig B-verksamhet (MPF 2013:251, 1.11). Sarskild bedomning av ammoniakpaverkan.' },

  // === Uppodling (land use change) — MPF 2013:251 verksamhetskod 1.30 ===
  { project_type: 'Uppodling av mark (verksamhetskod 1.30, C)', threshold_area_ha: null, threshold_other: 'Uppodling av annan mark an jordbruksmark for produktion', screening_required: 1, process: 'Anmalningspliktig C-verksamhet (MPF 2013:251, 1.30). Anmalan till kommunen.' },
  { project_type: 'Uppodling av mark >10 ha (samradsplikt)', threshold_area_ha: 10.0, threshold_other: null, screening_required: 1, process: 'Uppodling av >10 ha tidigare ouppodlad mark ar samradspliktig (MB 12 kap 6 sek). Lansstyrelsen bedomer MKB-plikt. Kan paverka biologisk mangfald.' },
  { project_type: 'Uppodling av vatmark', threshold_area_ha: null, threshold_other: 'Alla storlekar', screening_required: 1, process: 'Uppodling av vatmark ar forbjuden utan dispens fran Lansstyrelsen (MB 7 kap 15 sek). MKB kravs alltid. Skydd for biologisk mangfald.' },

  // === Dikning (drainage) ===
  { project_type: 'Dikning (nydikning)', threshold_area_ha: null, threshold_other: 'Alla storlekar', screening_required: 1, process: 'Nydikning ar vattenverksamhet och kraver tillstand fran Mark- och miljodomstolen. MKB kravs. Markavvattning forbjuden i Skane, Blekinge, Halland, Gotland (+ ytterligare 6 lan) utan dispens (Forordning 1998:1388, 4 sek).' },
  { project_type: 'Dikning (underhallsdikning)', threshold_area_ha: null, threshold_other: 'Vasentlig andring', screening_required: 0, process: 'Normalt underhall av befintliga diken ar ej tillstandspliktigt. Anmalan till Lansstyrelsen vid vasentlig andring av vattenmiljon (Forordning 1998:1388, 19 sek).' },

  // === Skogsbruk (forestry) ===
  { project_type: 'Avverkning (slutavverkning >0.5 ha)', threshold_area_ha: 0.5, threshold_other: null, screening_required: 0, process: 'Avverkningsanmalan till Skogsstyrelsen 6 veckor i forvag for >0,5 ha. Ej formellt MKB-plikt men hansynskrav enligt Skogsvardslag (1979:429).' },
  { project_type: 'Avverkning i nyckelbiotyp eller Natura 2000', threshold_area_ha: null, threshold_other: 'Alla storlekar', screening_required: 1, process: 'Avverkning i nyckelbiotyp eller inom Natura 2000-omrade kraver samrad med Lansstyrelsen. MKB kan kravas. Artskyddsforordningen galler.' },

  // === Energi (energy) ===
  { project_type: 'Vindkraft (stor anlaggning, B)', threshold_area_ha: null, threshold_other: '>150 m totalhojd eller >7 verk', screening_required: 1, process: 'Tillstandspliktig B-verksamhet (MPF 2013:251). MKB kravs. Ansokan till Lansstyrelsen. Kommunalt veto (MB 16 kap 4 sek). Artskydd, buller och landskapspasverkan bedomas.' },
  { project_type: 'Vindkraft (mindre anlaggning, C)', threshold_area_ha: null, threshold_other: '50-150 m totalhojd', screening_required: 1, process: 'Anmalningspliktig C-verksamhet (50-150 m). Anmalan till kommunen. Behovsbedoming av MKB. Bygglov kravs dessutom.' },
  { project_type: 'Vindkraft (galdsvindkraftverk)', threshold_area_ha: null, threshold_other: '<50 m totalhojd', screening_required: 0, process: 'Verk under 50 m totalhojd kraver normalt bara bygglov. Ingen anmalan enligt miljobalken om inte sarskilda forhallanden foreligger.' },
  { project_type: 'Solcellspark (markforlagd)', threshold_area_ha: null, threshold_other: 'Behovsbedoming (Lansstyrelsen)', screening_required: 0, process: 'Ingen specifik MKB-troskel i lag men storre anlaggningar (>5 ha) kan krava samrad (MB 12 kap 6 sek). Lansstyrelsen bedomer paverkan. Bygglov kravs for omradesbestammelser.' },
  { project_type: 'Biogas (biogasanlaggning pa gard)', threshold_area_ha: null, threshold_other: 'Beror pa storlek och substrat', screening_required: 1, process: 'Anmalningsplikt C-verksamhet for gardsanlaggning. Storre anlaggningar kan vara B-verksamhet. Sakerhetskrav fran MSB for brandfarlig gas.' },

  // === Takt och utvinning (extraction) ===
  { project_type: 'Takt (grustakt, bergtakt, B)', threshold_area_ha: null, threshold_other: '>10 000 ton/ar eller >1 ha', screening_required: 1, process: 'Tillstandspliktig B-verksamhet (MPF 2013:251). MKB kravs. Ansokan till Lansstyrelsen. Aterstaellningsplan obligatorisk.' },
  { project_type: 'Torvtakt (stor, verksamhetskod 10.10, B)', threshold_area_ha: 150.0, threshold_other: '>150 ha driftomrade', screening_required: 1, process: 'Tillstandspliktig B-verksamhet for torvtakt >150 ha (MPF 2013:251, 10.10). Lansstyrelsen provar. MKB kravs. Klimatpaverkan ska bedomas.' },
  { project_type: 'Torvtakt (liten, C)', threshold_area_ha: null, threshold_other: '<150 ha driftomrade', screening_required: 1, process: 'Anmalningspliktig C-verksamhet for torvtakt <150 ha. Anmalan till kommunen. Behovsbedoming av MKB.' },

  // === Vattenbruk (aquaculture) — MPF 2013:251 ===
  { project_type: 'Vattenbruk (fiskodling, verksamhetskod 5.10, B)', threshold_area_ha: null, threshold_other: '>40 ton foder/kalenderar', screening_required: 1, process: 'Tillstandspliktig B-verksamhet vid forbrukning av mer an 40 ton foder per kalenderar (MPF 2013:251, 5.10). MKB kravs. Ansokan till Lansstyrelsen. Paverkan pa recipientvatten bedomas.' },
  { project_type: 'Vattenbruk (fiskodling, verksamhetskod 5.20, C)', threshold_area_ha: null, threshold_other: '>1,5 ton foder/kalenderar', screening_required: 1, process: 'Anmalningspliktig C-verksamhet vid forbrukning av mer an 1,5 ton foder per kalenderar (MPF 2013:251, 5.20). Anmalan till kommunen.' },
  { project_type: 'Vattenbruk (yrkesmassig, verksamhetskod 5.30, C)', threshold_area_ha: null, threshold_other: 'Yrkesmassig vattenbruksverksamhet', screening_required: 1, process: 'Anmalningspliktig C-verksamhet for yrkesmassigt vattenbruk i vattenomrade eller landbaserad anlaggning (MPF 2013:251, 5.30).' },
];

for (const row of eiaScreening) {
  db.run(
    `INSERT INTO eia_screening (project_type, threshold_area_ha, threshold_other, screening_required, process)
     VALUES (?, ?, ?, ?, ?)`,
    [row.project_type, row.threshold_area_ha, row.threshold_other, row.screening_required, row.process],
  );
}
console.log(`Inserted ${eiaScreening.length} EIA screening rules`);

// ---------------------------------------------------------------------------
// DESIGNATED NITRATE-SENSITIVE AREAS BY LAN
// (SJVFS 2004:62, Forordning 1998:915 sek 5)
// ---------------------------------------------------------------------------
const designatedNvz = [
  // Category 1: Skane/Blekinge/Halland/Gotland/Oland/kustzoner — strictest rules
  { lan: 'Skane', coverage: 'Hela lanet', category: 'Kategori 1 (kustzoner)', notes: 'Hela Skane lan ar nitratkansligt. Striktaste regler: 8-10 manaders lagring, nedbrukning inom 4 timmar, tackningsplikt.', regulation_ref: 'Forordning 1998:915, 5 sek; SJVFS 2004:62' },
  { lan: 'Blekinge', coverage: 'Hela lanet', category: 'Kategori 1 (kustzoner)', notes: 'Hela Blekinge lan ar nitratkansligt. Samma strikta regler som Skane.', regulation_ref: 'Forordning 1998:915, 5 sek; SJVFS 2004:62' },
  { lan: 'Halland', coverage: 'Hela lanet (utom Hylte kommun)', category: 'Kategori 1 (kustzoner)', notes: 'Hela Halland utom Hylte kommun ar nitratkansligt. Striktaste reglerna for lagring och spridning.', regulation_ref: 'Forordning 1998:915, 5 sek; Forordning 1998:1388, 4 sek' },
  { lan: 'Gotland', coverage: 'Hela lanet', category: 'Kategori 1 (kustzoner)', notes: 'Hela Gotlands lan ar nitratkansligt. Sarskilt kaensligt grundvatten (kalkstensjord). 8-10 manaders lagringskrav.', regulation_ref: 'Forordning 1998:915, 5 sek; SJVFS 2004:62' },
  { lan: 'Kalmar (Oland)', coverage: 'Oland (hela)', category: 'Kategori 1 (kustzoner)', notes: 'Oland ar nitratkansligt omrade. Samma regler som Gotland.', regulation_ref: 'Forordning 1998:915, 5 sek' },

  // Category 1 continued: coastal areas
  { lan: 'Stockholm', coverage: 'Kustomraden', category: 'Kategori 1 (kustzoner)', notes: 'Kustomraden i Stockholms lan ar nitratkansliga. Ovriga delar faller under kategori 2.', regulation_ref: 'Forordning 1998:915, 5 sek' },
  { lan: 'Sodermanland', coverage: 'Kustomraden', category: 'Kategori 1 (kustzoner)', notes: 'Kustomraden i Sodermanlands lan ar nitratkansliga.', regulation_ref: 'Forordning 1998:915, 5 sek' },
  { lan: 'Ostergotland', coverage: 'Kustomraden', category: 'Kategori 1 (kustzoner)', notes: 'Kustomraden i Ostergotlands lan ar nitratkansliga.', regulation_ref: 'Forordning 1998:915, 5 sek' },
  { lan: 'Kalmar', coverage: 'Kustomraden (utom Oland)', category: 'Kategori 1 (kustzoner)', notes: 'Kustomraden i Kalmar lan (fastlandet) ar nitratkansliga.', regulation_ref: 'Forordning 1998:915, 5 sek' },
  { lan: 'Vastra Gotaland', coverage: 'Kustomraden', category: 'Kategori 1 (kustzoner)', notes: 'Kustomraden i Vastra Gotalands lan ar nitratkansliga.', regulation_ref: 'Forordning 1998:915, 5 sek' },

  // Category 2: Remaining parts of listed counties
  { lan: 'Stockholm', coverage: 'Ovriga delar', category: 'Kategori 2 (ovriga nitratkansliga)', notes: 'Ovriga delar av Stockholms lan utanfor kustomraden. Nagot lindrigare lagringsregler (6 manader for 10-100 DE notkreatur).', regulation_ref: 'Forordning 1998:915, 5 sek' },
  { lan: 'Sodermanland', coverage: 'Ovriga delar', category: 'Kategori 2 (ovriga nitratkansliga)', notes: 'Ovriga delar av Sodermanlands lan.', regulation_ref: 'Forordning 1998:915, 5 sek' },
  { lan: 'Uppsala', coverage: 'Delar av lanet', category: 'Kategori 2 (ovriga nitratkansliga)', notes: 'Delar av Uppsala lan ar nitratkansliga (se SJVFS 2004:62 bilaga for exakta forsamlingar).', regulation_ref: 'Forordning 1998:915, 5 sek; SJVFS 2004:62' },
  { lan: 'Ostergotland', coverage: 'Ovriga delar', category: 'Kategori 2 (ovriga nitratkansliga)', notes: 'Ovriga delar av Ostergotlands lan (inlandet).', regulation_ref: 'Forordning 1998:915, 5 sek' },
  { lan: 'Jonkoping', coverage: 'Delar av lanet', category: 'Kategori 2 (ovriga nitratkansliga)', notes: 'Delar av Jonkopings lan ar nitratkansliga.', regulation_ref: 'Forordning 1998:915, 5 sek' },
  { lan: 'Kronoberg', coverage: 'Delar av lanet', category: 'Kategori 2 (ovriga nitratkansliga)', notes: 'Delar av Kronobergs lan ar nitratkansliga. Omfattning styrs av SJVFS 2004:62.', regulation_ref: 'Forordning 1998:915, 5 sek; SJVFS 2004:62' },
  { lan: 'Kalmar', coverage: 'Ovriga delar (inlandet)', category: 'Kategori 2 (ovriga nitratkansliga)', notes: 'Inlandsdelar av Kalmar lan som inte ar kustzoner.', regulation_ref: 'Forordning 1998:915, 5 sek' },
  { lan: 'Vastra Gotaland', coverage: 'Ovriga delar', category: 'Kategori 2 (ovriga nitratkansliga)', notes: 'Inlandsdelar av Vastra Gotalands lan.', regulation_ref: 'Forordning 1998:915, 5 sek' },
  { lan: 'Varmland', coverage: 'Delar av lanet (slattbygd)', category: 'Kategori 2 (ovriga nitratkansliga)', notes: 'Slattbygden i Varmlands lan. Tackningskrav galler for flytgodselbehallare.', regulation_ref: 'Forordning 1998:915, 5 sek' },
  { lan: 'Orebro', coverage: 'Delar av lanet (slattbygd)', category: 'Kategori 2 (ovriga nitratkansliga)', notes: 'Slattbygden i Orebro lan.', regulation_ref: 'Forordning 1998:915, 5 sek' },
  { lan: 'Vastmanland', coverage: 'Delar av lanet (slattbygd)', category: 'Kategori 2 (ovriga nitratkansliga)', notes: 'Slattbygden i Vastmanlands lan.', regulation_ref: 'Forordning 1998:915, 5 sek' },
  { lan: 'Dalarna', coverage: 'Delar av lanet', category: 'Kategori 2 (ovriga nitratkansliga)', notes: 'Delar av Dalarnas lan ar nitratkansliga.', regulation_ref: 'Forordning 1998:915, 5 sek' },

  // Non-NVZ counties
  { lan: 'Norrbotten', coverage: 'Ej nitratkansligt', category: 'Utanfor NVZ', notes: 'Norrbottens lan ar inte nitratkansligt omrade. Grundregler for godsling galler (MB 2 kap).', regulation_ref: 'SJVFS 2004:62' },
  { lan: 'Vasterbotten', coverage: 'Ej nitratkansligt', category: 'Utanfor NVZ', notes: 'Vasterbottens lan ar inte nitratkansligt omrade.', regulation_ref: 'SJVFS 2004:62' },
  { lan: 'Vasternorrland', coverage: 'Ej nitratkansligt', category: 'Utanfor NVZ', notes: 'Vasternorrlands lan ar inte nitratkansligt omrade.', regulation_ref: 'SJVFS 2004:62' },
  { lan: 'Jamtland', coverage: 'Ej nitratkansligt', category: 'Utanfor NVZ', notes: 'Jamtlands lan ar inte nitratkansligt omrade.', regulation_ref: 'SJVFS 2004:62' },
  { lan: 'Gavleborg', coverage: 'Ej nitratkansligt', category: 'Utanfor NVZ', notes: 'Gavleborgs lan ar inte nitratkansligt omrade.', regulation_ref: 'SJVFS 2004:62' },
];

for (const row of designatedNvz) {
  db.run(
    `INSERT INTO designated_nvz (lan, coverage, category, notes, regulation_ref) VALUES (?, ?, ?, ?, ?)`,
    [row.lan, row.coverage, row.category, row.notes, row.regulation_ref],
  );
}
console.log(`Inserted ${designatedNvz.length} designated NVZ entries`);

// ---------------------------------------------------------------------------
// ANIMAL UNIT DEFINITIONS (MPF 2013:251 definition, SJVFS 2004:62)
// ---------------------------------------------------------------------------
const animalUnitDefs = [
  { species: 'Mjolkko eller sinko (inkl kalv upp till 1 manads alder)', count_per_unit: 1, notes: 'En mjolkko inklusive kalv upp till 1 manads alder = 1 djurenhet', regulation_ref: 'MPF 2013:251; SJVFS 2004:62' },
  { species: 'Kalvar (1-6 manaders alder)', count_per_unit: 6, notes: '6 kalvar fran 1 manad till 6 manaders alder = 1 djurenhet', regulation_ref: 'MPF 2013:251' },
  { species: 'Ovriga notkreatur (6 manader eller aldre)', count_per_unit: 3, notes: '3 ovriga not (kviga, stut, tjur) 6 manader eller aldre = 1 djurenhet', regulation_ref: 'MPF 2013:251' },
  { species: 'Suggor eller betackta gyltor (inkl smagrisar till 12 veckor)', count_per_unit: 3, notes: '3 suggor eller betackta gyltor inklusive smagrisar upp till 12 veckors alder = 1 djurenhet', regulation_ref: 'MPF 2013:251' },
  { species: 'Slaktsvin, obetackta gyltor eller avelsgaltar (12 veckor+)', count_per_unit: 10, notes: '10 slaktsvin, obetackta gyltor eller avelsgaltar 12 veckor eller aldre = 1 djurenhet', regulation_ref: 'MPF 2013:251' },
  { species: 'Hast (inkl fol till 6 manaders alder)', count_per_unit: 1, notes: '1 hast inklusive fol upp till 6 manaders alder = 1 djurenhet', regulation_ref: 'MPF 2013:251' },
  { species: 'Minkhonor for avel (inkl valpar till 8 man, avelshannar)', count_per_unit: 10, notes: '10 minkhonor for avel inklusive valpar till 8 manaders alder och avelshannar = 1 djurenhet', regulation_ref: 'MPF 2013:251' },
  { species: 'Kaniner', count_per_unit: 100, notes: '100 kaniner = 1 djurenhet', regulation_ref: 'MPF 2013:251' },
  { species: 'Varphons eller kycklingmodrar (16 veckor+)', count_per_unit: 100, notes: '100 varphons eller kycklingmodrar 16 veckor eller aldre = 1 djurenhet', regulation_ref: 'MPF 2013:251' },
  { species: 'Unghons (till 16 veckors alder)', count_per_unit: 200, notes: '200 unghons upp till 16 veckors alder = 1 djurenhet', regulation_ref: 'MPF 2013:251' },
  { species: 'Slaktkycklingar', count_per_unit: 200, notes: '200 slaktkycklingar = 1 djurenhet', regulation_ref: 'MPF 2013:251' },
  { species: 'Kalkoner/gas/ankor (inkl daggamla kycklingar)', count_per_unit: 100, notes: '100 kalkoner, gas eller ankor inklusive daggamla kycklingar = 1 djurenhet', regulation_ref: 'MPF 2013:251' },
  { species: 'Struts/nandu/emu (inkl daggamla kycklingar)', count_per_unit: 15, notes: '15 strutsfaglar inklusive daggamla kycklingar = 1 djurenhet', regulation_ref: 'MPF 2013:251' },
  { species: 'Far eller getter (6 manader+)', count_per_unit: 10, notes: '10 far eller getter 6 manader eller aldre = 1 djurenhet', regulation_ref: 'SJVFS 2004:62' },
  { species: 'Lamm eller killingar (till 6 manaders alder)', count_per_unit: 40, notes: '40 lamm eller killingar till 6 manaders alder = 1 djurenhet', regulation_ref: 'SJVFS 2004:62' },
];

for (const row of animalUnitDefs) {
  db.run(
    `INSERT INTO animal_unit_definitions (species, count_per_unit, notes, regulation_ref) VALUES (?, ?, ?, ?)`,
    [row.species, row.count_per_unit, row.notes, row.regulation_ref],
  );
}
console.log(`Inserted ${animalUnitDefs.length} animal unit definitions`);

// ---------------------------------------------------------------------------
// VERKSAMHETSKODER (Activity codes from MPF 2013:251)
// ---------------------------------------------------------------------------
const verksamhetskoder = [
  { code: '1.10-i', classification: 'B (tillstand)', activity: 'Intensiv djurhallning (IED)', threshold: '>40 000 fjaderfae ELLER >2 000 slaktsvin >30 kg ELLER >750 suggor', species_scope: 'Fjaderfae, svin', process: 'Tillstand fran Lansstyrelsen. MKB kravs. IED-anlaggning (Industriutslappsforordningen 2013:250).', regulation_ref: 'MPF 2013:251, 1 kap 10 sek' },
  { code: '1.11', classification: 'B (tillstand)', activity: 'Stadigvarande djurhallning not/hast/mink', threshold: '>400 djurenheter', species_scope: 'Notkreatur, hastar, mink', process: 'Tillstand fran Lansstyrelsen. MKB kravs. Inhagnad undantas.', regulation_ref: 'MPF 2013:251, 1 kap 11 sek' },
  { code: '1.20', classification: 'C (anmalan)', activity: 'Stadigvarande djurhallning (mellanstor)', threshold: '>100 djurenheter', species_scope: 'Alla djurslag', process: 'Anmalan till kommunens miljonamnd. Inhagnad undantas.', regulation_ref: 'MPF 2013:251, 1 kap 20 sek' },
  { code: '1.30', classification: 'C (anmalan)', activity: 'Uppodling av annan mark an jordbruksmark', threshold: 'All uppodling for produktion', species_scope: null, process: 'Anmalan till kommunen. Uppodling av mark som inte redan ar jordbruksmark.', regulation_ref: 'MPF 2013:251, 1 kap 30 sek' },
  { code: '5.10', classification: 'B (tillstand)', activity: 'Fiskodling (stor)', threshold: '>40 ton foder/kalenderar', species_scope: 'Fisk', process: 'Tillstand fran Lansstyrelsen. MKB kravs.', regulation_ref: 'MPF 2013:251, 5 kap 10 sek' },
  { code: '5.20', classification: 'C (anmalan)', activity: 'Fiskodling (mellanstor)', threshold: '>1,5 ton foder/kalenderar', species_scope: 'Fisk', process: 'Anmalan till kommunen.', regulation_ref: 'MPF 2013:251, 5 kap 20 sek' },
  { code: '5.30', classification: 'C (anmalan)', activity: 'Vattenbruk (yrkesmassig)', threshold: 'Yrkesmassig verksamhet', species_scope: 'Alla vattenbruksarter', process: 'Anmalan till kommunen.', regulation_ref: 'MPF 2013:251, 5 kap 30 sek' },
  { code: '10.10', classification: 'B (tillstand)', activity: 'Torvtakt (stor)', threshold: '>150 ha driftomrade', species_scope: null, process: 'Tillstand fran Lansstyrelsen. MKB kravs. Klimatpaverkan ska bedomas.', regulation_ref: 'MPF 2013:251, 10 kap 10 sek' },
  { code: '10.40', classification: 'C (anmalan)', activity: 'Torvtakt (liten)', threshold: '<150 ha driftomrade', species_scope: null, process: 'Anmalan till kommunen. Behovsbedoming av MKB.', regulation_ref: 'MPF 2013:251, 10 kap 40 sek' },
  { code: '10.50', classification: 'C (anmalan)', activity: 'Mineralutvinning (takt, liten)', threshold: 'Under troskelvarden for B-verksamhet', species_scope: null, process: 'Anmalan till kommunen.', regulation_ref: 'MPF 2013:251, 10 kap 50 sek' },
];

for (const row of verksamhetskoder) {
  db.run(
    `INSERT INTO verksamhetskoder (code, classification, activity, threshold, species_scope, process, regulation_ref) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [row.code, row.classification, row.activity, row.threshold, row.species_scope, row.process, row.regulation_ref],
  );
}
console.log(`Inserted ${verksamhetskoder.length} verksamhetskoder`);

// ---------------------------------------------------------------------------
// CISTERN RULES (NFS 2021:10)
// ---------------------------------------------------------------------------
const cisternRules = [
  { tank_type: 'Cistern i mark (>1 m3)', volume_threshold: '>1 m3', location_context: 'Utanfor vattenskyddsomrade', inspection_type: 'Installationskontroll + revisionskontroll', inspection_frequency: 'Installationskontroll fore ibruktagande; revisionskontroll vart 6:e ar', secondary_containment: 'Invallning med 110% kapacitet av storsta cisternens volym, eller dubbelvaggig tank', notification_required: 1, conditions: 'Anmalan till kommunen kravs for cisterner >1 m3 som installeras i mark. Kontroll av ackrediterad kontrollant.', regulation_ref: 'NFS 2021:10, 3-4 kap' },
  { tank_type: 'Cistern ovan mark (>1 m3, vattenskyddsomrade)', volume_threshold: '>1 m3', location_context: 'Vattenskyddsomrade', inspection_type: 'Installationskontroll + revisionskontroll', inspection_frequency: 'Installationskontroll fore ibruktagande; revisionskontroll vart 3:e ar', secondary_containment: 'Obligatoriskt sekundart skydd: invallning med hela cisternens volym plus 10% av ovriga cisterner, eller dubbelvaggig tank. Invallning ska vara tat, hallbar och inspekterbar.', notification_required: 1, conditions: 'Anmalan till kommunen kravs. Kontroll av ackrediterad kontrollant. Striktaste krav galler.', regulation_ref: 'NFS 2021:10, 4 kap' },
  { tank_type: 'Cistern ovan mark (>1 m3, utanfor vattenskyddsomrade)', volume_threshold: '>1 m3', location_context: 'Utanfor vattenskyddsomrade', inspection_type: 'Installationskontroll', inspection_frequency: 'Installationskontroll fore ibruktagande; darefter egenkontroll', secondary_containment: 'Sekundart skydd rekommenderas. Invallning med 110% kapacitet rekommenderas.', notification_required: 0, conditions: 'Ingen anmalan kravs for ovan mark utanfor vattenskyddsomrade om inte lokal foreskrift sager annorlunda.', regulation_ref: 'NFS 2021:10, 3 kap' },
  { tank_type: 'Cistern (150 L - 1 m3)', volume_threshold: '150 L - 1 m3', location_context: 'Alla', inspection_type: 'Egenkontroll', inspection_frequency: 'Regelbunden egenkontroll', secondary_containment: 'Rekommenderas men ej krav utanfor vattenskyddsomrade. I vattenskyddsomrade: sekundart skydd kravs.', notification_required: 0, conditions: 'NFS 2021:10 sanktes fran 250 L till 150 L. Galler for brandfarliga vatskor och spilloljor.', regulation_ref: 'NFS 2021:10' },
  { tank_type: 'Cistern (<150 L)', volume_threshold: '<150 L', location_context: 'Alla', inspection_type: 'Ej reglerad', inspection_frequency: 'Ej reglerad', secondary_containment: 'Ej krav', notification_required: 0, conditions: 'Omfattas inte av NFS 2021:10. Miljobalken 2 kap forsiktighetsprincip galler fortfarande.', regulation_ref: 'NFS 2021:10 (undantas)' },
  { tank_type: 'Aterkommande kontroll (sekundart skydd, vattenskyddsomrade)', volume_threshold: '>1 m3', location_context: 'Vattenskyddsomrade', inspection_type: 'Aterkommande kontroll av sekundart skydd', inspection_frequency: 'Vart 6:e ar (vart 3:e ar for cisterner i mark)', secondary_containment: 'Kontroll att sekundart skydd ar funktionellt: tathet, hallbarhet, inspektion', notification_required: 0, conditions: 'Aterkommande kontroll av sekundart skydd kravs i vattenskyddsomrade. Kontroll av ackrediterat kontrollorgan.', regulation_ref: 'NFS 2021:10, 4 kap' },
];

for (const row of cisternRules) {
  db.run(
    `INSERT INTO cistern_rules (tank_type, volume_threshold, location_context, inspection_type, inspection_frequency, secondary_containment, notification_required, conditions, regulation_ref) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [row.tank_type, row.volume_threshold, row.location_context, row.inspection_type, row.inspection_frequency, row.secondary_containment, row.notification_required, row.conditions, row.regulation_ref],
  );
}
console.log(`Inserted ${cisternRules.length} cistern rules`);

// ---------------------------------------------------------------------------
// PESTICIDE BUFFER ZONES (KIFS 2022:3, NFS 2015:2)
// ---------------------------------------------------------------------------
const pesticideBufferZones = [
  { watercourse_type: 'Oeppna diken', fixed_distance_m: 2.0, adapted_distance_m: null, product_class: 'Alla vaxtskyddsmedel', conditions: 'Fast skyddsavstand: minst 2 meter fran faltkant till kanten av oeppet dike. Galler oavsett produkttyp.', regulation_ref: 'KIFS 2022:3; NFS 2015:2' },
  { watercourse_type: 'Draneringsbrunnar och dagvattenbrunnar', fixed_distance_m: 2.0, adapted_distance_m: null, product_class: 'Alla vaxtskyddsmedel', conditions: 'Fast skyddsavstand: minst 2 meter till draneringsbrunnar och dagvattenbrunnar.', regulation_ref: 'KIFS 2022:3; NFS 2015:2' },
  { watercourse_type: 'Sjor och vattendrag', fixed_distance_m: 6.0, adapted_distance_m: null, product_class: 'Alla vaxtskyddsmedel', conditions: 'Fast skyddsavstand: minst 6 meter fran hogvattenlinjen eller strandbrinken till det omrade som behandlas.', regulation_ref: 'KIFS 2022:3; NFS 2015:2' },
  { watercourse_type: 'Dricksvattenbrunnar', fixed_distance_m: 12.0, adapted_distance_m: null, product_class: 'Alla vaxtskyddsmedel', conditions: 'Fast skyddsavstand: minst 12 meter till dricksvattenbrunnar (bade enskilda och kommunala).', regulation_ref: 'KIFS 2022:3; NFS 2015:2' },
  { watercourse_type: 'Alla vattenforekomster', fixed_distance_m: 2.0, adapted_distance_m: 2.0, product_class: 'Alla (anpassat minimum)', conditions: 'Minsta anpassade skyddsavstand ar 2 meter. Anpassas vid varje tillfalle med Kemikalieinspektionens Hjalpreda baserat pa vindstyrka, riktning, temperatur, avsattningsteknologi.', regulation_ref: 'KIFS 2022:3' },
  { watercourse_type: 'Produktspecifikt (etikett)', fixed_distance_m: null, adapted_distance_m: null, product_class: 'Produktspecifikt', conditions: 'Manga produkter kraver storre avstand an minimikraven (6-20 m). Produktetiketten ar bindande. Kontrollera aktuell etiketttext vid Kemikalieinspektionens register.', regulation_ref: 'KIFS 2022:3; produktetikett' },
  { watercourse_type: 'Vattenskyddsomrade', fixed_distance_m: null, adapted_distance_m: null, product_class: 'Alla vaxtskyddsmedel', conditions: 'Tillstand fran kommunen kravs for yrkesmassig anvandning i vattenskyddsomrade (SFS 2014:425, 2 kap 37-40 sek). Lansstyrelsen kan forbjuda helt. Anvand produkter med lag lakagerisk.', regulation_ref: 'SFS 2014:425; NFS 2015:2' },
];

for (const row of pesticideBufferZones) {
  db.run(
    `INSERT INTO pesticide_buffer_zones (watercourse_type, fixed_distance_m, adapted_distance_m, product_class, conditions, regulation_ref) VALUES (?, ?, ?, ?, ?, ?)`,
    [row.watercourse_type, row.fixed_distance_m, row.adapted_distance_m, row.product_class, row.conditions, row.regulation_ref],
  );
}
console.log(`Inserted ${pesticideBufferZones.length} pesticide buffer zone rules`);

// ---------------------------------------------------------------------------
// VATTENVERKSAMHET (detailed water operations rules — Forordning 1998:1388)
// ---------------------------------------------------------------------------
const vattenverksamhetRules = [
  { activity_type: 'Bortledande av ytvatten fran vattendrag (anmalan)', threshold: 'Hogst 600 m3/dag, hogst 100 000 m3/ar', permit_type: 'Anmalan', authority: 'Lansstyrelsen', exemptions: 'Hushallsbehov for en-/tvafamiljsfastighet undantas (MB 11 kap 11 sek)', conditions: 'Anmalan 8 veckor fore verksamheten paborjas (Forordning 1998:1388, 19 sek punkt 6).', regulation_ref: 'Forordning 1998:1388, 19 sek' },
  { activity_type: 'Bortledande av ytvatten fran sjo/annat vattenomrade (anmalan)', threshold: 'Hogst 1 000 m3/dag, hogst 200 000 m3/ar', permit_type: 'Anmalan', authority: 'Lansstyrelsen', exemptions: 'Hushallsbehov for en-/tvafamiljsfastighet undantas (MB 11 kap 11 sek)', conditions: 'Anmalan 8 veckor fore verksamheten paborjas (Forordning 1998:1388, 19 sek punkt 7).', regulation_ref: 'Forordning 1998:1388, 19 sek' },
  { activity_type: 'Bortledande av ytvatten (over troskel, tillstand)', threshold: 'Over 600 m3/dag vattendrag, over 1000 m3/dag sjo, eller over arsvolym', permit_type: 'Tillstand', authority: 'Mark- och miljodomstolen', exemptions: null, conditions: 'Kraver tillstand. Hydrogeologisk utredning och MKB.', regulation_ref: 'Miljobalken 11 kap 9 sek; Forordning 1998:1388' },
  { activity_type: 'Anlaggande av vatmark (anmalan)', threshold: 'Vattenyta hogst 5 ha', permit_type: 'Anmalan', authority: 'Lansstyrelsen', exemptions: null, conditions: 'Vatmark med yta hogst 5 ha kan anmalas istallet for tillstand (Forordning 1998:1388, 19 sek punkt 1). Strandskyddsdispens kan behovas.', regulation_ref: 'Forordning 1998:1388, 19 sek' },
  { activity_type: 'Anlaggning i vattendrag (anmalan)', threshold: 'Bottenyta hogst 500 m2', permit_type: 'Anmalan', authority: 'Lansstyrelsen', exemptions: null, conditions: 'Uppforande, andrande, rivning av anlaggning i vattendrag med bottenyta hogst 500 m2 (Forordning 1998:1388, 19 sek punkt 2).', regulation_ref: 'Forordning 1998:1388, 19 sek' },
  { activity_type: 'Anlaggning i annat vattenomrade (anmalan)', threshold: 'Bottenyta hogst 3 000 m2', permit_type: 'Anmalan', authority: 'Lansstyrelsen', exemptions: null, conditions: 'Anlaggning i sjo eller annat vattenomrade (ej vattendrag) med bottenyta hogst 3 000 m2 (Forordning 1998:1388, 19 sek punkt 3).', regulation_ref: 'Forordning 1998:1388, 19 sek' },
  { activity_type: 'Gravning/muddring/rensning i vattendrag (anmalan)', threshold: 'Medelvattenfoering hogst 1 m3/s', permit_type: 'Anmalan', authority: 'Lansstyrelsen', exemptions: 'Normalt underhall av befintliga diken undantas', conditions: 'Gravning, muddring och rensning i vattendrag med medelvattenfoering hogst 1 m3/s (Forordning 1998:1388, 19 sek punkt 4-5).', regulation_ref: 'Forordning 1998:1388, 19 sek' },
  { activity_type: 'Markavvattning (nydikning)', threshold: 'Alla storlekar', permit_type: 'Tillstand', authority: 'Mark- och miljodomstolen (eller Lansstyrelsen som forsta instans)', exemptions: 'Underhallsdikning undantas. Forbjuden i 10 sydliga lan utan dispens.', conditions: 'Markavvattning ar forbjuden i Skane, Blekinge, Halland, Gotland, Stockholm, Uppsala, Sodermanland, Ostergotland, Kronoberg och Kalmar lan (Forordning 1998:1388, 4-4c sek).', regulation_ref: 'Forordning 1998:1388, 4 sek' },
  { activity_type: 'Grundvattenuttag (storre)', threshold: 'Beror pa paverkan', permit_type: 'Tillstand', authority: 'Mark- och miljodomstolen', exemptions: 'Enskild vattenforsorjning for hushall undantas (MB 11 kap 11 sek)', conditions: 'Kraver hydrogeologisk utredning. Sarskilt restriktivt i vattenskyddsomrade.', regulation_ref: 'Miljobalken 11 kap 9 sek' },
  { activity_type: 'Damm (uppforande eller andrande)', threshold: 'Alla storlekar', permit_type: 'Tillstand', authority: 'Mark- och miljodomstolen', exemptions: null, conditions: 'Dammsakerhetsklass bestams av Lansstyrelsen. Underhallsskyldighet. Tillstand kravs fore byggstart.', regulation_ref: 'Miljobalken 11 kap; Lag 2014:114 om dammsaker' },
];

for (const row of vattenverksamhetRules) {
  db.run(
    `INSERT INTO vattenverksamhet (activity_type, threshold, permit_type, authority, exemptions, conditions, regulation_ref) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [row.activity_type, row.threshold, row.permit_type, row.authority, row.exemptions, row.conditions, row.regulation_ref],
  );
}
console.log(`Inserted ${vattenverksamhetRules.length} vattenverksamhet rules`);

// ---------------------------------------------------------------------------
// AUTUMN COVER REQUIREMENTS (Grundvillkor SMR 2, SJVFS 2004:62)
// ---------------------------------------------------------------------------
const autumnCoverRequirements = [
  { region: 'Skane', min_cover_pct: 60, crop_types: 'Hostsadda grodor, fanggroda, vallinsadd, stubb. Varspridda grodor raknas inte.', area_threshold_ha: 5.0, conditions: 'Galler jordbruksforetag med >5 ha akermark i Skane lan. Minst 60% av akermarken ska vara tackbevuxen under host och vinter.', regulation_ref: 'SJVFS 2004:62; Grundvillkor SMR 2' },
  { region: 'Blekinge', min_cover_pct: 60, crop_types: 'Hostsadda grodor, fanggroda, vallinsadd, stubb.', area_threshold_ha: 5.0, conditions: 'Galler jordbruksforetag med >5 ha akermark i Blekinge lan. Minst 60% hosttackning.', regulation_ref: 'SJVFS 2004:62; Grundvillkor SMR 2' },
  { region: 'Halland', min_cover_pct: 60, crop_types: 'Hostsadda grodor, fanggroda, vallinsadd, stubb.', area_threshold_ha: 5.0, conditions: 'Galler jordbruksforetag med >5 ha akermark i Halland lan. Minst 60% hosttackning.', regulation_ref: 'SJVFS 2004:62; Grundvillkor SMR 2' },
  { region: 'Ovriga Gotaland (Ostergotland, Jonkoping, Kronoberg, Kalmar, Gotland, Vastra Gotaland)', min_cover_pct: 50, crop_types: 'Hostsadda grodor, fanggroda, vallinsadd, stubb.', area_threshold_ha: 5.0, conditions: 'Galler jordbruksforetag med >5 ha akermark i ovriga Gotaland. Minst 50% av akermarken ska vara tackbevuxen under host och vinter.', regulation_ref: 'SJVFS 2004:62; Grundvillkor SMR 2' },
  { region: 'Svealand och Norrland', min_cover_pct: null, crop_types: null, area_threshold_ha: null, conditions: 'Inget kvantitativt hosttackningskrav i Svealand och Norrland. Jordbruksverket rekommenderar fanggroda eller vallinsadd for att minska kvaveutlakning.', regulation_ref: 'Jordbruksverket radgivning' },
];

for (const row of autumnCoverRequirements) {
  db.run(
    `INSERT INTO autumn_cover_requirements (region, min_cover_pct, crop_types, area_threshold_ha, conditions, regulation_ref) VALUES (?, ?, ?, ?, ?, ?)`,
    [row.region, row.min_cover_pct, row.crop_types, row.area_threshold_ha, row.conditions, row.regulation_ref],
  );
}
console.log(`Inserted ${autumnCoverRequirements.length} autumn cover requirements`);

// ---------------------------------------------------------------------------
// FTS5 SEARCH INDEX
// ---------------------------------------------------------------------------
console.log('Building FTS5 search index...');

// Index nitratkansliga omraden
for (const row of nitratkansligaOmraden) {
  db.run(
    `INSERT INTO search_index (title, body, topic, jurisdiction) VALUES (?, ?, ?, ?)`,
    [
      row.activity,
      [row.material_type, row.soil_type, row.conditions, row.max_application_rate, row.regulation_ref].filter(Boolean).join('. '),
      'nitratkansliga_omraden',
      'SE',
    ],
  );
}

// Index storage requirements
for (const row of storageRequirements) {
  db.run(
    `INSERT INTO search_index (title, body, topic, jurisdiction) VALUES (?, ?, ?, ?)`,
    [
      `Lagringskrav: ${row.material}`,
      [row.construction_standard, row.inspection_frequency, row.regulation_ref].filter(Boolean).join('. '),
      'storage',
      'SE',
    ],
  );
}

// Index buffer strip rules
for (const row of bufferStripRules) {
  db.run(
    `INSERT INTO search_index (title, body, topic, jurisdiction) VALUES (?, ?, ?, ?)`,
    [
      `Skyddszon: ${row.watercourse_type} - ${row.activity}`,
      [row.conditions, row.scheme_payment, row.regulation_ref].filter(Boolean).join('. '),
      'buffer_strips',
      'SE',
    ],
  );
}

// Index abstraction rules
for (const row of abstractionRules) {
  db.run(
    `INSERT INTO search_index (title, body, topic, jurisdiction) VALUES (?, ?, ?, ?)`,
    [
      `Vattenuttag: ${row.source_type}`,
      [row.exemptions, row.conditions].filter(Boolean).join('. '),
      'abstraction',
      'SE',
    ],
  );
}

// Index pollution prevention
for (const row of pollutionPrevention) {
  db.run(
    `INSERT INTO search_index (title, body, topic, jurisdiction) VALUES (?, ?, ?, ?)`,
    [
      `Forebyggande: ${row.activity}`,
      [row.hazards, row.control_measures, row.regulatory_requirements, row.regulation_ref].filter(Boolean).join('. '),
      'pollution',
      'SE',
    ],
  );
}

// Index EIA screening
for (const row of eiaScreening) {
  db.run(
    `INSERT INTO search_index (title, body, topic, jurisdiction) VALUES (?, ?, ?, ?)`,
    [
      `MKB: ${row.project_type}`,
      [row.threshold_other, row.process].filter(Boolean).join('. '),
      'eia',
      'SE',
    ],
  );
}

// Index designated NVZ
for (const row of designatedNvz) {
  db.run(
    `INSERT INTO search_index (title, body, topic, jurisdiction) VALUES (?, ?, ?, ?)`,
    [
      `Nitratkansligt omrade: ${row.lan}`,
      [row.coverage, row.category, row.notes, row.regulation_ref].filter(Boolean).join('. '),
      'designated_nvz',
      'SE',
    ],
  );
}

// Index animal unit definitions
for (const row of animalUnitDefs) {
  db.run(
    `INSERT INTO search_index (title, body, topic, jurisdiction) VALUES (?, ?, ?, ?)`,
    [
      `Djurenhet: ${row.species}`,
      [row.notes, row.regulation_ref].filter(Boolean).join('. '),
      'animal_units',
      'SE',
    ],
  );
}

// Index verksamhetskoder
for (const row of verksamhetskoder) {
  db.run(
    `INSERT INTO search_index (title, body, topic, jurisdiction) VALUES (?, ?, ?, ?)`,
    [
      `Verksamhetskod ${row.code}: ${row.activity}`,
      [row.classification, row.threshold, row.species_scope, row.process, row.regulation_ref].filter(Boolean).join('. '),
      'verksamhetskoder',
      'SE',
    ],
  );
}

// Index cistern rules
for (const row of cisternRules) {
  db.run(
    `INSERT INTO search_index (title, body, topic, jurisdiction) VALUES (?, ?, ?, ?)`,
    [
      `Cisternkrav: ${row.tank_type}`,
      [row.volume_threshold, row.inspection_type, row.inspection_frequency, row.secondary_containment, row.conditions, row.regulation_ref].filter(Boolean).join('. '),
      'cistern',
      'SE',
    ],
  );
}

// Index pesticide buffer zones
for (const row of pesticideBufferZones) {
  db.run(
    `INSERT INTO search_index (title, body, topic, jurisdiction) VALUES (?, ?, ?, ?)`,
    [
      `Bekampningsmedel skyddsavstand: ${row.watercourse_type}`,
      [row.product_class, row.conditions, row.regulation_ref].filter(Boolean).join('. '),
      'pesticide_buffer',
      'SE',
    ],
  );
}

// Index vattenverksamhet
for (const row of vattenverksamhetRules) {
  db.run(
    `INSERT INTO search_index (title, body, topic, jurisdiction) VALUES (?, ?, ?, ?)`,
    [
      `Vattenverksamhet: ${row.activity_type}`,
      [row.threshold, row.permit_type, row.authority, row.exemptions, row.conditions, row.regulation_ref].filter(Boolean).join('. '),
      'vattenverksamhet',
      'SE',
    ],
  );
}

// Index autumn cover requirements
for (const row of autumnCoverRequirements) {
  db.run(
    `INSERT INTO search_index (title, body, topic, jurisdiction) VALUES (?, ?, ?, ?)`,
    [
      `Hosttackning: ${row.region}`,
      [row.crop_types, row.conditions, row.regulation_ref].filter(Boolean).join('. '),
      'autumn_cover',
      'SE',
    ],
  );
}

const totalIndexed = nitratkansligaOmraden.length + storageRequirements.length +
  bufferStripRules.length + abstractionRules.length +
  pollutionPrevention.length + eiaScreening.length +
  designatedNvz.length + animalUnitDefs.length +
  verksamhetskoder.length + cisternRules.length +
  pesticideBufferZones.length + vattenverksamhetRules.length +
  autumnCoverRequirements.length;
console.log(`Indexed ${totalIndexed} entries in FTS5 search index`);

// ---------------------------------------------------------------------------
// METADATA
// ---------------------------------------------------------------------------
db.run("INSERT OR REPLACE INTO db_metadata (key, value) VALUES ('last_ingest', ?)", [now]);
db.run("INSERT OR REPLACE INTO db_metadata (key, value) VALUES ('build_date', ?)", [now]);
db.run("INSERT OR REPLACE INTO db_metadata (key, value) VALUES ('schema_version', '2.0')", []);
db.run("INSERT OR REPLACE INTO db_metadata (key, value) VALUES ('mcp_name', 'Sweden Environmental Compliance MCP')", []);
db.run("INSERT OR REPLACE INTO db_metadata (key, value) VALUES ('jurisdiction', 'SE')", []);
db.run("INSERT OR REPLACE INTO db_metadata (key, value) VALUES ('record_count', ?)", [String(totalIndexed)]);

writeFileSync('data/coverage.json', JSON.stringify({
  mcp_name: 'Sweden Environmental Compliance MCP',
  jurisdiction: 'SE',
  build_date: now,
  tables: {
    nitratkansliga_omraden: nitratkansligaOmraden.length,
    storage_requirements: storageRequirements.length,
    buffer_strip_rules: bufferStripRules.length,
    abstraction_rules: abstractionRules.length,
    pollution_prevention: pollutionPrevention.length,
    eia_screening: eiaScreening.length,
    designated_nvz: designatedNvz.length,
    animal_unit_definitions: animalUnitDefs.length,
    verksamhetskoder: verksamhetskoder.length,
    cistern_rules: cisternRules.length,
    pesticide_buffer_zones: pesticideBufferZones.length,
    vattenverksamhet: vattenverksamhetRules.length,
    autumn_cover_requirements: autumnCoverRequirements.length,
  },
  total_records: totalIndexed,
  fts_indexed: totalIndexed,
  sources: [
    'Jordbruksverket (SJVFS 2004:62, SJVFS 2011:25, SJVFS 2020:2, SJVFS 2026:2)',
    'Naturvardsverket (NFS 2015:2, NFS 2021:10)',
    'Havs- och vattenmyndigheten (HaV, HVMFS 2015:34)',
    'Kemikalieinspektionen (KIFS 2022:3)',
    'Miljobalken (1998:808)',
    'Forordning (1998:899) om miljofarlig verksamhet och halsoskydd',
    'Forordning (1998:915) om miljohansyn i jordbruket',
    'Miljoprovningsforordningen (2013:251)',
    'Forordning (1998:1388) om vattenverksamheter',
    'Skogsstyrelsen (Skogsvardslag 1979:429)',
    'MSB (MSBFS 2018:3)',
    'SFS 2014:425 (vaxtskyddsmedelsforordningen)',
    'EU Nitratdirektivet (91/676/EEG)',
    'EU Ramdirektivet for vatten (2000/60/EG)',
    'EU ABP-forordningen (EG 1069/2009)',
    'EU NEC-direktivet (2016/2284)',
    'Sevesodirektivet (2012/18/EU)',
  ],
}, null, 2));

db.close();
console.log(`\nIngestion complete: ${totalIndexed} records across 13 tables`);
console.log('Database: data/database.db');
console.log('Coverage: data/coverage.json');
console.log(`\nBreakdown:`);
console.log(`  nitratkansliga_omraden:   ${nitratkansligaOmraden.length}`);
console.log(`  storage_requirements:     ${storageRequirements.length}`);
console.log(`  buffer_strip_rules:       ${bufferStripRules.length}`);
console.log(`  abstraction_rules:        ${abstractionRules.length}`);
console.log(`  pollution_prevention:     ${pollutionPrevention.length}`);
console.log(`  eia_screening:            ${eiaScreening.length}`);
console.log(`  designated_nvz:           ${designatedNvz.length}`);
console.log(`  animal_unit_definitions:  ${animalUnitDefs.length}`);
console.log(`  verksamhetskoder:         ${verksamhetskoder.length}`);
console.log(`  cistern_rules:            ${cisternRules.length}`);
console.log(`  pesticide_buffer_zones:   ${pesticideBufferZones.length}`);
console.log(`  vattenverksamhet:         ${vattenverksamhetRules.length}`);
console.log(`  autumn_cover_requirements:${autumnCoverRequirements.length}`);
