/**
 * Sweden Environmental Compliance MCP — Data Ingestion Script
 *
 * Sources:
 *   - Jordbruksverket (SJVFS 2004:62, SJVFS 2011:25)
 *   - Naturvardsverket (NFS)
 *   - Havs- och vattenmyndigheten (HaV)
 *   - Miljobalken (1998:808)
 *   - Skogsstyrelsen
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
// ---------------------------------------------------------------------------
const nitratkansligaOmraden = [
  // Stallgodsel (solid manure)
  { activity: 'Spridning av stallgodsel (fastgodsel)', material_type: 'Fastgodsel (stallgodsel)', soil_type: null, closed_period_start: 'Nov 1', closed_period_end: 'Feb 28', max_application_rate: '170 kg N/ha/ar', conditions: 'Nedbrukning inom 4 timmar pa obevuxen mark. Spridning pa frusen, vattenmatad eller snotackt mark forbjuden.', regulation_ref: 'SJVFS 2004:62, 5 kap' },
  { activity: 'Spridning av stallgodsel (flytgodsel)', material_type: 'Flytgodsel', soil_type: null, closed_period_start: 'Nov 1', closed_period_end: 'Feb 28', max_application_rate: '170 kg N/ha/ar', conditions: 'Nedbrukning inom 4 timmar pa obevuxen mark. Myllning eller bandspridning rekommenderas.', regulation_ref: 'SJVFS 2004:62, 5 kap' },
  { activity: 'Spridning av stallgodsel (flytgodsel) pa lerjord', material_type: 'Flytgodsel', soil_type: 'Lera', closed_period_start: 'Nov 1', closed_period_end: 'Feb 28', max_application_rate: '22 kg P/ha/5 ar; 170 kg N/ha/ar', conditions: 'Striktare fosforbegransning pa lerjord. Nedbrukning inom 4 timmar.', regulation_ref: 'SJVFS 2004:62, 5 kap' },
  { activity: 'Spridning av stallgodsel pa sandjord', material_type: 'Stallgodsel', soil_type: 'Sand', closed_period_start: 'Nov 1', closed_period_end: 'Feb 28', max_application_rate: '170 kg N/ha/ar', conditions: 'Hogre lakeagerisk. Hostspridning avrads, varspridning rekommenderas.', regulation_ref: 'SJVFS 2004:62, 5 kap' },
  { activity: 'Hostspridning av stallgodsel', material_type: 'Stallgodsel', soil_type: null, closed_period_start: 'Nov 1', closed_period_end: 'Feb 28', max_application_rate: '60 kg NH4-N/ha efter skoord', conditions: 'Hostspridning tillaten efter skoord till 1 november med max 60 kg ammoniumkvave per hektar, bara pa bevuxen mark eller infor hostsadd.', regulation_ref: 'SJVFS 2004:62, 5 kap' },

  // Handelsgodsel (mineral fertiliser)
  { activity: 'Spridning av handelsgodsel (kvavegodsel)', material_type: 'Handelsgodsel', soil_type: null, closed_period_start: null, closed_period_end: null, max_application_rate: 'Gropplanering kravs', conditions: 'Ingen formell stangd period men spridning pa frusen, vattenmatad eller snotackt mark forbjuden. Gropplanering kravs.', regulation_ref: 'SJVFS 2004:62, 4 kap' },
  { activity: 'Spridning av handelsgodsel pa hosten', material_type: 'Handelsgodsel', soil_type: null, closed_period_start: null, closed_period_end: null, max_application_rate: '60 kg N/ha', conditions: 'Kvavegodsling pa hosten begransad till hogst 60 kg N/ha och bara till groda med kvavebehov pa hosten.', regulation_ref: 'SJVFS 2004:62, 4 kap' },

  // Urea
  { activity: 'Spridning av urea', material_type: 'Urea', soil_type: null, closed_period_start: null, closed_period_end: null, max_application_rate: 'Enligt gropplanering', conditions: 'Urea maste brukas ned inom 4 timmar efter spridning eller anvandas med ureasinhibitor. Annars stora ammoniakforluster.', regulation_ref: 'SJVFS 2004:62, 4 kap; EU 2019/1009' },

  // Radsslag (biogas residues)
  { activity: 'Spridning av rotrester (biogodsel)', material_type: 'Rotrester', soil_type: null, closed_period_start: 'Nov 1', closed_period_end: 'Feb 28', max_application_rate: '170 kg N/ha/ar', conditions: 'Samma regler som flytgodsel. Certifierad rotrester fran biogasanlaeggning. Nedbrukning inom 4 timmar.', regulation_ref: 'SJVFS 2004:62, 5 kap' },

  // Fosforbegransning (phosphorus limitation)
  { activity: 'Fosforgodsling i nitratkansliga omraden', material_type: 'Alla godselmedel', soil_type: null, closed_period_start: null, closed_period_end: null, max_application_rate: '22 kg P/ha/5 ar', conditions: 'Maximalt 22 kg fosfor per hektar i genomsnitt over 5 ar i nitratkansliga omraden.', regulation_ref: 'SJVFS 2004:62, 6 kap' },

  // Betesmark (grazing land)
  { activity: 'Godsling av betesmark', material_type: 'Stallgodsel', soil_type: 'Betesmark', closed_period_start: 'Nov 1', closed_period_end: 'Feb 28', max_application_rate: '170 kg N/ha/ar', conditions: 'Betesdjurens avgang raknas in i kvavegivan. Anpassad godsling.', regulation_ref: 'SJVFS 2004:62, 5 kap' },

  // Vallar (grassland)
  { activity: 'Godsling av vall (flytgodsel)', material_type: 'Flytgodsel', soil_type: 'Vall', closed_period_start: 'Nov 1', closed_period_end: 'Feb 28', max_application_rate: '170 kg N/ha/ar', conditions: 'Bandspridning rekommenderas for att minska ammoniakforluster. Tidig varspridning ger bast utnyttjande.', regulation_ref: 'SJVFS 2004:62, 5 kap' },

  // Slamspridning (sewage sludge)
  { activity: 'Spridning av avloppsslam', material_type: 'Avloppsslam', soil_type: null, closed_period_start: 'Nov 1', closed_period_end: 'Feb 28', max_application_rate: 'Max 7 ton TS/ha/5 ar', conditions: 'Krav pa REVAQ-certifiering eller likvardigt. Nedbrukning inom 4 timmar. Karenstid 10 manader for livsmedelsgroeda.', regulation_ref: 'SNFS 1994:2; SJVFS 2004:62' },

  // Hostvete (winter wheat specific)
  { activity: 'Kvavegodsling till hostvete', material_type: 'Handelsgodsel', soil_type: null, closed_period_start: null, closed_period_end: null, max_application_rate: '200 kg N/ha (delad giva)', conditions: 'Normgiva ca 160-200 kg N/ha beroende pa skordernivamal. Delad giva rekommenderas: 40-60% pa varen, resten vid straskorning.', regulation_ref: 'SJVFS 2004:62, 4 kap; Jordbruksverket radgivning' },

  // Hogsta givor utanfor nitratkansliga omraden (general Sweden)
  { activity: 'Spridning av stallgodsel utanfor nitratkansliga omraden', material_type: 'Stallgodsel', soil_type: null, closed_period_start: 'Dec 1', closed_period_end: 'Feb 28', max_application_rate: '170 kg N/ha/ar (rekommendation)', conditions: 'Utanfor nitratkansliga omraden galler kortare stangd period (1 dec-28 feb). Rekommendation fran Jordbruksverket att folja samma begransning.', regulation_ref: 'SJVFS 2004:62; Jordbruksverket allmanna rad' },
];

for (const row of nitratkansligaOmraden) {
  db.run(
    `INSERT INTO nitratkansliga_omraden (activity, material_type, soil_type, closed_period_start, closed_period_end, max_application_rate, conditions, regulation_ref)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [row.activity, row.material_type, row.soil_type, row.closed_period_start, row.closed_period_end, row.max_application_rate, row.conditions, row.regulation_ref]
  );
}
console.log(`Inserted ${nitratkansligaOmraden.length} nitratkansliga omraden rules`);

// ---------------------------------------------------------------------------
// STORAGE REQUIREMENTS (SJVFS 2004:62, Naturvardsverket)
// ---------------------------------------------------------------------------
const storageRequirements = [
  { material: 'Flytgodsel', min_capacity_months: 8, construction_standard: 'Betong- eller stalkladd behaellare, taetkontrollerad. 10 manaders kapacitet kravs i nitratkansliga omraden.', separation_distance_m: 50, inspection_frequency: 'Arlig visuell kontroll; taetkontroll vart 6:e ar', regulation_ref: 'SJVFS 2004:62, 3 kap' },
  { material: 'Flytgodsel (nitratkansliga omraden)', min_capacity_months: 10, construction_standard: 'Betong- eller stalkladd behaellare med tak eller flytande taeckning. Taethetskontroll obligatorisk.', separation_distance_m: 50, inspection_frequency: 'Arlig visuell kontroll; taetkontroll vart 6:e ar', regulation_ref: 'SJVFS 2004:62, 3 kap' },
  { material: 'Fastgodsel (stallgodsel)', min_capacity_months: 8, construction_standard: 'Godselplatta med ogenomslapplig botten och uppsamling av lakvatten. Taeckning rekommenderas.', separation_distance_m: 30, inspection_frequency: 'Arlig kontroll av botten och avrinning', regulation_ref: 'SJVFS 2004:62, 3 kap' },
  { material: 'Fastgodsel (djupstro)', min_capacity_months: 8, construction_standard: 'Ogenomslapplig platta eller containerlosning. Lakvatten maste samlas upp.', separation_distance_m: 30, inspection_frequency: 'Arlig kontroll', regulation_ref: 'SJVFS 2004:62, 3 kap' },
  { material: 'Ensilage (pressaft)', min_capacity_months: null, construction_standard: 'Pressaft maste samlas upp i behaellare. Ej slaeppas till dike eller vattendrag. Ogenomslappligt underlag.', separation_distance_m: 30, inspection_frequency: 'Kontroll vid ensilering', regulation_ref: 'SJVFS 2004:62, 3 kap; Miljobalken 2 kap' },
  { material: 'Diesel (tanklagring pa gard)', min_capacity_months: null, construction_standard: 'Dubbelvaggig tank eller invallning med 110% kapacitet. Sekundaert skydd obligatoriskt over 1 m3.', separation_distance_m: 50, inspection_frequency: 'Arlig inspektion; ackrediterad kontroll for cisterner >1 m3', regulation_ref: 'NFS 2021:10; MSBFS 2018:3' },
  { material: 'Diesel (mobil tank)', min_capacity_months: null, construction_standard: 'ADR-godkand transportbehaellare. Spill-kit obligatoriskt. Anvand droppskydd vid tankning.', separation_distance_m: null, inspection_frequency: 'Kontroll fore varje anvandning', regulation_ref: 'MSBFS 2018:3; ADR-S' },
  { material: 'Bekampningsmedel (vaxtskyddsmedel)', min_capacity_months: null, construction_standard: 'Last forvaringsskip, ventilerat, frostfritt. Aven pa avstand fran brunnar och vattendrag. Skylt "Gift".', separation_distance_m: null, inspection_frequency: 'Arlig inventering; utgangna medel till farligt avfall', regulation_ref: 'KIFS 2008:3; SFS 2014:425' },
  { material: 'Konstgodsel (handelsgodsel)', min_capacity_months: null, construction_standard: 'Torrt, under tak, borta fran vattendrag. AN-godsel (ammoniumnitrat) har saerskilda krav for staldbrandskydd.', separation_distance_m: null, inspection_frequency: 'Arlig kontroll; SEVESO for >50 ton AN', regulation_ref: 'MSBFS 2013:3; SJVFS 2004:62' },
  { material: 'Rotrester (biogodsel)', min_capacity_months: 8, construction_standard: 'Samma krav som flytgodsel. Sluten behaellare rekommenderas for att minska lukt och ammoniakforluster.', separation_distance_m: 50, inspection_frequency: 'Arlig visuell kontroll; taetkontroll vart 6:e ar', regulation_ref: 'SJVFS 2004:62, 3 kap' },
];

for (const row of storageRequirements) {
  db.run(
    `INSERT INTO storage_requirements (material, min_capacity_months, construction_standard, separation_distance_m, inspection_frequency, regulation_ref)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [row.material, row.min_capacity_months, row.construction_standard, row.separation_distance_m, row.inspection_frequency, row.regulation_ref]
  );
}
console.log(`Inserted ${storageRequirements.length} storage requirements`);

// ---------------------------------------------------------------------------
// BUFFER STRIP RULES (Jordbruksverket, Miljobalken)
// ---------------------------------------------------------------------------
const bufferStripRules = [
  { watercourse_type: 'Dike (oeppet dike)', activity: 'Godsling', min_width_m: 2.0, conditions: 'Minst 2 meters skyddsavstand vid spridning av godsel intill oeppna diken.', scheme_payment: null, regulation_ref: 'SJVFS 2004:62; Jordbruksverket allmanna rad' },
  { watercourse_type: 'Dike (oeppet dike)', activity: 'Vaxtskyddsbehandling', min_width_m: 2.0, conditions: 'Minst 2 meter, men produktspecifika villkor kan krava storre avstand (6-20 m).', scheme_payment: null, regulation_ref: 'KIFS 2008:3; produktetikett' },
  { watercourse_type: 'Vattendrag (baeck, a)', activity: 'Godsling', min_width_m: 6.0, conditions: 'Minst 6 meters skyddszon vid godsling nara storre vattendrag.', scheme_payment: null, regulation_ref: 'SJVFS 2004:62; Jordbruksverket allmanna rad' },
  { watercourse_type: 'Vattendrag (baeck, a)', activity: 'Vaxtskyddsbehandling', min_width_m: 6.0, conditions: 'Minst 6 meter. Vindavsatt sprutning kraver extra avstand.', scheme_payment: null, regulation_ref: 'KIFS 2008:3; produktetikett' },
  { watercourse_type: 'Sjo eller hav', activity: 'Godsling', min_width_m: 6.0, conditions: 'Minst 6 meters skyddszon. Laensstyrelsen kan besluta om storre zon i kaensliga omraden.', scheme_payment: null, regulation_ref: 'SJVFS 2004:62; Miljobalken 2 kap' },
  { watercourse_type: 'Alla vattendrag', activity: 'Miljoersaettning skyddszoner', min_width_m: 6.0, conditions: 'Skyddszon 6-20 m med permanent graes. Insas senast 1 september, ej godslas eller besprutas.', scheme_payment: '3000 SEK/ha (CAP 2023-2027)', regulation_ref: 'Jordbruksverket miljoeersaettning; SAM-ansokan' },
  { watercourse_type: 'Alla vattendrag', activity: 'Miljoersaettning skyddszoner (bredare)', min_width_m: 20.0, conditions: 'Upp till 20 meters bredd. Hoegre ersaettning for bredare zoner i prioriterade omraden.', scheme_payment: '3000 SEK/ha (CAP 2023-2027)', regulation_ref: 'Jordbruksverket miljoeersaettning; SAM-ansokan' },
  { watercourse_type: 'Vattenskyddsomrade', activity: 'All jordbruksverksamhet', min_width_m: null, conditions: 'Lokala foereskrifter galler. Ofta totalfoerbud mot godsling och bekampning i inre skyddszonen. Kontakta kommunen.', scheme_payment: null, regulation_ref: 'Miljobalken 7 kap 21-22 sek; lokal foereskrift' },
  { watercourse_type: 'Dranering (taeckdike)', activity: 'Godsling', min_width_m: null, conditions: 'Inte direkt buffertbredskrav men strukturkalkning och anpassade brunnar rekommenderas foer att minska laeking.', scheme_payment: null, regulation_ref: 'Jordbruksverket radgivning; Greppa naringen' },
];

for (const row of bufferStripRules) {
  db.run(
    `INSERT INTO buffer_strip_rules (watercourse_type, activity, min_width_m, conditions, scheme_payment, regulation_ref)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [row.watercourse_type, row.activity, row.min_width_m, row.conditions, row.scheme_payment, row.regulation_ref]
  );
}
console.log(`Inserted ${bufferStripRules.length} buffer strip rules`);

// ---------------------------------------------------------------------------
// ABSTRACTION RULES (Miljobalken 11 kap, HaV)
// ---------------------------------------------------------------------------
const abstractionRules = [
  { source_type: 'Ytvatten (vattenverksamhet)', threshold_m3_per_day: 300, licence_required: 1, exemptions: 'Hushalls- och djurbehov under 300 m3/dag undantas fran tillstandsplikt men anmalan till Lansstyrelsen kravs.', conditions: 'Tillstand fran Mark- och miljodomstolen kravs for uttag over 300 m3/dag. Samrad med Lansstyrelsen.' },
  { source_type: 'Ytvatten (mindre uttag)', threshold_m3_per_day: 300, licence_required: 0, exemptions: 'Uttag under 300 m3/dag fran ytvatten kraver anmalan till Lansstyrelsen, inte tillstand.', conditions: 'Anmalan ska goeras i god tid foere uttaget paborjas. Lansstyrelsen kan foerelagga om tillstandsplikt vid paverkan.' },
  { source_type: 'Grundvatten (borrning)', threshold_m3_per_day: null, licence_required: 1, exemptions: 'Enskild vattenfoersoerjning foer hushall undantagen (max ca 10 m3/dag). Storre uttag kraver tillstand.', conditions: 'Borrning av brunn ar anmalningspliktigt. Certifierad brunnsborrentreprenoer kravs. SGU brunnsarkiv.' },
  { source_type: 'Grundvatten (storre uttag)', threshold_m3_per_day: 300, licence_required: 1, exemptions: null, conditions: 'Tillstand fran Mark- och miljodomstolen kravs. Hydrologisk undersokning med konsekvensbedoemning.' },
  { source_type: 'Bevattning (jordbruk)', threshold_m3_per_day: 300, licence_required: 0, exemptions: 'Bevattning under 300 m3/dag anmalan till Lansstyrelsen. Restriktioner vid laga vattenfoering i aar och aelvar.', conditions: 'Lansstyrelsen eller kommunen kan besluta om bevattniningsforbud vid torka. Kontrollera aktuella restriktioner.' },
  { source_type: 'Vattenverksamhet (generellt)', threshold_m3_per_day: null, licence_required: 1, exemptions: 'Underhall av befintliga anlaggningar undantas i vissa fall. Rakensning av diken kraver anmalan.', conditions: 'All vattenverksamhet enligt Miljobalken 11 kap kraver antingen tillstand (Mark- och miljodomstolen) eller anmalan (Lansstyrelsen).' },
  { source_type: 'Damm (uppfodring eller nybyggnad)', threshold_m3_per_day: null, licence_required: 1, exemptions: null, conditions: 'Tillstand fran Mark- och miljodomstolen. Dammsaekerhetsklass bestams av Lansstyrelsen. Rensningsskyldighet.' },
];

for (const row of abstractionRules) {
  db.run(
    `INSERT INTO abstraction_rules (source_type, threshold_m3_per_day, licence_required, exemptions, conditions)
     VALUES (?, ?, ?, ?, ?)`,
    [row.source_type, row.threshold_m3_per_day, row.licence_required, row.exemptions, row.conditions]
  );
}
console.log(`Inserted ${abstractionRules.length} abstraction rules`);

// ---------------------------------------------------------------------------
// POLLUTION PREVENTION (Miljobalken, NFS, SJVFS)
// ---------------------------------------------------------------------------
const pollutionPrevention = [
  { activity: 'Flytgodselhantering (spridning och lagring)', hazards: 'Ammoniakavgang, kvavelakning till grundvatten, fosforavrinning till vattendrag, lukt', control_measures: 'Bandspridning eller myllning. Nedbrukning inom 4 timmar pa obevuxen mark. Sluten lagring med taeckning. Spridning enligt goedselplan.', regulatory_requirements: 'Goedselberakning kravs (SJVFS 2004:62). Miljoefarlig verksamhet vid >100 djurenheter (anmalan C), >400 djurenheter (tillstand B).', regulation_ref: 'SJVFS 2004:62; Miljobalken 9 kap; FMH 1998:899' },
  { activity: 'Ensilering (beredning och lagring)', hazards: 'Pressaft med hoegt BOD-vaerde foerorenar vattendrag. Syre-utarmning vid uttag i fiskevatten.', control_measures: 'Uppsamling av pressaft i sluten behaellare. Ogenomslappligt underlag under ensilagestack. Avstand minst 30 m fran vattendrag.', regulatory_requirements: 'Egenkontroll enligt Miljobalken 26 kap. Dagvatten fran foderplatser hanteras separat.', regulation_ref: 'Miljobalken 2 kap; SJVFS 2004:62' },
  { activity: 'Diesellagring och tankning pa gard', hazards: 'Markfoeroreningar, grundvattenfoeroreningar vid laeckage eller spill', control_measures: 'Dubbelvaggig tank eller invallning (110% kapacitet). Spillkit vid tankstation. Droppskydd vid tankning. Taet underlag.', regulatory_requirements: 'Cisternkontroll: installationskontroll + revisionskontroll vart 6:e ar (vart 3:e ar i vattenskyddsomrade). Anmalan till kommunen for cisterner >1 m3 i mark.', regulation_ref: 'NFS 2021:10; MSBFS 2018:3; Miljobalken 2 kap' },
  { activity: 'Bekampningsmedelshantering (vaxtskyddsmedel)', hazards: 'Grundvattenfoeroreningar, skadar vattenlevande organismer, bianvoergifter', control_measures: 'Paafyllning pa biobad eller taet platta med uppsamling. Inre och yttre skyddsavstand. Funktionstest av spruta vart 3:e ar. Dokumentation av all anvandning.', regulatory_requirements: 'Behorighetsbevis kravs (Jordbruksverket). Integrerat vaxtskydd (IPM) obligatoriskt. Anmalan vid yrkesmassig anvandning i vattenskyddsomrade.', regulation_ref: 'SFS 2014:425; KIFS 2008:3; Miljobalken 14 kap' },
  { activity: 'Kadaverhantering (doda djur)', hazards: 'Sjukdomsspridning, foeroreningar av mark och vatten, skadedjurstillgang', control_measures: 'Anmalan till Jordbruksverket (TSE-fall) eller Svensk Lantbrukstjanst foer avhaemtning. Tillfaellig foervaring pa haerdgjord yta. Nergraeving tillaten foer enskilt mindre djur (ej noetkreatur, kontrollera lokala regler).', regulatory_requirements: 'ABP-foerordningen (EG 1069/2009). Anmalan till kommunens miljoekontor vid storstalig doedlighet. Foelja lokala haelsoskyddsfoereskrifter.', regulation_ref: 'EG 1069/2009; SJVFS 2007:21; Miljobalken 15 kap' },
  { activity: 'Veterinavfall (lakemedelsrester, kanyler)', hazards: 'Lakemedelsrester i miljoen, stickskador, antibiotikaresistens', control_measures: 'Separera kanyler i sticksakra behaellare. Lakemedelsrester som farligt avfall till apotek eller godkand mottagare. Dokumentera karensstider.', regulatory_requirements: 'Avfallsfoerordningen (SFS 2020:614). Lakemedelsverkets foereskrifter. Karensstider enligt FASS Vet.', regulation_ref: 'SFS 2020:614; LVFS; Miljobalken 15 kap' },
  { activity: 'Plastavfall fran jordbruket (plastavfall)', hazards: 'Mikroplastspridning, markfoeroreningar, landsbygdsnedskoepning', control_measures: 'Ensilageplast, godselsakar och dranageringsroer till atervinning (SvepRetur eller likvardigt). Braenning av plastavfall forbjuden.', regulatory_requirements: 'Avfallsfoerordningen (SFS 2020:614). Producentansvar for foerpackningar. Kommunens avfallsplan.', regulation_ref: 'SFS 2020:614; Miljobalken 15 kap' },
  { activity: 'Maskintvatt och verkstadsarbete', hazards: 'Olje- och kemikalieutslaep till dagvatten och mark', control_measures: 'Tvattplatta med oljeavskiljare ansluten till spillvattennaat eller sluten tank. Spaanprodukter foer laekkageskydd. Periodisk toemmning.', regulatory_requirements: 'Oljeavskiljare enligt SS-EN 858. Tomning av avskiljare till godkand mottagare. Egenkontroll.', regulation_ref: 'Miljobalken 2 kap; SS-EN 858' },
];

for (const row of pollutionPrevention) {
  db.run(
    `INSERT INTO pollution_prevention (activity, hazards, control_measures, regulatory_requirements, regulation_ref)
     VALUES (?, ?, ?, ?, ?)`,
    [row.activity, row.hazards, row.control_measures, row.regulatory_requirements, row.regulation_ref]
  );
}
console.log(`Inserted ${pollutionPrevention.length} pollution prevention rules`);

// ---------------------------------------------------------------------------
// EIA SCREENING (Miljobalken 6 kap, FMH bilaga)
// ---------------------------------------------------------------------------
const eiaScreening = [
  { project_type: 'Djurhallning (animal husbandry)', threshold_area_ha: null, threshold_other: '>400 djurenheter (DE)', screening_required: 1, process: 'Tillstandspliktig B-verksamhet vid >400 DE. Automatisk MKB-plikt. Ansokan till Lansstyrelsen med MKB.' },
  { project_type: 'Djurhallning (mellanstor)', threshold_area_ha: null, threshold_other: '100-400 djurenheter (DE)', screening_required: 1, process: 'Anmalningspliktig C-verksamhet. Kommunens miljonaemnd beslutar. Behovsbedoemning av MKB kan kravas.' },
  { project_type: 'Uppodling av mark (ny odling)', threshold_area_ha: 10.0, threshold_other: null, screening_required: 1, process: 'Uppodling av >10 ha tidigare ouppodlad mark ar samradspliktig (12:6 MB). Lansstyrelsen bedommer MKB-plikt.' },
  { project_type: 'Uppodling av vatmark', threshold_area_ha: null, threshold_other: 'Alla storlekar', screening_required: 1, process: 'Uppodling av vatmark ar forbjuden utan dispens fran Lansstyrelsen (7 kap 15 sek MB). MKB kravs alltid.' },
  { project_type: 'Dikning (nydikning)', threshold_area_ha: null, threshold_other: 'Alla storlekar', screening_required: 1, process: 'Nydikning ar vattenverksamhet och kraver alltid tillstand fran Mark- och miljodomstolen. MKB kravs.' },
  { project_type: 'Dikning (underhallsdikning)', threshold_area_ha: null, threshold_other: 'Vasentlig aendring', screening_required: 0, process: 'Normalt underhall av befintliga diken ar ej tillstandspliktigt. Anmalan till Lansstyrelsen vid vasentlig aendring av vattenmiljon.' },
  { project_type: 'Avverkning (slutavverkning)', threshold_area_ha: 0.5, threshold_other: null, screening_required: 0, process: 'Avverkningsanmalan till Skogsstyrelsen 6 veckor i forvag for >0,5 ha. Ej formellt MKB-plikt men haesynskrav enligt Skogsvardsllagen.' },
  { project_type: 'Avverkning i nyckelbiotyp', threshold_area_ha: null, threshold_other: 'Alla storlekar', screening_required: 1, process: 'Avverkning i nyckelbiotyp eller inom Natura 2000-omrade kraver samrad med Lansstyrelsen. MKB kan kravas.' },
  { project_type: 'Vindkraft (vindkraftverk)', threshold_area_ha: null, threshold_other: '>150 m totalhojd eller >7 verk', screening_required: 1, process: 'Tillstandspliktig B-verksamhet for >150 m (inkl blad) eller grupp >7 verk. MKB kravs. Ansokan till Lansstyrelsen. Kommunalt veto (16 kap 4 sek MB).' },
  { project_type: 'Vindkraft (mindre)', threshold_area_ha: null, threshold_other: '50-150 m totalhojd', screening_required: 1, process: 'Anmalningspliktig C-verksamhet (50-150 m). Anmalan till kommunen. Behovsbedoemning av MKB.' },
  { project_type: 'Takt (grustakt, bergtakt)', threshold_area_ha: null, threshold_other: '>10 000 ton/ar eller >1 ha', screening_required: 1, process: 'Tillstandspliktig B-verksamhet. MKB kravs. Ansokan till Lansstyrelsen. Aterstaellningsplan obligatorisk.' },
  { project_type: 'Torvtakt', threshold_area_ha: null, threshold_other: '>150 000 m3 eller >25 ha', screening_required: 1, process: 'Tillstandspliktig A-verksamhet for stor torvtakt. Mark- och miljodomstolen. MKB kravs. Klimatpaverkan ska bedoemas.' },
  { project_type: 'Vattenbruk (fiskodling)', threshold_area_ha: null, threshold_other: '>40 ton fisk/ar', screening_required: 1, process: 'Tillstandspliktig B-verksamhet vid >40 ton/ar. MKB kravs. Ansokan till Lansstyrelsen. Paverkan pa recipientvatten bedoems.' },
  { project_type: 'Solcellspark (markforlagd)', threshold_area_ha: null, threshold_other: 'Behovsbedoemning', screening_required: 0, process: 'Ingen specifik MKB-troeskel i lag men storre anlaggningar (>5 ha) kan kraeva samrad (12:6 MB). Lansstyrelsen bedomemer paverkan.' },
];

for (const row of eiaScreening) {
  db.run(
    `INSERT INTO eia_screening (project_type, threshold_area_ha, threshold_other, screening_required, process)
     VALUES (?, ?, ?, ?, ?)`,
    [row.project_type, row.threshold_area_ha, row.threshold_other, row.screening_required, row.process]
  );
}
console.log(`Inserted ${eiaScreening.length} EIA screening rules`);

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
    ]
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
    ]
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
    ]
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
    ]
  );
}

// Index pollution prevention
for (const row of pollutionPrevention) {
  db.run(
    `INSERT INTO search_index (title, body, topic, jurisdiction) VALUES (?, ?, ?, ?)`,
    [
      `Foerebyggande: ${row.activity}`,
      [row.hazards, row.control_measures, row.regulatory_requirements, row.regulation_ref].filter(Boolean).join('. '),
      'pollution',
      'SE',
    ]
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
    ]
  );
}

const totalIndexed = nitratkansligaOmraden.length + storageRequirements.length +
  bufferStripRules.length + abstractionRules.length +
  pollutionPrevention.length + eiaScreening.length;
console.log(`Indexed ${totalIndexed} entries in FTS5 search index`);

// ---------------------------------------------------------------------------
// METADATA
// ---------------------------------------------------------------------------
db.run("INSERT OR REPLACE INTO db_metadata (key, value) VALUES ('last_ingest', ?)", [now]);
db.run("INSERT OR REPLACE INTO db_metadata (key, value) VALUES ('build_date', ?)", [now]);
db.run("INSERT OR REPLACE INTO db_metadata (key, value) VALUES ('schema_version', '1.0')", []);
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
  },
  total_records: totalIndexed,
  fts_indexed: totalIndexed,
  sources: [
    'Jordbruksverket (SJVFS 2004:62, SJVFS 2011:25)',
    'Naturvardsverket (NFS)',
    'Havs- och vattenmyndigheten (HaV)',
    'Miljobalken (1998:808)',
    'Skogsstyrelsen',
  ],
}, null, 2));

db.close();
console.log(`\nIngestion complete: ${totalIndexed} records across 6 tables`);
console.log('Database: data/database.db');
console.log('Coverage: data/coverage.json');
