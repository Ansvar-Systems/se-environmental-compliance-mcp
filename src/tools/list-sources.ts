import { buildMeta } from '../metadata.js';
import type { Database } from '../db.js';

interface Source {
  name: string;
  authority: string;
  official_url: string;
  retrieval_method: string;
  update_frequency: string;
  license: string;
  coverage: string;
  last_retrieved?: string;
}

export function handleListSources(db: Database): { sources: Source[]; _meta: ReturnType<typeof buildMeta> } {
  const lastIngest = db.get<{ value: string }>('SELECT value FROM db_metadata WHERE key = ?', ['last_ingest']);

  const sources: Source[] = [
    {
      name: 'Jordbruksverket (SJVFS)',
      authority: 'Statens jordbruksverk',
      official_url: 'https://jordbruksverket.se/lagar-och-regler/forfattningar',
      retrieval_method: 'MANUAL_REVIEW',
      update_frequency: 'annual',
      license: 'Swedish public domain',
      coverage: 'Nitrate-sensitive areas, spreading windows, manure storage, buffer strips',
      last_retrieved: lastIngest?.value,
    },
    {
      name: 'Naturvardsverket (NFS)',
      authority: 'Naturvardsverket',
      official_url: 'https://www.naturvardsverket.se/lagar-och-regler/',
      retrieval_method: 'MANUAL_REVIEW',
      update_frequency: 'annual',
      license: 'Swedish public domain',
      coverage: 'Pollution prevention, environmental impact assessment, general environmental rules',
      last_retrieved: lastIngest?.value,
    },
    {
      name: 'Havs- och vattenmyndigheten (HaV)',
      authority: 'Havs- och vattenmyndigheten',
      official_url: 'https://www.havochvatten.se/regelverk.html',
      retrieval_method: 'MANUAL_REVIEW',
      update_frequency: 'annual',
      license: 'Swedish public domain',
      coverage: 'Water abstraction rules, watercourse protection, aquatic environment regulations',
      last_retrieved: lastIngest?.value,
    },
    {
      name: 'Miljobalken (1998:808)',
      authority: 'Riksdagen',
      official_url: 'https://www.riksdagen.se/sv/dokument-och-lagar/dokument/svensk-forfattningssamling/miljobalk-1998808_sfs-1998-808/',
      retrieval_method: 'MANUAL_REVIEW',
      update_frequency: 'as amended',
      license: 'Swedish public domain',
      coverage: 'Environmental code - EIA screening, environmental permits, general rules of consideration',
      last_retrieved: lastIngest?.value,
    },
    {
      name: 'Skogsstyrelsen',
      authority: 'Skogsstyrelsen',
      official_url: 'https://www.skogsstyrelsen.se/lag-och-tillsyn/',
      retrieval_method: 'MANUAL_REVIEW',
      update_frequency: 'annual',
      license: 'Swedish public domain',
      coverage: 'Forestry clearing notification thresholds',
      last_retrieved: lastIngest?.value,
    },
  ];

  return {
    sources,
    _meta: buildMeta({ source_url: 'https://jordbruksverket.se' }),
  };
}
