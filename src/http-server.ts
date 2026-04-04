import { createServer, type IncomingMessage, type ServerResponse } from 'http';
import { randomUUID } from 'crypto';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { createDatabase, type Database } from './db.js';
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
const PORT = parseInt(process.env.PORT ?? '3000', 10);

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

function textResult(data: unknown) {
  return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
}

function errorResult(message: string) {
  return { content: [{ type: 'text' as const, text: JSON.stringify({ error: message }) }], isError: true };
}

function registerTools(server: Server, db: Database): void {
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
}

const db = createDatabase();
const sessions = new Map<string, { transport: StreamableHTTPServerTransport; server: Server }>();

function createMcpServer(): Server {
  const mcpServer = new Server(
    { name: SERVER_NAME, version: SERVER_VERSION },
    { capabilities: { tools: {} } }
  );
  registerTools(mcpServer, db);
  return mcpServer;
}

async function handleMCPRequest(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const sessionId = req.headers['mcp-session-id'] as string | undefined;

  if (sessionId && sessions.has(sessionId)) {
    const session = sessions.get(sessionId)!;
    await session.transport.handleRequest(req, res);
    return;
  }

  if (req.method === 'GET' || req.method === 'DELETE') {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Invalid or missing session ID' }));
    return;
  }

  const mcpServer = createMcpServer();
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: () => randomUUID(),
  });

  await mcpServer.connect(transport);

  transport.onclose = () => {
    if (transport.sessionId) {
      sessions.delete(transport.sessionId);
    }
    mcpServer.close().catch(() => {});
  };

  await transport.handleRequest(req, res);

  if (transport.sessionId) {
    sessions.set(transport.sessionId, { transport, server: mcpServer });
  }
}

const httpServer = createServer(async (req, res) => {
  const url = new URL(req.url || '/', `http://localhost:${PORT}`);

  if (url.pathname === '/health' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'healthy', server: SERVER_NAME, version: SERVER_VERSION }));
    return;
  }

  if (url.pathname === '/mcp' || url.pathname === '/') {
    try {
      await handleMCPRequest(req, res);
    } catch (err) {
      if (!res.headersSent) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err instanceof Error ? err.message : 'Internal server error' }));
      }
    }
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

httpServer.listen(PORT, () => {
  console.log(`${SERVER_NAME} v${SERVER_VERSION} listening on port ${PORT}`);
});
