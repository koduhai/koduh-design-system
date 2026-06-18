#!/usr/bin/env node
/*
 * @koduhai/design-system MCP server.
 *
 * Exposes the design system's component props, design tokens, and usage as
 * queryable tools, pinned per released version. Each version snapshot lives in
 * mcp/data/<version>/ (built by scripts/build-metadata.ts); tools take an
 * optional `version` and default to the latest, so a consumer pinned to an older
 * release can get docs that match what they installed.
 *
 * Transport: stdio. Wire it into an MCP client (e.g. Claude) — see README.
 */
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

const dataDir = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'data');

interface PropMeta {
  name: string;
  type: string;
  required: boolean;
  default: string | null;
  description: string;
}
interface ComponentMeta {
  name: string;
  slug: string;
  category: string;
  description: string;
  also: string[];
  sourcePath: string;
  import: string;
  props: PropMeta[] | null;
}
interface Snapshot {
  version: string;
  components: ComponentMeta[];
  tokens: any;
}

// --- load version snapshots -------------------------------------------------

function semverCompare(a: string, b: string): number {
  const pa = a.split('.').map(Number);
  const pb = b.split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    if ((pa[i] ?? 0) !== (pb[i] ?? 0)) return (pa[i] ?? 0) - (pb[i] ?? 0);
  }
  return 0;
}

const snapshots = new Map<string, Snapshot>();
if (existsSync(dataDir)) {
  for (const entry of readdirSync(dataDir)) {
    const dir = resolve(dataDir, entry);
    if (!statSync(dir).isDirectory()) continue;
    const compPath = resolve(dir, 'components.json');
    if (!existsSync(compPath)) continue;
    const components = JSON.parse(readFileSync(compPath, 'utf8')).components as ComponentMeta[];
    const tokensPath = resolve(dir, 'tokens.json');
    const tokens = existsSync(tokensPath) ? JSON.parse(readFileSync(tokensPath, 'utf8')) : null;
    snapshots.set(entry, { version: entry, components, tokens });
  }
}

const versions = [...snapshots.keys()].sort(semverCompare);
const latest = versions[versions.length - 1];

function pickVersion(v?: string): string {
  if (!v) {
    if (!latest) throw new Error('No metadata snapshots found. Run `npm run build:metadata`.');
    return latest;
  }
  if (!snapshots.has(v)) {
    throw new Error(`Unknown version "${v}". Available: ${versions.join(', ') || '(none)'}.`);
  }
  return v;
}

const findComponent = (snap: Snapshot, name: string) => {
  const n = name.toLowerCase();
  return snap.components.find((c) => c.name.toLowerCase() === n || c.slug === n);
};

// --- server -----------------------------------------------------------------

const server = new Server(
  { name: 'koduh-design-system', version: '0.1.0' },
  { capabilities: { tools: {}, resources: {} } },
);

const VERSION_PROP = {
  version: {
    type: 'string',
    description: `Package version to query. Defaults to the latest (${latest ?? 'none'}).`,
  },
} as const;

const tools = [
  {
    name: 'list_versions',
    description:
      'List the @koduhai/design-system versions this server has metadata snapshots for, and which is latest.',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'list_components',
    description:
      'List components for a version, optionally filtered by category. Returns name, slug, category, and a one-line description.',
    inputSchema: {
      type: 'object',
      properties: {
        ...VERSION_PROP,
        category: {
          type: 'string',
          description: 'Optional category filter (e.g. "Form controls").',
        },
      },
    },
  },
  {
    name: 'get_component',
    description:
      'Get full docs for one component: description, import statement, and its full props table (name, type, required, default, description). Accepts the component name or slug.',
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Component name or slug, e.g. "Button" or "date-picker".',
        },
        ...VERSION_PROP,
      },
      required: ['name'],
    },
  },
  {
    name: 'get_tokens',
    description:
      'Get design tokens for a version. Without a group, returns the available token group names and theme names. With a group (e.g. "space", "fontSize", "radius", "primitives", or a theme name like "dark"/"light"), returns that group\'s values.',
    inputSchema: {
      type: 'object',
      properties: {
        ...VERSION_PROP,
        group: { type: 'string', description: 'Token group or theme name to expand.' },
      },
    },
  },
  {
    name: 'search',
    description:
      'Search a version for components (by name, description, category, or prop name) and token groups matching a query string.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search text.' },
        ...VERSION_PROP,
      },
      required: ['query'],
    },
  },
];

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools }));

const ok = (data: unknown) => ({
  content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
});
const fail = (msg: string) => ({
  content: [{ type: 'text', text: `Error: ${msg}` }],
  isError: true,
});

