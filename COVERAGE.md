# Coverage

## What Is Included

- **Nitrate-sensitive areas (nitratkansliga omraden)** -- Activity-specific rules, closed periods, soil type conditions, maximum application rates per SJVFS 2004:62
- **Spreading windows** -- Material-specific spreading periods for manure, slurry, and fertiliser by land type and nitrate zone
- **Storage requirements** -- Minimum storage capacity, construction standards, separation distances, and inspection frequencies for manure, slurry, silage, diesel, and pesticides
- **Buffer strip rules** -- Minimum widths by watercourse type, activity restrictions, and agri-environment scheme payments
- **Water abstraction rules** -- Licence thresholds, exemptions, and conditions by source type (surface water, groundwater)
- **Pollution prevention** -- Hazards, control measures, and regulatory requirements by agricultural activity
- **EIA screening** -- Project type thresholds (area, capacity), screening requirements, and process descriptions under Miljobalken
- **Full-text search** -- Tiered FTS5 search across all environmental rule topics

## Jurisdictions

| Code | Country | Status |
|------|---------|--------|
| SE | Sweden | Supported |

## Data Sources

| Source | Authority | Coverage |
|--------|-----------|----------|
| Jordbruksverket (SJVFS) | Swedish Board of Agriculture | Nitrate zones, spreading, storage, buffer strips |
| Naturvardsverket (NFS) | Swedish EPA | Pollution prevention, EIA screening, general environmental rules |
| Havs- och vattenmyndigheten | Swedish Marine & Water Authority | Water abstraction, watercourse protection |
| Miljobalken (1998:808) | Riksdagen | Environmental Code, EIA thresholds, general rules of consideration |
| Skogsstyrelsen | Swedish Forest Agency | Forestry-related buffer strips and environmental protection |

## What Is NOT Included

- **County-level variations** -- Some Lansstyrelsen have additional local conditions not captured
- **Natura 2000 site-specific rules** -- Not included; check with relevant Lansstyrelsen
- **Industrial emissions (IED)** -- Focus is agricultural activities, not large industrial installations
- **Waste management permits** -- Not covered beyond farm-level pollution prevention
- **Climate reporting obligations** -- Greenhouse gas reporting requirements are not included
- **Forestry-specific rules** -- Only buffer strips near watercourses; full Skogsvardslag coverage is not included
- **Other Nordic countries** -- Sweden only

## Known Gaps

1. Nitrate-sensitive area boundaries are simplified to rule-level data, not geographic polygons
2. Spreading windows may have county-level exceptions not captured in the national rules
3. EIA screening thresholds cover common agricultural project types but not all Miljobalken annexes
4. FTS5 search works best with Swedish terms (e.g. "flytgodsel", "nitratkansligt") rather than English equivalents

## Data Freshness

Run `check_data_freshness` to see when data was last updated. Staleness threshold is 90 days. Manual refresh: `gh workflow run ingest.yml`.
