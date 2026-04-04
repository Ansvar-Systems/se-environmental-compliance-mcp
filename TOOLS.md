# Tools Reference

## Meta Tools

### `about`

Get server metadata: name, version, coverage, data sources, and links.

**Parameters:** None

**Returns:** Server name, version, jurisdiction list, data source names (5 sources), tool count, homepage/repository links.

---

### `list_sources`

List all data sources with authority, URL, license, and freshness info.

**Parameters:** None

**Returns:** Array of 5 sources (Jordbruksverket, Naturvardsverket, Havs- och vattenmyndigheten, Miljobalken, Skogsstyrelsen), each with `name`, `authority`, `official_url`, `retrieval_method`, `update_frequency`, `license`, `coverage`, `last_retrieved`.

---

### `check_data_freshness`

Check when data was last ingested, staleness status, and how to trigger a refresh.

**Parameters:** None

**Returns:** `status` (fresh/stale/unknown), `last_ingest`, `build_date`, `schema_version`, `days_since_ingest`, `staleness_threshold_days` (90), `refresh_command`.

---

## Domain Tools

### `check_nitratkansligt_omrade`

Check rules for nitrate-sensitive areas (nitratkansliga omraden) by activity and season.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `activity` | string | Yes | Agricultural activity (e.g. "spridning", "lagring", "godsling") |
| `season` | string | No | Season for period checking ("spring", "summer", "autumn", "winter") |
| `soil_type` | string | No | Soil type filter |
| `jurisdiction` | string | No | ISO 3166-1 alpha-2 code (default: SE) |

**Returns:** Array of matching rules with `activity`, `material_type`, `soil_type`, `closed_period`, `currently_in_closed_period` (if season given), `max_application_rate`, `conditions`, `regulation_ref`.

**Example:** `{ "activity": "spridning", "season": "autumn" }`

---

### `get_spreading_windows`

Get manure/fertiliser spreading windows by material type, land type, and nitrate zone.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `manure_type` | string | Yes | Material type (e.g. "flytgodsel", "fastgodsel", "mineralgodsel") |
| `land_type` | string | Yes | Land type (e.g. "akerjord", "betesmark") |
| `nitratkansligt` | boolean | No | Whether the land is in a nitrate-sensitive area |
| `jurisdiction` | string | No | ISO 3166-1 alpha-2 code (default: SE) |

**Returns:** Array of spreading windows with `activity`, `material_type`, `soil_type`, `closed_period` (start/end), `open_period`, `max_application_rate`, `conditions`, `regulation_ref`.

**Example:** `{ "manure_type": "flytgodsel", "land_type": "akerjord", "nitratkansligt": true }`

---

### `get_storage_requirements`

Get storage requirements for manure, slurry, silage, diesel, or pesticides.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `material` | string | Yes | Material name (e.g. "flytgodsel", "fastgodsel", "ensilage", "diesel", "bekampningsmedel") |
| `volume` | number | No | Storage volume for capacity assessment |
| `jurisdiction` | string | No | ISO 3166-1 alpha-2 code (default: SE) |

**Returns:** Array of requirements with `material`, `min_capacity_months`, `construction_standard`, `separation_distance_m`, `inspection_frequency`, `regulation_ref`.

**Example:** `{ "material": "flytgodsel" }`

---

### `check_buffer_strip_rules`

Check buffer strip requirements by watercourse type and activity.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `watercourse_type` | string | No | Watercourse type (e.g. "dike", "vattendrag", "sjo") |
| `activity` | string | No | Agricultural activity |
| `jurisdiction` | string | No | ISO 3166-1 alpha-2 code (default: SE) |

**Returns:** Array of rules with `watercourse_type`, `activity`, `min_width_m`, `conditions`, `scheme_payment`, `regulation_ref`.

**Example:** `{ "watercourse_type": "vattendrag" }`

---

### `get_abstraction_rules`

Get water abstraction licence rules by source type and volume.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `source_type` | string | No | Water source (e.g. "ytvatten", "grundvatten", "vattenverksamhet") |
| `volume_m3_per_day` | number | No | Volume for licence threshold assessment |
| `jurisdiction` | string | No | ISO 3166-1 alpha-2 code (default: SE) |

**Returns:** Array of rules with `source_type`, `threshold_m3_per_day`, `licence_required`, `exemptions`, `conditions`, `volume_assessment` (if volume given).

**Example:** `{ "source_type": "grundvatten", "volume_m3_per_day": 50 }`

---

### `search_environmental_rules`

Full-text search across all environmental rules. Uses tiered FTS5 search.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `query` | string | Yes | Free-text search query (Swedish terms work best) |
| `topic` | string | No | Filter by topic |
| `jurisdiction` | string | No | ISO 3166-1 alpha-2 code (default: SE) |
| `limit` | number | No | Max results (default: 20, max: 50) |

**Returns:** `results_count`, array of results with `title`, `body`, `topic`, `relevance_rank`.

**Example:** `{ "query": "nitratkansligt spridning" }`

---

### `get_pollution_prevention`

Get pollution prevention rules for a specific agricultural activity.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `activity` | string | Yes | Activity (e.g. "flytgodsel", "ensilage", "diesel", "bekampningsmedel", "kadaver", "veterinaravfall") |
| `jurisdiction` | string | No | ISO 3166-1 alpha-2 code (default: SE) |

**Returns:** Array of measures with `activity`, `hazards`, `control_measures`, `regulatory_requirements`, `regulation_ref`.

**Example:** `{ "activity": "diesel" }`

---

### `get_eia_screening`

Check EIA (Environmental Impact Assessment) screening thresholds for a project type.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `project_type` | string | Yes | Project type (e.g. "djurhallning", "uppodling", "dikning", "avverkning", "vindkraft", "takt") |
| `area_ha` | number | No | Project area in hectares for threshold comparison |
| `jurisdiction` | string | No | ISO 3166-1 alpha-2 code (default: SE) |

**Returns:** Array of screenings with `project_type`, `threshold_area_ha`, `threshold_other`, `screening_required`, `process`, `area_assessment` (if area given).

**Example:** `{ "project_type": "djurhallning", "area_ha": 25 }`
