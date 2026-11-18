// Live smoke test against https://api.okdata.online using FREE routes only (run after `npm run build`):
//   node test/smoke-free.js
// 1. Any Endpoint > Find against the live catalog (no key, nothing billed).
// 2. A made-up key on Weibo > Get Hot Search: okdata refuses it with 401 unauthorized before
//    anything runs, so no account exists to bill.
// 3. Every curated operation's endpoint still exists, takes the node's fields, and costs no more
//    than the operation's default price cap.
const assert = require('node:assert/strict');

const { Okdata } = require('../dist/nodes/Okdata/Okdata.node.js');
const { OPERATIONS } = require('../dist/nodes/Okdata/shared/operations.js');

const FAKE_KEY = 'okd_smoke_test_not_a_real_key';

async function send(options, headers = {}) {
	const url = new URL(options.url);
	for (const [k, v] of Object.entries(options.qs ?? {})) url.searchParams.set(k, String(v));
	const response = await fetch(url, {
		method: options.method,
		headers: { ...options.headers, ...headers },
	});
	const body = await response.json();
	return options.returnFullResponse ? { statusCode: response.status, body, headers: {} } : body;
}

function context(params) {
	return {
		getInputData: () => [{ json: {} }],
		getNode: () => ({
			name: 'okdata',
			type: 'n8n-nodes-okdata.okdata',
			typeVersion: 1,
			parameters: {},
		}),
		continueOnFail: () => false,
		getNodeParameter: (name, _i, fallback) => (name in params ? params[name] : fallback),
		helpers: {
			httpRequest: (options) => send(options),
			httpRequestWithAuthentication: (_type, options) =>
				send(options, { Authorization: `Bearer ${FAKE_KEY}` }),
		},
	};
}

async function main() {
	const node = new Okdata();
	const [found] = await node.execute.call(
		context({ resource: 'endpoint', operation: 'find', search: '抖音 评论', maxEndpoints: 3 }),
	);
	const ids = found.map((item) => item.json.id);
	assert.ok(ids.includes('douyin.videos.comments.list'), ids.join(', '));
	console.log(`ok  find('抖音 评论') -> ${ids.join(', ')}`);

	await assert.rejects(
		node.execute.call(context({ resource: 'weibo', operation: 'getHotSearch' })),
		(error) => {
			assert.match(error.message, /unauthorized/);
			assert.doesNotMatch(`${error.message} ${error.description}`, new RegExp(FAKE_KEY));
			console.log(`ok  made-up key refused: ${error.message}`);
			return true;
		},
	);

	const catalog = (await send({ method: 'GET', url: 'https://api.okdata.online/v1/catalog' })).data;
	for (const [key, spec] of Object.entries(OPERATIONS)) {
		const endpoint = catalog.endpoints.find((e) => e.id === spec.endpointId);
		assert.ok(endpoint, `${key}: ${spec.endpointId} missing from the live catalog`);
		const accepted = new Set(endpoint.params.map((p) => p.name));
		for (const apiName of [...Object.values(spec.fields), ...Object.values(spec.linkParam ?? {})])
			assert.ok(accepted.has(apiName), `${key}: ${apiName}`);
		assert.ok(
			Number(endpoint.maxCharge) <= Number(spec.maxPrice),
			`${key}: max charge above default cap`,
		);
		console.log(
			`ok  ${key.padEnd(28)} ${spec.endpointId.padEnd(34)} $${endpoint.price}/${endpoint.unit} (cap $${spec.maxPrice})`,
		);
	}
	console.log('live smoke test passed (free routes only)');
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
