import type {
	IDataObject,
	IExecuteFunctions,
	IHttpRequestOptions,
	ILoadOptionsFunctions,
	JsonObject,
} from 'n8n-workflow';
import { NodeApiError, NodeOperationError } from 'n8n-workflow';

import type { Catalog } from './catalog';

export const BASE_URL = 'https://api.okdata.online';
export const CREDENTIAL_TYPE = 'okdataApi';
export const SOURCE_LABEL = 'n8n';
const TIMEOUT_MS = 60_000;
const CATALOG_CACHE_MS = 10 * 60_000;
const API_PATH = /^\/v1\/[a-z0-9_/]+$/;
const MAX_PRICE_CEILING = 100;

export interface Page {
	next_cursor?: string | null;
	has_more?: boolean;
	returned?: number;
}

export interface Envelope extends IDataObject {
	code: string;
	request_id?: string;
	data?: IDataObject;
	page?: Page;
	meta?: IDataObject;
	warnings?: unknown[];
}

interface FullResponse {
	body: unknown;
	statusCode: number;
}

let catalogCache: { at: number; catalog: Catalog } | undefined;

function billedSentence(charged: unknown): string {
	if (charged === false) return 'Nothing was billed.';
	if (charged === true) return 'This call was billed.';
	return 'Whether this call was billed is not known yet; look it up by request ID in the okdata console.';
}

/** The description n8n shows under an okdata error: problems, what to do, billing, request ID. */
export function errorDescription(body: IDataObject): string {
	const parts: string[] = [];
	const problems = Array.isArray(body.problems) ? body.problems.map(String) : [];
	if (problems.length) parts.push(`Problems: ${problems.join('; ')}`);
	if (typeof body.next_step === 'string') parts.push(body.next_step);
	parts.push(billedSentence('charged' in body ? body.charged : undefined));
	if (typeof body.request_id === 'string') parts.push(`Request ID: ${body.request_id}.`);
	if (typeof body.docs_url === 'string') parts.push(`Docs: ${body.docs_url}`);
	return parts.join(' ');
}

/** A price cap in US dollars as a plain decimal string, or undefined for none. */
export function normalizeMaxPrice(value: unknown): string | undefined {
	if (value === undefined || value === null || value === '' || value === 0) return undefined;
	const amount =
		typeof value === 'number' ? value : Number(String(value).trim().replace(/^\$/, ''));
	if (!Number.isFinite(amount) || amount <= 0 || amount > MAX_PRICE_CEILING) {
		throw new Error(`Max price must be above 0 and at most ${MAX_PRICE_CEILING} US dollars`);
	}
	return String(Number(amount.toFixed(6)));
}

function queryValue(value: unknown): string {
	if (Array.isArray(value)) return value.map(queryValue).join(',');
	if (typeof value === 'boolean') return value ? 'true' : 'false';
	return String(value);
}

/** Drops unset values so an empty optional field is never sent. */
export function cleanParams(params: IDataObject): IDataObject {
	const out: IDataObject = {};
	for (const [name, value] of Object.entries(params)) {
		if (value === undefined || value === null) continue;
		if (typeof value === 'string' && value.trim() === '') continue;
		out[name] = value;
	}
	return out;
}

function toQuery(params: IDataObject): IDataObject {
	const out: IDataObject = {};
	for (const [name, value] of Object.entries(cleanParams(params))) out[name] = queryValue(value);
	return out;
}

/**
 * One okdata data call. Only relative /v1/ paths on api.okdata.online are sent, with the key from
 * the okdataApi credential, the caller's price cap in X-Max-Price and X-Source: n8n.
 */
export async function okdataRequest(
	this: IExecuteFunctions,
	method: 'GET' | 'POST',
	path: string,
	params: IDataObject,
	maxPrice: string | undefined,
	itemIndex: number,
): Promise<Envelope> {
	if (!API_PATH.test(path) || path.includes('..')) {
		throw new NodeOperationError(
			this.getNode(),
			`Refused to call ${path}: not an okdata API path`,
			{
				itemIndex,
			},
		);
	}
	const headers: IDataObject = { Accept: 'application/json', 'X-Source': SOURCE_LABEL };
	if (maxPrice) headers['X-Max-Price'] = maxPrice;
	const options: IHttpRequestOptions = {
		method,
		url: `${BASE_URL}${path}`,
		headers,
		json: true,
		returnFullResponse: true,
		ignoreHttpStatusErrors: true,
		timeout: TIMEOUT_MS,
	};
	if (method === 'GET') options.qs = toQuery(params);
	else options.body = cleanParams(params);

	let response: FullResponse;
	try {
		response = (await this.helpers.httpRequestWithAuthentication.call(
			this,
			CREDENTIAL_TYPE,
			options,
		)) as FullResponse;
	} catch (error) {
		throw new NodeApiError(this.getNode(), error as JsonObject, {
			itemIndex,
			message: 'The answer from api.okdata.online did not arrive',
			description:
				'The call may still finish. Check Calls in the okdata console before running it again.',
		});
	}
	return checkResponse.call(this, response, itemIndex);
}

function checkResponse(
	this: IExecuteFunctions,
	response: FullResponse,
	itemIndex: number,
): Envelope {
	const body = response.body;
	const ok = response.statusCode >= 200 && response.statusCode < 300;
	if (body && typeof body === 'object' && !Array.isArray(body)) {
		const envelope = body as Envelope;
		if (ok && envelope.code === 'ok') return envelope;
		const code = typeof envelope.code === 'string' ? envelope.code : 'error';
		const message = typeof envelope.message === 'string' ? envelope.message : 'The request failed';
		throw new NodeApiError(this.getNode(), envelope as JsonObject, {
			itemIndex,
			httpCode: String(response.statusCode),
			message: `okdata error ${code}: ${message}`,
			description: errorDescription(envelope),
		});
	}
	throw new NodeApiError(this.getNode(), { body: String(body ?? '') } as JsonObject, {
		itemIndex,
		httpCode: String(response.statusCode),
		message: 'okdata answered with something that is not JSON',
		description: billedSentence(undefined),
	});
}

/** GET /v1/catalog: free and sent without the key. Kept in memory for ten minutes. */
export async function fetchCatalog(
	this: IExecuteFunctions | ILoadOptionsFunctions,
): Promise<Catalog> {
	const now = Date.now();
	if (catalogCache && now - catalogCache.at < CATALOG_CACHE_MS) return catalogCache.catalog;
	const body = (await this.helpers.httpRequest({
		method: 'GET',
		url: `${BASE_URL}/v1/catalog`,
		headers: { Accept: 'application/json', 'X-Source': SOURCE_LABEL },
		json: true,
		timeout: TIMEOUT_MS,
	})) as { code?: string; data?: Catalog };
	const catalog = body?.data;
	if (body?.code !== 'ok' || !catalog || !Array.isArray(catalog.endpoints)) {
		throw new NodeOperationError(this.getNode(), 'The okdata catalog came back without endpoints');
	}
	catalogCache = { at: now, catalog };
	return catalog;
}

/** For tests. */
export function clearCatalogCache(): void {
	catalogCache = undefined;
}
