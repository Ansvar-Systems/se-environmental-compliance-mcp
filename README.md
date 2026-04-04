# Sweden Environmental Compliance MCP

Swedish environmental compliance data for agriculture and land use. Query Swedish environmental regulations through the [Model Context Protocol](https://modelcontextprotocol.io).

> **Data sources:** Jordbruksverket (SJVFS), Naturvardsverket (NFS), Havs- och vattenmyndigheten (HaV), Miljobalken (1998:808). Licensed under applicable Swedish open data terms.

## Quick Start

### Claude Desktop / Claude Code

```json
{
  "mcpServers": {
    "se-environmental-compliance": {
      "command": "npx",
      "args": ["-y", "@ansvar/se-environmental-compliance-mcp"]
    }
  }
}
```

### Streamable HTTP (Docker)

```
https://mcp.ansvar.eu/se-environmental-compliance/mcp
```

## Tools

| Tool | Description |
|------|-------------|
| `about` | Get server metadata: name, version, coverage, data sources, and links. |
| `list_sources` | List all data sources with authority, URL, license, and freshness info. |
| `check_data_freshness` | Check when data was last ingested, staleness status, and how to trigger a refresh. |
| `check_nitratkansligt_omrade` | Check rules for nitratkansliga omraden (nitrate-sensitive areas) under the EU Nitrates Directive. |
| `get_spreading_windows` | Get allowed spreading periods for manure and fertiliser based on type and land use. |
| `get_storage_requirements` | Get storage requirements for agricultural materials (manure, silage, fuel, pesticides). |
| `check_buffer_strip_rules` | Check buffer strip and protection zone rules near watercourses. |
| `get_abstraction_rules` | Get water abstraction and vattenverksamhet rules for surface water and groundwater. |
| `search_environmental_rules` | Full-text search across all Swedish environmental compliance data. |
| `get_pollution_prevention` | Get pollution prevention requirements for agricultural and land-use activities. |
| `get_eia_screening` | Check environmental impact assessment (MKB) screening thresholds for projects. |

## Example Queries

- "Vilka regler galler for nitratkansliga omraden i Sverige?" (What rules apply to nitrate-sensitive areas in Sweden?)
- "When can I spread manure on arable land in southern Sweden?"
- "Hur bred ska en skyddszon vara vid ett vattendrag?" (How wide should a buffer strip be near a watercourse?)
- "Do I need an EIA for a 500-head cattle unit?"

## Stats

| Metric | Value |
|--------|-------|
| Jurisdiction | SE (Sweden) |
| Tools | 11 |
| Transport | stdio + Streamable HTTP |
| License | Apache-2.0 |

## Links

- [Ansvar MCP Network](https://ansvar.eu/open-agriculture)
- [GitHub](https://github.com/ansvar-systems/se-environmental-compliance-mcp)
- [All Swedish Agriculture MCPs](https://mcp.ansvar.eu)
