// The okdata endpoint catalog and a plain-words search over it, the same idea as okdata's MCP
// `find` tool: Latin words match whole words (or substrings from three letters up), Chinese
// text matches by character pairs, and a few everyday words map to platform ids.

export interface CatalogParam {
	name: string;
	type?: string;
	required?: boolean;
	enum?: unknown[];
	default?: unknown;
	example?: unknown;
	description?: { en?: string; zh?: string };
}

export interface CatalogEndpoint {
	id: string;
	platform: string;
	object?: string;
	method?: string;
	path?: string;
	price?: string;
	maxCharge?: string;
	unit?: string;
	list?: boolean;
	pageSize?: number;
	status?: string;
	paused?: boolean;
	title?: { en?: string; zh?: string };
	summary?: { en?: string; zh?: string };
	aliases?: { en?: string[]; zh?: string[] };
	jobs?: string[];
	params?: CatalogParam[];
}

export interface Catalog {
	revision?: string;
	platforms?: Array<{ id: string; name?: { en?: string; zh?: string } }>;
	endpoints: CatalogEndpoint[];
}

export const SITE_URL = 'https://okdata.online';
export const ENDPOINT_ID = /^[a-z0-9_]+(?:\.[a-z0-9_]+)+$/;

const ALIASES: Readonly<Record<string, readonly string[]>> = {
	twitter: ['x'],
	tweet: ['x', 'post'],
	tweets: ['x', 'post'],
	推特: ['x'],
	rednote: ['xiaohongshu'],
	xhs: ['xiaohongshu'],
	红书: ['xiaohongshu'],
	小红书: ['xiaohongshu'],
	wechat: ['wechat_mp'],
	weixin: ['wechat_mp'],
	微信: ['wechat_mp'],
	公众号: ['wechat_mp'],
	b站: ['bilibili'],
	哔哩哔哩: ['bilibili'],
	yt: ['youtube'],
	油管: ['youtube'],
	trending: ['trend'],
	hot: ['trend'],
	热搜: ['trend'],
	热榜: ['trend'],
	热门: ['trend'],
	subtitles: ['transcript'],
	captions: ['transcript'],
	字幕: ['transcript'],
	profile: ['account'],
	user: ['account'],
	creator: ['account'],
	用户: ['账号'],
	博主: ['账号'],
	粉丝: ['账号'],
	reviews: ['comments'],
	口碑: ['评论'],
};

