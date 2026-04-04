import { buildMeta } from '../metadata.js';
import { SUPPORTED_JURISDICTIONS } from '../jurisdiction.js';

export function handleAbout() {
  return {
    name: 'Sweden Environmental Compliance MCP',
    description:
      'Swedish environmental compliance data for agriculture and land use. Covers nitrate-sensitive ' +
      'areas (nitratkansliga omraden), manure spreading windows, storage requirements, buffer strips, ' +
      'water abstraction, pollution prevention, and EIA screening thresholds.',
    version: '0.1.0',
    jurisdiction: [...SUPPORTED_JURISDICTIONS],
    data_sources: [
      'Jordbruksverket (SJVFS 2004:62, SJVFS 2011:25)',
      'Naturvardsverket (NFS)',
      'Havs- och vattenmyndigheten (HaV)',
      'Miljobalken (1998:808)',
      'Skogsstyrelsen',
    ],
    tools_count: 11,
    links: {
      homepage: 'https://ansvar.eu/open-agriculture',
      repository: 'https://github.com/ansvar-systems/se-environmental-compliance-mcp',
      mcp_network: 'https://ansvar.ai/mcp',
    },
    _meta: buildMeta(),
  };
}
