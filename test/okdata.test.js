// Unit tests for the built node (run `npm test`, which builds first). HTTP is mocked: no network.
const { test, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { Okdata } = require('../dist/nodes/Okdata/Okdata.node.js');
const { OkdataApi } = require('../dist/credentials/OkdataApi.credentials.js');
const transport = require('../dist/nodes/Okdata/shared/transport.js');
const ids = require('../dist/nodes/Okdata/shared/ids.js');
const { OPERATIONS } = require('../dist/nodes/Okdata/shared/operations.js');

const CATALOG = JSON.parse(
	fs.readFileSync(path.join(__dirname, 'fixtures', 'catalog.json'), 'utf8'),
);

function ok(data, page, amount = '0.002') {
	return {
		code: 'ok',
		request_id: 'r-1',
		data,
		...(page ? { page } : {}),
		meta: {
			result_status: 'complete',
			billing: { amount, currency: 'USD', balance_after: '4.99' },
		},
	};
}

/** A minimal IExecuteFunctions: parameters per item, recorded requests, scripted answers. */
function context(params, answer, { continueOnFail = false } = {}) {
	const calls = { auth: [], free: [] };
	const ctx = {
		getInputData: () => [{ json: {} }],
		getNode: () => ({
			name: 'okdata',
			type: 'n8n-nodes-okdata.okdata',
			typeVersion: 1,
			parameters: {},
		}),
		continueOnFail: () => continueOnFail,
		getNodeParameter(name, _i, fallback, options) {
			const value = name in params ? params[name] : fallback;
			if (options && options.extractValue && value && typeof value === 'object') return value.value;
			return value;
		},
		helpers: {
			async httpRequestWithAuthentication(credentialType, options) {
				calls.auth.push({ credentialType, options });
				const [statusCode, body] = answer(options, calls.auth.length);
				return { statusCode, body, headers: {} };
			},
			async httpRequest(options) {
				calls.free.push(options);
				return CATALOG;
			},
		},
	};
	return { ctx, calls };
}

async function run(params, answer, extra) {
	const node = new Okdata();
	const { ctx, calls } = context(params, answer, extra);
	const [out] = await node.execute.call(ctx);
	return { out, calls };
}

beforeEach(() => transport.clearCatalogCache());

const CURATED = {
	'tiktok:searchVideos': [
		{ query: 'ai agents', tiktokSort: 'latest' },
		'/v1/tiktok/videos/search',
		{ query: 'ai agents', sort: 'latest' },
	],
	'tiktok:getVideoComments': [
		{ tiktokVideoId: 'https://www.tiktok.com/@nasa/video/7305085486984858894?lang=en' },
		'/v1/tiktok/videos/comments/list',
		{ id: '7305085486984858894' },
	],
	'youtube:searchVideos': [
		{ query: 'n8n tutorial', youtubeSort: 'most_viewed' },
		'/v1/youtube/videos/search',
		{ query: 'n8n tutorial', sort: 'most_viewed' },
	],
	'youtube:getVideoComments': [
		{ youtubeVideoId: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', youtubeCommentSort: 'latest' },
		'/v1/youtube/videos/comments/list',
		{ id: 'dQw4w9WgXcQ', sort: 'latest' },
	],
	'instagram:getProfile': [
		{ instagramUsername: '@nasa' },
		'/v1/instagram/users/get',
		{ username: '@nasa' },
	],
	'instagram:getPosts': [
		{ instagramUsername: 'nasa', instagramPostType: 'reel' },
		'/v1/instagram/users/posts/list',
		{ username: 'nasa', type: 'reel' },
	],
	'instagram:getPostComments': [
		{ instagramPostId: 'DeCPVhERA8e' },
		'/v1/instagram/posts/comments/list',
		{ id: 'DeCPVhERA8e' },
	],
	'reddit:searchPosts': [
		{ query: 'saturn rings', redditSort: 'popular', redditPublishedWithin: 'week' },
		'/v1/reddit/posts/search',
		{ query: 'saturn rings', sort: 'popular', published_within: 'week' },
	],
	'reddit:getPostComments': [
		{ redditPostId: 't3_1nnrvkr', redditCommentSort: 'best' },
		'/v1/reddit/posts/comments/list',
		{ id: 't3_1nnrvkr', sort: 'best' },
	],
	'amazon:searchProducts': [
		{ query: 'portable espresso maker', amazonCountry: 'GB', amazonSort: 'best_sellers' },
		'/v1/amazon/products/search',
		{ query: 'portable espresso maker', country: 'GB', sort: 'best_sellers' },
	],
	'amazon:getProductReviews': [
		{
			amazonAsin: 'https://www.amazon.com/Some-Product/dp/B0GTS6KPPB/ref=sr_1_1',
			amazonCountry: 'US',
		},
		'/v1/amazon/products/reviews/list',
		{ id: 'B0GTS6KPPB', country: 'US' },
	],
	'xiaohongshu:searchNotes': [
		{ query: '防晒霜', xiaohongshuSort: 'popular', noteType: 'image' },
		'/v1/xiaohongshu/notes/search',
		{ query: '防晒霜', sort: 'popular', type: 'image' },
	],
	'xiaohongshu:getNoteComments': [
		{ noteId: 'https://www.xiaohongshu.com/explore/6650a1b2000000001e00abcd?x=1' },
		'/v1/xiaohongshu/notes/comments/list',
		{ id: '6650a1b2000000001e00abcd' },
	],
	'douyin:searchVideos': [
		{ query: '露营装备', douyinSort: 'relevance' },
		'/v1/douyin/videos/search',
		{ query: '露营装备', sort: 'relevance' },
	],
	'douyin:getVideoComments': [
		{ douyinVideoId: 'https://www.douyin.com/video/7301234567890123456' },
		'/v1/douyin/videos/comments/list',
		{ id: '7301234567890123456' },
	],
	'douyin:getHotSearch': [{}, '/v1/douyin/trends/list', {}],
	'weibo:getHotSearch': [{}, '/v1/weibo/trends/list', {}],
	'wechat:searchArticles': [
		{ query: '咖啡店开业', wechatSort: 'latest', publishedWithin: '', resultType: 'article' },
		'/v1/wechat/posts/search',
		{ query: '咖啡店开业', sort: 'latest', type: 'article' },
	],
	'wechat:getAccountArticles': [
		{ accountId: 'gh_363b924965e9', tab: 'articles' },
		'/v1/wechat_mp/accounts/articles/list',
		{ id: 'gh_363b924965e9', tab: 'articles' },
	],
	'wechat:getArticleStats': [
		{ articleUrl: 'https://mp.weixin.qq.com/s/abc' },
		'/v1/wechat_mp/articles/metrics',
		{ url: 'https://mp.weixin.qq.com/s/abc' },
	],
	'x:searchPosts': [
		{ query: 'from:n8n_io', xSort: 'top' },
		'/v1/x/posts/search',
		{ query: 'from:n8n_io', sort: 'top' },
	],
	'youtube:getTranscript': [
		{ youtubeVideoId: 'https://youtu.be/dQw4w9WgXcQ', language: 'en' },
		'/v1/youtube/videos/transcript/get',
		{ id: 'dQw4w9WgXcQ', lang: 'en' },
	],
};

test('every curated operation has a test case', () => {
	assert.deepEqual(Object.keys(CURATED).sort(), Object.keys(OPERATIONS).sort());
});

for (const [key, [fields, pathName, query]] of Object.entries(CURATED)) {
	test(`${key} calls ${pathName}`, async () => {
		const [resource, operation] = key.split(':');
		const spec = OPERATIONS[key];
		const data = spec.list ? { items: [{ id: 'a' }, { id: 'b' }] } : { item: { id: 'a' } };
		const { out, calls } = await run({ resource, operation, ...fields }, () => [200, ok(data)]);
		assert.equal(calls.auth.length, 1);
		const { credentialType, options } = calls.auth[0];
		assert.equal(credentialType, 'okdataApi');
		assert.equal(options.url, `https://api.okdata.online${pathName}`);
		assert.deepEqual(options.qs, query);
		assert.equal(options.headers['X-Source'], 'n8n');
		assert.equal(options.headers['X-Max-Price'], spec.maxPrice);
		assert.equal(out.length, spec.list ? 2 : 1);
		assert.deepEqual(out[0].pairedItem, { item: 0 });
	});
}

test('max pages follows next_cursor and stops when there are no more', async () => {
	const answer = (options, n) => [
		200,
		ok({ items: [{ id: `p${n}` }] }, { has_more: n < 2, next_cursor: n < 2 ? `c${n}` : null }),
	];
	const { out, calls } = await run(
		{ resource: 'tiktok', operation: 'searchVideos', query: 'a', maxPages: 5 },
		answer,
	);
	assert.equal(calls.auth.length, 2);
	assert.equal(calls.auth[1].options.qs.cursor, 'c1');
	assert.deepEqual(
		out.map((o) => o.json.id),
		['p1', 'p2'],
	);
});

test('paging stops when the cursor does not move or a page is empty', async () => {
	const stuck = () => [200, ok({ items: [{ id: 'x' }] }, { has_more: true, next_cursor: 'same' })];
	const first = await run(
		{
			resource: 'x',
			operation: 'searchPosts',
			query: 'a',
			maxPages: 5,
			options: { cursor: 'same' },
		},
		stuck,
	);
	assert.equal(first.calls.auth.length, 1);
	const empty = () => [200, ok({ items: [] }, { has_more: true, next_cursor: 'c2' })];
	const second = await run(
		{ resource: 'x', operation: 'searchPosts', query: 'a', maxPages: 5 },
		empty,
	);
	assert.equal(second.calls.auth.length, 1);
});

test('a failing later page keeps the pages already fetched', async () => {
	const answer = (options, n) =>
		n === 1
			? [200, ok({ items: [{ id: 'p1' }] }, { has_more: true, next_cursor: 'c1' })]
			: [503, { code: 'upstream_busy', message: 'Busy', charged: false }];
	const plain = await run(
		{ resource: 'tiktok', operation: 'searchVideos', query: 'a', maxPages: 3 },
		answer,
	);
	assert.deepEqual(
		plain.out.map((o) => o.json.id),
		['p1'],
	);
	const tolerant = await run(
		{ resource: 'tiktok', operation: 'searchVideos', query: 'a', maxPages: 3 },
		answer,
		{ continueOnFail: true },
	);
	assert.equal(tolerant.out.length, 2);
	assert.equal(tolerant.out[1].json.pagesFetched, 1);
});

test('call: an answer without items or item is kept whole', async () => {
	const params = {
		resource: 'endpoint',
		operation: 'call',
		endpointId: { mode: 'id', value: 'weibo.trends.list' },
	};
	const { out } = await run(params, () => [200, ok({ summary: 'x' })]);
	assert.deepEqual(out[0].json, { summary: 'x' });
});

test('requests never follow redirects', async () => {
	const { calls } = await run({ resource: 'weibo', operation: 'getHotSearch' }, () => [
		200,
		ok({ items: [] }),
	]);
	assert.equal(calls.auth[0].options.disableFollowRedirect, true);
});

test('options: simplify, fields, cursor, max price and raw response', async () => {
	const params = {
		resource: 'x',
		operation: 'searchPosts',
		query: 'a',
		simplify: true,
		options: { fields: 'id,text', cursor: 'c9', maxPrice: 0.005, rawResponse: true },
	};
	const { out, calls } = await run(params, () => [
		200,
		ok({ items: [{ id: '1' }] }, { has_more: true, next_cursor: 'c10' }),
	]);
	const { options } = calls.auth[0];
	assert.deepEqual(options.qs, { query: 'a', view: 'compact', fields: 'id,text', cursor: 'c9' });
	assert.equal(options.qs.view, 'compact');
	assert.equal(options.qs.fields, 'id,text');
	assert.equal(options.qs.cursor, 'c9');
	assert.equal(options.headers['X-Max-Price'], '0.005');
	assert.equal(out.length, 1);
	assert.equal(out[0].json.page.next_cursor, 'c10');
	assert.equal(out[0].json.meta.billing.amount, '0.002');
});

test('a pasted link goes to the url parameter where the endpoint takes one', async () => {
	const cases = [
		[
			{
				resource: 'instagram',
				operation: 'getPostComments',
				instagramPostId: ' https://www.instagram.com/reel/DeCPVhERA8e/ ',
			},
			{ url: 'https://www.instagram.com/reel/DeCPVhERA8e/' },
		],
		[
			{
				resource: 'reddit',
				operation: 'getPostComments',
				redditPostId: 'www.reddit.com/r/nasa/s/AbCdEf',
				redditCommentSort: 'latest',
			},
			{ url: 'www.reddit.com/r/nasa/s/AbCdEf', sort: 'latest' },
		],
	];
	for (const [params, query] of cases) {
		const { calls } = await run(params, () => [200, ok({ items: [] })]);
		assert.deepEqual(calls.auth[0].options.qs, query);
	}
});

test('max pages follows next_cursor on the new list operations too', async () => {
	const answer = (options, n) => [
		200,
		ok({ items: [{ id: `p${n}` }] }, { has_more: n < 3, next_cursor: n < 3 ? `c${n}` : null }),
	];
	const { out, calls } = await run(
		{ resource: 'reddit', operation: 'searchPosts', query: 'a', maxPages: 5 },
		answer,
	);
	assert.equal(calls.auth.length, 3);
	assert.equal(calls.auth[2].options.qs.cursor, 'c2');
	assert.equal(calls.auth[2].options.headers['X-Max-Price'], '0.01');
	assert.equal(out.length, 3);
});

test('a single-object operation makes one call and returns one item', async () => {
	const { out, calls } = await run(
		{ resource: 'instagram', operation: 'getProfile', instagramUsername: 'nasa', maxPages: 5 },
		() => [
			200,
			ok({ item: { username: 'nasa', followers: 1 } }, { has_more: true, next_cursor: 'c1' }),
		],
	);
	assert.equal(calls.auth.length, 1);
	assert.deepEqual(out[0].json, { username: 'nasa', followers: 1 });
});

test('okdata answers that are not ok become node errors with details and request ID', async () => {
	const body = {
		code: 'insufficient_balance',
		message: 'Not enough balance for this call',
		charged: false,
		request_id: 'r-err',
		problems: ['Needs 0.02'],
		next_step: 'Top up in the console.',
	};
	await assert.rejects(
		run({ resource: 'weibo', operation: 'getHotSearch' }, () => [402, body]),
		(error) => {
			assert.match(error.message, /insufficient_balance/);
			assert.doesNotMatch(error.message, /\berror\b/i);
			assert.doesNotMatch(error.description, /bill/i);
			assert.match(error.description, /Details: Needs 0\.02/);
			assert.match(error.description, /Top up in the console\./);
			assert.match(error.description, /r-err/);
			return true;
		},
	);
});

test('an answer that is not JSON points to the console', async () => {
	await assert.rejects(
		run({ resource: 'weibo', operation: 'getHotSearch' }, () => [502, 'Bad gateway']),
		(error) => {
			assert.match(error.message, /not JSON/);
			assert.match(error.description, /okdata console/);
			return true;
		},
	);
});

test('continue on fail returns the error as an item', async () => {
	const { out } = await run(
		{ resource: 'weibo', operation: 'getHotSearch' },
		() => [401, { code: 'unauthorized', message: 'No credential', charged: false }],
		{ continueOnFail: true },
	);
	assert.equal(out.length, 1);
	assert.match(out[0].json.error, /unauthorized/);
});

test('find is free: it reads the catalog without the key', async () => {
	const { out, calls } = await run(
		{ resource: 'endpoint', operation: 'find', search: '抖音 评论', maxEndpoints: 3 },
		() => {
			throw new Error('no paid call expected');
		},
	);
	assert.equal(calls.auth.length, 0);
	assert.equal(calls.free.length, 1);
	assert.equal(calls.free[0].url, 'https://api.okdata.online/v1/catalog');
	assert.equal(calls.free[0].headers.Authorization, undefined);
	assert.equal(out[0].json.id, 'douyin.videos.comments.list');
	assert.match(out[0].json.docs, /okdata\.online\/apis\/douyin\/videos\/comments\/list\//);
});

test('call: any endpoint by id with JSON parameters; max_price in JSON is ignored', async () => {
	const params = {
		resource: 'endpoint',
		operation: 'call',
		endpointId: { mode: 'list', value: 'bilibili.trends.list' },
		parameters: '{"max_price": "50"}',
	};
	const { out, calls } = await run(params, () => [
		200,
		ok({ items: [{ rank: 1, name: 'topic' }] }),
	]);
	const { options } = calls.auth[0];
	assert.equal(options.url, 'https://api.okdata.online/v1/bilibili/trends/list');
	assert.deepEqual(options.qs, {});
	assert.equal(options.headers['X-Max-Price'], '0.1');
	assert.equal(out[0].json.name, 'topic');
});

test('call: unknown endpoint suggests close ones and makes no paid call', async () => {
	const params = {
		resource: 'endpoint',
		operation: 'call',
		endpointId: { mode: 'id', value: 'douyin.video.comments' },
	};
	await assert.rejects(
		run(params, () => [200, ok({})]),
		(error) => {
			assert.match(error.message, /No okdata endpoint/);
			assert.match(error.description, /douyin\.videos\.comments\.list/);
			return true;
		},
	);
});

test('call: parameters the endpoint does not take are refused before any paid call', async () => {
	const params = {
		resource: 'endpoint',
		operation: 'call',
		endpointId: { mode: 'id', value: 'x.posts.search' },
		parameters: '{"query": "a", "Max_Price": 9}',
	};
	let paid = 0;
	await assert.rejects(
		run(params, () => {
			paid++;
			return [200, ok({})];
		}),
		/does not take Max_Price/,
	);
	assert.equal(paid, 0);
});

test('call: bad JSON and non-scalar values are refused', async () => {
	for (const raw of ['{bad', '[1]', '{"a": {"b": 1}}']) {
		const params = {
			resource: 'endpoint',
			operation: 'call',
			endpointId: { mode: 'id', value: 'x.posts.search' },
			parameters: raw,
		};
		await assert.rejects(run(params, () => [200, ok({})]));
	}
});

test('transport refuses paths outside the okdata API', async () => {
	const { ctx, calls } = context({}, () => [200, ok({})]);
	for (const bad of ['https://example.com/v1/a', '/v1/../internal', '/internal/x']) {
		await assert.rejects(
			transport.okdataRequest.call(ctx, 'GET', bad, {}, undefined, 0),
			/not an okdata API path/,
		);
	}
	assert.equal(calls.auth.length, 0);
});

test('max price normalization', () => {
	assert.equal(transport.normalizeMaxPrice(0.05), '0.05');
	assert.equal(transport.normalizeMaxPrice('$1'), '1');
	assert.equal(transport.normalizeMaxPrice(undefined), undefined);
	assert.throws(() => transport.normalizeMaxPrice(-1));
	assert.throws(() => transport.normalizeMaxPrice(1000));
});

test('id clean-up', () => {
	assert.equal(
		ids.youtubeVideoId('https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=1'),
		'dQw4w9WgXcQ',
	);
	assert.equal(ids.douyinVideoId('https://v.douyin.com/abc/'), 'https://v.douyin.com/abc/');
	assert.equal(ids.xiaohongshuNoteId(' 6650a1b2000000001e00abcd '), '6650a1b2000000001e00abcd');
	assert.equal(
		ids.tiktokVideoId('https://www.tiktok.com/@nasa/video/7305085486984858894'),
		'7305085486984858894',
	);
	assert.equal(ids.tiktokVideoId('https://vm.tiktok.com/abc/'), 'https://vm.tiktok.com/abc/');
	assert.equal(ids.amazonAsin('https://www.amazon.co.uk/dp/B0GTS6KPPB?th=1'), 'B0GTS6KPPB');
	assert.equal(ids.amazonAsin('https://www.amazon.com/gp/product/B0GTS6KPPB'), 'B0GTS6KPPB');
	assert.equal(ids.amazonAsin(' B0GTS6KPPB '), 'B0GTS6KPPB');
	assert.ok(ids.LINK.test('https://redd.it/1nnrvkr'));
	assert.ok(ids.LINK.test('instagram.com/p/DeCPVhERA8e/'));
	assert.ok(!ids.LINK.test('t3_1nnrvkr'));
	assert.ok(!ids.LINK.test('DeCPVhERA8e'));
});

test('list search offers catalog endpoints with price and docs link', async () => {
	const node = new Okdata();
	const { ctx } = context({}, () => [200, ok({})]);
	const { results } = await node.methods.listSearch.searchEndpoints.call(ctx, 'weibo hot');
	assert.equal(results[0].value, 'weibo.trends.list');
	assert.match(results[0].name, /\$0\.002 per call/);
	assert.match(results[0].url, /apis\/weibo\/trends\/list/);
});

test('credential: bearer header and a free test request', () => {
	const credential = new OkdataApi();
	assert.equal(credential.name, 'okdataApi');
	assert.equal(credential.properties[0].typeOptions.password, true);
	assert.equal(
		credential.authenticate.properties.headers.Authorization,
		'=Bearer {{$credentials.apiKey}}',
	);
	assert.equal(credential.test.request.url, '/v1/account');
});

test('every operation default cap covers the endpoint max charge in the catalog', () => {
	for (const spec of Object.values(OPERATIONS)) {
		const endpoint = CATALOG.data.endpoints.find((e) => e.id === spec.endpointId);
		assert.ok(endpoint, spec.endpointId);
		assert.ok(Number(endpoint.maxCharge) <= Number(spec.maxPrice), spec.endpointId);
		const accepted = new Set(endpoint.params.map((p) => p.name));
		for (const apiName of [...Object.values(spec.fields), ...Object.values(spec.linkParam ?? {})])
			assert.ok(accepted.has(apiName), `${spec.endpointId} ${apiName}`);
	}
});

test('every node option for an API parameter is a value the catalog accepts', () => {
	const { properties } = require('../dist/nodes/Okdata/descriptions.js');
	for (const spec of Object.values(OPERATIONS)) {
		const endpoint = CATALOG.data.endpoints.find((e) => e.id === spec.endpointId);
		for (const [field, apiName] of Object.entries(spec.fields)) {
			const param = endpoint.params.find((p) => p.name === apiName);
			const prop = properties.find((p) => p.name === field);
			assert.ok(prop, field);
			if (prop.type !== 'options' || !param.enum) continue;
			for (const option of prop.options) {
				if (option.value === '') continue;
				assert.ok(
					param.enum.includes(option.value),
					`${spec.endpointId} ${apiName}=${option.value}`,
				);
			}
		}
	}
});

test('the resource list puts the English-first platforms first', () => {
	const { properties } = require('../dist/nodes/Okdata/descriptions.js');
	const resource = properties.find((p) => p.name === 'resource');
	assert.deepEqual(
		resource.options.map((o) => o.value),
		[
			'tiktok',
			'youtube',
			'instagram',
			'x',
			'reddit',
			'amazon',
			'xiaohongshu',
			'douyin',
			'wechat',
			'weibo',
			'endpoint',
		],
	);
});
