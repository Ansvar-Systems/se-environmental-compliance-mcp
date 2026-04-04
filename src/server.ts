#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { createDatabase } from './db.js';
import { handleAbout } from './tools/about.js';
import { handleListSources } from './tools/list-sources.js';
import { handleCheckFreshness } from './tools/check-freshness.js';
import { handleSearchEnvironmentalRules } from './tools/search-environmental-rules.js';
import { handleCheckNitratkansligtOmrade } from './tools/check-nitratkansligt-omrade.js';
import { handleGetSpreadingWindows } from './tools/get-spreading-windows.js';
import { handleGetStorageRequirements } from './tools/get-storage-requirements.js';
import { handleCheckBufferStripRules } from './tools/check-buffer-strip-rules.js';
import { handleGetAbstractionRules } from './tools/get-abstraction-rules.js';
import { handleGetPollutionPrevention } from './tools/get-pollution-prevention.js';
import { handleGetEiaScreening } from './tools/get-eia-screening.js';

const SERVER_NAME = 'se-environmental-compliance-mcp';
const SERVER_VERSION = '0.1.0';

const TOOLS = [
  {
    name: 'about',
    description: 'Get server metadata: name, version, coverage, data sources, and links.',
    inputSchema: { type: 'object' as const, properties: {} },
  },
  {
    name: 'list_sources',
    description: 'List all data sources with authority, URL, license, and freshness info.',
    inputSchema: { type: 'object' as const, properties: {} },
  },
  {
    name: 'check_data_freshness',
    description: 'Check when data was last ingested, staleness status, and how to trigger a refresh.',
    inputSchema: { type: 'object' as const, properties: {} },
  },
  {
    name: 'check_nitratkansligt_omrade',
    description: 'Check rules for nitratkansliga omraden (nitrate-sensitive areas). Sweden\'s implementation of the EU Nitrates Directive. Returns closed periods, application rate limits, and conditions for a given activity.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        activity: { type: 'string', description: 'Agricultural activity (e.g. "godsel", "stallgodsel", "flytgodsel", "handelsgodsel")' },
        season: { type: 'string', description: 'Month or season to check if closed period is active (e.g. "november", "vinter")' },
        soil_type: { type: 'string', description: 'Soil type filter (e.g. "lera", "sand")' },
        jurisdiction: { type: 'string', description: 'ISO 3166-1 alpha-2 code (default: SE)' },
      },
      required: ['activity'],
    },
  },
  {
    name: 'get_spreading_windows',
    description: 'Get allowed spreading periods for manure and fertiliser. Returns closed periods and open windows based on manure type and land use.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        manure_type: { type: 'string', description: 'Type of manure or fertiliser (e.g. "stallgodsel", "flytgodsel", "handelsgodsel", "urea")' },
        land_type: { type: 'string', description: 'Land use type (e.g. "akerjord", "bete", "vall")' },
        nitratkansligt: { type: 'boolean', description: 'Whether the area is in a nitratkansligt omrade (default: false)' },
        jurisdiction: { type: 'string', description: 'ISO 3166-1 alpha-2 code (default: SE)' },
      },
      required: ['manure_type', 'land_type'],
    },
  },
  {
    name: 'get_storage_requirements',
    description: 'Get storage requirements for agricultural materials (manure, silage, fuel, pesticides). Returns capacity, construction, separation distances, and inspection requirements.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        material: { type: 'string', description: 'Material to store (e.g. "flytgodsel", "fastgodsel", "ensilage", "diesel", "bekampningsmedel")' },
        volume: { type: 'number', description: 'Storage volume in m3 (for threshold checks)' },
        jurisdiction: { type: 'string', description: 'ISO 3166-1 alpha-2 code (default: SE)' },
      },
      required: ['material'],
    },
  },
  {
    name: 'check_buffer_strip_rules',
    description: 'Check buffer strip and protection zone rules near watercourses. Returns minimum widths, conditions, and available environmental payments (miljorsattning).',
    inputSchema: {
      type: 'object' as const,
      properties: {
        watercourse_type: { type: 'string', description: 'Type of watercourse (e.g. "dike", "vattendrag", "sjo", "hav")' },
        activity: { type: 'string', description: 'Activity near watercourse (e.g. "godsel", "bekampning", "plogning")' },
        jurisdiction: { type: 'string', description: 'ISO 3166-1 alpha-2 code (default: SE)' },
      },
    },
  },
  {
    name: 'get_abstraction_rules',
    description: 'Get water abstraction and vattenverksamhet rules. Returns permit thresholds, licence requirements, and exemptions for surface water and groundwater.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        source_type: { type: 'string', description: 'Water source type (e.g. "ytvatten", "grundvatten", "vattenverksamhet")' },
        volume_m3_per_day: { type: 'number', description: 'Planned daily abstraction volume in m3 (for licence threshold check)' },
        jurisdiction: { type: 'string', description: 'ISO 3166-1 alpha-2 code (default: SE)' },
      },
    },
  },
  {
    name: 'search_environmental_rules',
    description: 'Full-text search across all Swedish environmental compliance data. Covers nitrate rules, storage, buffer strips, water abstraction, pollution prevention, and EIA screening.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        query: { type: 'string', description: 'Free-text search query (Swedish or English)' },
        topic: { type: 'string', description: 'Filter by topic (e.g. "nitratkansliga_omraden", "storage", "buffer_strips", "abstraction", "pollution", "eia")' },
        jurisdiction: { type: 'string', description: 'ISO 3166-1 alpha-2 code (default: SE)' },
        limit: { type: 'number', description: 'Max results (default: 20, max: 50)' },
      },
      required: ['query'],
    },
  },
  {
    name: 'get_pollution_prevention',
    description: 'Get pollution prevention requirements for agricultural and land-use activities. Returns hazards, control measures, and regulatory requirements.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        activity: { type: 'string', description: 'Activity type (e.g. "flytgodsel", "ensilage", "diesel", "bekampningsmedel", "kadaver")' },
        jurisdiction: { type: 'string', description: 'ISO 3166-1 alpha-2 code (default: SE)' },
      },
      required: ['activity'],
    },
  },
  {
    name: 'get_eia_screening',
    description: 'Check environmental impact assessment (MKB) screening thresholds for projects. Returns whether screening or full EIA is required based on project type and size.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        project_type: { type: 'string', description: 'Project type (e.g. "djurhallning", "uppodling", "dikning", "avverkning", "vindkraft")' },
        area_ha: { type: 'number', description: 'Project area in hectares (for threshold comparison)' },
        jurisdiction: { type: 'string', description: 'ISO 3166-1 alpha-2 code (default: SE)' },
      },
      required: ['project_type'],
    },
  },
];

