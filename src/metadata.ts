export interface Meta {
  disclaimer: string;
  data_age: string;
  source_url: string;
  copyright: string;
  server: string;
  version: string;
}

const DISCLAIMER =
  'This data is provided for informational purposes only. It does not constitute professional ' +
  'environmental or legal advice. Always consult a qualified environmental advisor or the relevant ' +
  'Swedish authority (Jordbruksverket, Naturvardsverket, Havs- och vattenmyndigheten) before ' +
  'making compliance decisions. Data sourced from Swedish government publications.';

export function buildMeta(overrides?: Partial<Meta>): Meta {
  return {
    disclaimer: DISCLAIMER,
    data_age: overrides?.data_age ?? 'unknown',
    source_url: overrides?.source_url ?? 'https://jordbruksverket.se',
    copyright: 'Data: Swedish Government (public domain). Server: Apache-2.0 Ansvar Systems.',
    server: 'se-environmental-compliance-mcp',
    version: '0.1.0',
    ...overrides,
  };
}