server.setRequestHandler(CallToolRequestSchema, async (req) => {
  const args = (req.params.arguments ?? {}) as Record<string, any>;
  try {
    switch (req.params.name) {
      case 'list_versions':
        return ok({ versions, latest });

      case 'list_components': {
        const snap = snapshots.get(pickVersion(args.version))!;
        let comps = snap.components;
        if (args.category) {
          const cat = String(args.category).toLowerCase();
          comps = comps.filter((c) => c.category.toLowerCase() === cat);
        }
        return ok({
          version: snap.version,
          count: comps.length,
          components: comps.map((c) => ({
            name: c.name,
            slug: c.slug,
            category: c.category,
            description: c.description,
          })),
        });
      }

      case 'get_component': {
        const snap = snapshots.get(pickVersion(args.version))!;
        const c = findComponent(snap, String(args.name ?? ''));
        if (!c) return fail(`Component "${args.name}" not found in v${snap.version}.`);
        return ok({ version: snap.version, ...c });
      }

      case 'get_tokens': {
        const snap = snapshots.get(pickVersion(args.version))!;
        const t = snap.tokens;
        if (!t) return fail(`No tokens captured for v${snap.version}.`);
        if (!args.group) {
          return ok({
            version: snap.version,
            groups: Object.keys(t.tokens ?? {}),
            themes: Object.keys(t.themes ?? {}),
            note: 'Pass `group` to expand a token group, "primitives", or a theme name.',
          });
        }
        const g = String(args.group);
        const value =
          t.tokens?.[g] ?? t.themes?.[g] ?? (g === 'primitives' ? t.primitives : undefined);
        if (value === undefined) return fail(`Unknown token group "${g}" in v${snap.version}.`);
        return ok({ version: snap.version, group: g, value });
      }

      case 'search': {
        const snap = snapshots.get(pickVersion(args.version))!;
        const q = String(args.query ?? '').toLowerCase();
        if (!q) return fail('Empty query.');
        const components = snap.components
          .map((c) => {
            const matchedProps = (c.props ?? [])
              .filter((p) => p.name.toLowerCase().includes(q))
              .map((p) => p.name);
            const hit =
              c.name.toLowerCase().includes(q) ||
              c.description.toLowerCase().includes(q) ||
              c.category.toLowerCase().includes(q) ||
              matchedProps.length > 0;
            return hit
              ? {
                  name: c.name,
                  slug: c.slug,
                  category: c.category,
                  description: c.description,
                  matchedProps,
                }
              : null;
          })
          .filter(Boolean);
        const tokenGroups = Object.keys(snap.tokens?.tokens ?? {}).filter((k) =>
          k.toLowerCase().includes(q),
        );
        return ok({ version: snap.version, components, tokenGroups });
      }

      default:
        return fail(`Unknown tool "${req.params.name}".`);
    }
  } catch (e) {
    return fail((e as Error).message);
  }
});

// --- resources (latest version, browsable) ----------------------------------

server.setRequestHandler(ListResourcesRequestSchema, async () => {
  if (!latest) return { resources: [] };
  const snap = snapshots.get(latest)!;
  return {
    resources: [
      {
        uri: `kds://${latest}/tokens`,
        name: `Design tokens (v${latest})`,
        mimeType: 'application/json',
      },
      ...snap.components.map((c) => ({
        uri: `kds://${latest}/component/${c.slug}`,
        name: `${c.name} (v${latest})`,
        description: c.description,
        mimeType: 'application/json',
      })),
    ],
  };
});

server.setRequestHandler(ReadResourceRequestSchema, async (req) => {
  const m = req.params.uri.match(/^kds:\/\/([^/]+)\/(tokens|component\/(.+))$/);
  if (!m) throw new Error(`Unsupported resource URI: ${req.params.uri}`);
  const snap = snapshots.get(m[1]);
  if (!snap) throw new Error(`Unknown version in URI: ${m[1]}`);
  const body = m[2] === 'tokens' ? snap.tokens : findComponent(snap, m[3]);
  if (!body) throw new Error(`Resource not found: ${req.params.uri}`);
  return {
    contents: [
      { uri: req.params.uri, mimeType: 'application/json', text: JSON.stringify(body, null, 2) },
    ],
  };
});

// --- start ------------------------------------------------------------------

const transport = new StdioServerTransport();
await server.connect(transport);
// Never log to stdout — it's the JSON-RPC channel. Use stderr.
console.error(
  `koduh-design-system MCP server ready. Versions: ${versions.join(', ') || '(none — run build:metadata)'}. Latest: ${latest ?? 'none'}.`,
);