const SearchArgsSchema = z.object({
  query: z.string(),
  topic: z.string().optional(),
  jurisdiction: z.string().optional(),
  limit: z.number().optional(),
});

const NvzArgsSchema = z.object({
  activity: z.string(),
  season: z.string().optional(),
  soil_type: z.string().optional(),
  jurisdiction: z.string().optional(),
});

const SpreadingArgsSchema = z.object({
  manure_type: z.string(),
  land_type: z.string(),
  nitratkansligt: z.boolean().optional(),
  jurisdiction: z.string().optional(),
});

const StorageArgsSchema = z.object({
  material: z.string(),
  volume: z.number().optional(),
  jurisdiction: z.string().optional(),
});

const BufferStripArgsSchema = z.object({
  watercourse_type: z.string().optional(),
  activity: z.string().optional(),
  jurisdiction: z.string().optional(),
});

const AbstractionArgsSchema = z.object({
  source_type: z.string().optional(),
  volume_m3_per_day: z.number().optional(),
  jurisdiction: z.string().optional(),
});

const PollutionArgsSchema = z.object({
  activity: z.string(),
  jurisdiction: z.string().optional(),
});

const EiaArgsSchema = z.object({
  project_type: z.string(),
  area_ha: z.number().optional(),
  jurisdiction: z.string().optional(),
});

function textResult(data: unknown) {
  return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
}

function errorResult(message: string) {
  return { content: [{ type: 'text' as const, text: JSON.stringify({ error: message }) }], isError: true };
}

const db = createDatabase();

const server = new Server(
  { name: SERVER_NAME, version: SERVER_VERSION },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args = {} } = request.params;

  try {
    switch (name) {
      case 'about':
        return textResult(handleAbout());
      case 'list_sources':
        return textResult(handleListSources(db));
      case 'check_data_freshness':
        return textResult(handleCheckFreshness(db));
      case 'check_nitratkansligt_omrade':
        return textResult(handleCheckNitratkansligtOmrade(db, NvzArgsSchema.parse(args)));
      case 'get_spreading_windows':
        return textResult(handleGetSpreadingWindows(db, SpreadingArgsSchema.parse(args)));
      case 'get_storage_requirements':
        return textResult(handleGetStorageRequirements(db, StorageArgsSchema.parse(args)));
      case 'check_buffer_strip_rules':
        return textResult(handleCheckBufferStripRules(db, BufferStripArgsSchema.parse(args)));
      case 'get_abstraction_rules':
        return textResult(handleGetAbstractionRules(db, AbstractionArgsSchema.parse(args)));
      case 'search_environmental_rules':
        return textResult(handleSearchEnvironmentalRules(db, SearchArgsSchema.parse(args)));
      case 'get_pollution_prevention':
        return textResult(handleGetPollutionPrevention(db, PollutionArgsSchema.parse(args)));
      case 'get_eia_screening':
        return textResult(handleGetEiaScreening(db, EiaArgsSchema.parse(args)));
      default:
        return errorResult(`Unknown tool: ${name}`);
    }
  } catch (err) {
    return errorResult(err instanceof Error ? err.message : String(err));
  }
});

async function main(): Promise<void> {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  process.stderr.write(`Fatal error: ${err.message}\n`);
  process.exit(1);
});
