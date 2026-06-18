# @koduhai/design-system MCP server

A Model Context Protocol server that exposes `@koduhai/design-system`'s component
props, design tokens, and usage as queryable tools, **pinned per released
version**. An AI assistant (or any MCP client) can ask for the docs that match
the exact version a project has installed.

## How it works

Metadata is frozen into per-version snapshots under `data/<version>/`:

- `components.json` — every component's category, description, import statement,
  and full props table (name, type, required, default, description). Extracted
  from `docs/FEATURES.md` + each `<Name>Props` interface via the TypeScript
  compiler API. Union-typed prop bags (Select, Combobox, Calendar, Menu) report
  `props: null`.
- `tokens.json` — the design tokens (`primitives`, `tokens`, `themes`) from
  `src/theme/tokens.ts`.
- `index.json` — a small summary.

The server reads these snapshots at startup; every tool takes an optional
`version` and defaults to the latest snapshot present. The snapshot is keyed by
the repo's `package.json` version, so it pins to whatever that release declared.

## Build

```bash
cd mcp
npm install
npm run build:metadata   # snapshot the current source into data/<version>/
npm run build            # compile src/server.ts -> dist/server.js
npm run start            # run the server over stdio (or: npm run dev)
```

Re-run `build:metadata` after any prop/token change, and before publishing a new
version, so the snapshot stays accurate. Snapshots are committed (they are the
versioned product); `dist/` and `node_modules/` are not.

## Tools

| Tool              | Args                    | Returns                                                                                                   |
| ----------------- | ----------------------- | --------------------------------------------------------------------------------------------------------- |
| `list_versions`   | —                       | available snapshot versions + which is latest                                                             |
| `list_components` | `version?`, `category?` | name/slug/category/description per component                                                              |
| `get_component`   | `name`, `version?`      | full docs for one component (props table, import, etc.); accepts name or slug                             |
| `get_tokens`      | `version?`, `group?`    | token group names + theme names; with `group` (e.g. `space`, `fontSize`, `primitives`, `dark`) the values |
| `search`          | `query`, `version?`     | components matching name/description/category/prop, plus matching token groups                            |

It also exposes **resources** for the latest version: `kds://<version>/tokens`
and `kds://<version>/component/<slug>`.

## Use with Claude Code

```bash
claude mcp add koduh-design-system -- node /absolute/path/to/mcp/dist/server.js
```

Or add it to your MCP config JSON:

```json
{
  "mcpServers": {
    "koduh-design-system": {
      "command": "node",
      "args": ["C:/dev/koduhai/koduh-design-system/mcp/dist/server.js"]
    }
  }
}
```

(The server writes only JSON-RPC to stdout; its ready banner goes to stderr.)

## Smoke test

```bash
node scripts/smoke.mjs   # spawns the built server and exercises every tool + a resource
```