const CJK = /[㐀-鿿]/;
const SPLIT = /[\s,.;:!?()[\]{}"'“”‘’，。、；：！？（）《》·_/-]+/;

interface Doc {
	endpoint: CatalogEndpoint;
	title: string;
	text: string;
	words: Set<string>;
}

const stem = (word: string): string =>
	word.length > 3 && word.endsWith('s') ? word.slice(0, -1) : word;

function bigrams(run: string): string[] {
	if (run.length <= 2) return [run];
	return Array.from({ length: run.length - 1 }, (_, i) => run.slice(i, i + 2));
}

export function termsOf(query: string): string[] {
	const raw = query.toLowerCase().split(SPLIT).filter(Boolean);
	const expanded = raw.flatMap((word) => [word, ...(ALIASES[word] ?? [])]);
	const terms = expanded.flatMap((word) => {
		if (!CJK.test(word)) return [stem(word)];
		const aliasHits = Object.entries(ALIASES)
			.filter(([key]) => CJK.test(key) && word.includes(key) && key !== word)
			.flatMap(([, values]) => values.map(stem));
		return [...bigrams(word), ...aliasHits];
	});
	return [...new Set(terms)];
}

function docOf(endpoint: CatalogEndpoint, platformNames: Map<string, string[]>): Doc {
	const title = [
		endpoint.title?.en,
		endpoint.title?.zh,
		...(platformNames.get(endpoint.platform) ?? []),
		...(endpoint.aliases?.en ?? []),
		...(endpoint.aliases?.zh ?? []),
	]
		.filter(Boolean)
		.join(' ')
		.toLowerCase();
	const text = [
		endpoint.id.replace(/\./g, ' '),
		endpoint.platform,
		endpoint.object,
		endpoint.summary?.en,
		endpoint.summary?.zh,
		(endpoint.jobs ?? []).join(' ').replace(/-/g, ' '),
		title,
	]
		.filter(Boolean)
		.join(' ')
		.toLowerCase();
	const words = new Set(text.split(SPLIT).filter(Boolean).map(stem));
	return { endpoint, title, text, words };
}

function scoreTerm(doc: Doc, term: string): number {
	const exact = doc.words.has(term) || doc.endpoint.platform === term;
	const partial = !exact && (CJK.test(term) || term.length >= 3) && doc.text.includes(term);
	if (!exact && !partial) return 0;
	const inTitle = doc.title.includes(term) || doc.endpoint.platform === term;
	return (exact ? 2 : 1) + (inTitle ? 2 : 0);
}

/** Endpoints that best match plain words, best first; all of a platform's when only it is given. */
export function findEndpoints(
	catalog: Catalog,
	query: string,
	options: { platform?: string; limit?: number } = {},
): CatalogEndpoint[] {
	const limit = options.limit ?? 5;
	const pool = options.platform
		? catalog.endpoints.filter((e) => e.platform === options.platform)
		: catalog.endpoints;
	const terms = termsOf(query);
	if (terms.length === 0) return options.platform ? pool.slice(0, limit) : [];
	const platformNames = new Map(
		(catalog.platforms ?? []).map((p) => [p.id, [p.name?.en ?? '', p.name?.zh ?? '']]),
	);
	return pool
		.map((endpoint) => {
			const doc = docOf(endpoint, platformNames);
			return { endpoint, score: terms.reduce((sum, term) => sum + scoreTerm(doc, term), 0) };
		})
		.filter((match) => match.score > 0)
		.sort((a, b) => b.score - a.score)
		.slice(0, limit)
		.map((match) => match.endpoint);
}

export function getEndpoint(catalog: Catalog, endpointId: string): CatalogEndpoint | undefined {
	return catalog.endpoints.find((e) => e.id === endpointId);
}

/** Accepts `douyin.videos.search`, `/v1/douyin/videos/search` or a full API URL. */
export function normalizeEndpointId(value: string): string {
	return value
		.trim()
		.replace(/^https?:\/\/[^/]+/, '')
		.replace(/^\/?v1\//, '')
		.split('?')[0]
		.replace(/^\/+|\/+$/g, '')
		.replace(/\//g, '.');
}

export function endpointPath(endpointId: string): string {
	return `/v1/${endpointId.replace(/\./g, '/')}`;
}

export function docsUrl(endpointId: string): string {
	return `${SITE_URL}/apis/${endpointId.replace(/\./g, '/')}/?src=n8n-node`;
}

/** What an agent or a workflow needs to call an endpoint. */
export function describeEndpoint(endpoint: CatalogEndpoint) {
	const params = (endpoint.params ?? [])
		.filter((p) => p.name !== 'view' && p.name !== 'fields')
		.map((p) => ({
			name: p.name,
			type: p.type,
			required: Boolean(p.required),
			...(p.enum ? { enum: p.enum } : {}),
			...(p.default !== undefined ? { default: p.default } : {}),
			...(p.example !== undefined ? { example: p.example } : {}),
			description: p.description?.en ?? '',
		}));
	return {
		id: endpoint.id,
		title: endpoint.title?.en ?? endpoint.id,
		titleZh: endpoint.title?.zh ?? '',
		summary: endpoint.summary?.en ?? '',
		platform: endpoint.platform,
		priceUsd: endpoint.price ?? null,
		unit: endpoint.unit ?? 'call',
		maxChargeUsd: endpoint.maxCharge ?? null,
		list: Boolean(endpoint.list),
		pageSize: endpoint.pageSize ?? null,
		status: endpoint.status ?? null,
		paused: Boolean(endpoint.paused),
		params,
		docs: docsUrl(endpoint.id),
	};
}
