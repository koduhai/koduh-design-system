// Smoke test: spawn the built server over stdio and exercise the tools/resources.
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

const transport = new StdioClientTransport({ command: 'node', args: ['dist/server.js'] });
const client = new Client({ name: 'smoke', version: '0.0.0' }, { capabilities: {} });
await client.connect(transport);

const text = (r) => r.content?.[0]?.text ?? '';
const line = (s, n = 240) => String(s).replace(/\s+/g, ' ').slice(0, n);

const tools = await client.listTools();
console.log('TOOLS:', tools.tools.map((t) => t.name).join(', '));

console.log(
  '\nlist_versions ->',
  line(text(await client.callTool({ name: 'list_versions', arguments: {} }))),
);

console.log(
  '\nlist_components(category="Actions") ->',
  line(
    text(await client.callTool({ name: 'list_components', arguments: { category: 'Actions' } })),
  ),
);

console.log(
  '\nget_component(Button) ->',
  line(text(await client.callTool({ name: 'get_component', arguments: { name: 'Button' } })), 320),
);

console.log(
  '\nget_tokens(group="space") ->',
  line(text(await client.callTool({ name: 'get_tokens', arguments: { group: 'space' } }))),
);

console.log(
  '\nsearch("multiple") ->',
  line(text(await client.callTool({ name: 'search', arguments: { query: 'multiple' } })), 300),
);

const err = await client.callTool({ name: 'get_component', arguments: { name: 'Nope' } });
console.log('\nget_component(Nope) isError:', err.isError, '->', line(text(err)));

const res = await client.listResources();
console.log('\nRESOURCES:', res.resources.length, 'first:', res.resources[0]?.uri);
const read = await client.readResource({
  uri: res.resources.find((r) => r.uri.includes('/component/'))?.uri,
});
console.log('readResource ->', line(read.contents?.[0]?.text));

await client.close();
console.log('\nOK');
