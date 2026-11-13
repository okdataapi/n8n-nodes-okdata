import type {
	IDataObject,
	IExecuteFunctions,
	ILoadOptionsFunctions,
	INodeExecutionData,
	INodeListSearchResult,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeApiError, NodeConnectionTypes, NodeOperationError } from 'n8n-workflow';

import { properties } from './descriptions';
import {
	describeEndpoint,
	docsUrl,
	endpointPath,
	ENDPOINT_ID,
	findEndpoints,
	getEndpoint,
	normalizeEndpointId,
} from './shared/catalog';
import {
	CALL_ENDPOINT_MAX_PRICE,
	MAX_PAGES_CEILING,
	OPERATIONS,
	type OperationSpec,
} from './shared/operations';
import { type Envelope, fetchCatalog, normalizeMaxPrice, okdataRequest } from './shared/transport';

interface OutputOptions {
	cursor?: string;
	fields?: string;
	maxPrice?: number;
	rawResponse?: boolean;
}

const FREE_FORM_PARAMS = new Set(['cursor', 'view', 'fields']);

function resultsOf(envelope: Envelope): IDataObject[] {
	const data = envelope.data ?? {};
	if (Array.isArray(data.items)) return data.items as IDataObject[];
	if (data.item && typeof data.item === 'object') return [data.item as IDataObject];
	return [];
}

function toItems(rows: IDataObject[], itemIndex: number): INodeExecutionData[] {
	return rows.map((json) => ({ json, pairedItem: { item: itemIndex } }));
}

/** Common API parameters: view and fields. */
function viewParams(simplify: boolean, options: OutputOptions): IDataObject {
	return {
		...(simplify ? { view: 'compact' } : {}),
		...(options.fields ? { fields: options.fields } : {}),
	};
}

function parseJsonParams(this: IExecuteFunctions, raw: unknown, itemIndex: number): IDataObject {
	let parsed: unknown = raw;
	if (typeof raw === 'string') {
		const text = raw.trim();
		if (!text) return {};
		try {
			parsed = JSON.parse(text);
		} catch {
			throw new NodeOperationError(
				this.getNode(),
				'Parameters must be a JSON object, e.g. {"query": "coffee"}',
				{
					itemIndex,
				},
			);
		}
	}
	if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
		throw new NodeOperationError(
			this.getNode(),
			'Parameters must be a JSON object, e.g. {"query": "coffee"}',
			{
				itemIndex,
			},
		);
	}
	const scalar = (v: unknown) =>
		typeof v === 'string' ||
		typeof v === 'boolean' ||
		(typeof v === 'number' && Number.isFinite(v));
	for (const [name, value] of Object.entries(parsed as IDataObject)) {
		const ok = value === null || scalar(value) || (Array.isArray(value) && value.every(scalar));
		if (!ok) {
			throw new NodeOperationError(
				this.getNode(),
				`Parameter ${name} must be a string, number, true/false or a list of those`,
				{ itemIndex },
			);
		}
	}
	return parsed as IDataObject;
}

function maxPriceOf(
	this: IExecuteFunctions,
	options: OutputOptions,
	fallback: string,
	itemIndex: number,
): string {
	try {
		return normalizeMaxPrice(options.maxPrice) ?? fallback;
	} catch (error) {
		throw new NodeOperationError(this.getNode(), (error as Error).message, { itemIndex });
	}
}

async function runCurated(
	this: IExecuteFunctions,
	spec: OperationSpec,
	itemIndex: number,
): Promise<INodeExecutionData[]> {
	const options = this.getNodeParameter('options', itemIndex, {}) as OutputOptions;
	const simplify = this.getNodeParameter('simplify', itemIndex, false) as boolean;
	const maxPrice = maxPriceOf.call(this, options, spec.maxPrice, itemIndex);
	const params: IDataObject = viewParams(simplify, options);
	for (const [field, apiName] of Object.entries(spec.fields)) {
		const value = this.getNodeParameter(field, itemIndex, '') as string | number | boolean;
		const clean = spec.clean?.[apiName];
		params[apiName] = clean && typeof value === 'string' ? clean(value) : value;
	}
	const path = endpointPath(spec.endpointId);
	const pagedOperation = spec.list && Object.keys(spec.fields).length > 0;
	const maxPages = pagedOperation
		? Math.min(
				MAX_PAGES_CEILING,
				Math.max(1, Number(this.getNodeParameter('maxPages', itemIndex, 1)) || 1),
			)
		: 1;

	const out: INodeExecutionData[] = [];
	let cursor = options.cursor?.trim() || undefined;
	for (let page = 0; page < maxPages; page++) {
		const envelope = await okdataRequest.call(
			this,
			'GET',
			path,
			{ ...params, cursor },
			maxPrice,
			itemIndex,
		);
		out.push(...toItems(options.rawResponse ? [envelope] : resultsOf(envelope), itemIndex));
		const next = envelope.page?.next_cursor;
		if (!envelope.page?.has_more || !next) break;
		cursor = next;
	}
	return out;
}

async function runCall(this: IExecuteFunctions, itemIndex: number): Promise<INodeExecutionData[]> {
	const options = this.getNodeParameter('options', itemIndex, {}) as OutputOptions;
	const simplify = this.getNodeParameter('simplify', itemIndex, false) as boolean;
	const maxPrice = maxPriceOf.call(this, options, CALL_ENDPOINT_MAX_PRICE, itemIndex);
	const rawId = this.getNodeParameter('endpointId', itemIndex, '', {
		extractValue: true,
	}) as string;
	const endpointId = normalizeEndpointId(String(rawId));
	if (!ENDPOINT_ID.test(endpointId)) {
		throw new NodeOperationError(this.getNode(), `"${rawId}" is not an okdata endpoint ID`, {
			itemIndex,
		});
	}
	const json = parseJsonParams.call(
		this,
		this.getNodeParameter('parameters', itemIndex, '{}'),
		itemIndex,
	);
	// The price cap comes only from the node options, never from the JSON parameters.
	const params: IDataObject = Object.fromEntries(
		Object.entries(json).filter(([name]) => name !== 'max_price'),
	);

	const catalog = await fetchCatalog.call(this);
	const endpoint = getEndpoint(catalog, endpointId);
	if (!endpoint) {
		const guesses = findEndpoints(catalog, endpointId.replace(/[._]/g, ' '), { limit: 3 }).map(
			(e) => e.id,
		);
		throw new NodeOperationError(this.getNode(), `No okdata endpoint has the ID ${endpointId}`, {
			itemIndex,
			description: guesses.length
				? `Did you mean: ${guesses.join(', ')}? Use Any Endpoint > Find to look one up for free.`
				: 'Use Any Endpoint > Find to look one up for free.',
		});
	}
	const accepted = new Set([...(endpoint.params ?? []).map((p) => p.name), ...FREE_FORM_PARAMS]);
	const unknown = Object.keys(params).filter((name) => !accepted.has(name));
	if (unknown.length) {
		throw new NodeOperationError(
			this.getNode(),
			`${endpointId} does not take ${unknown.join(', ')}`,
			{
				itemIndex,
				description: `It takes: ${[...accepted].sort().join(', ')}. See ${docsUrl(endpointId)}`,
			},
		);
	}
	const merged = { ...viewParams(simplify, options), ...params };
	if (options.cursor?.trim() && merged.cursor === undefined) merged.cursor = options.cursor.trim();
	const method = String(endpoint.method).toUpperCase() === 'POST' ? 'POST' : 'GET';
	const envelope = await okdataRequest.call(
		this,
		method,
		endpointPath(endpointId),
		merged,
		maxPrice,
		itemIndex,
	);
	return toItems(options.rawResponse ? [envelope] : resultsOf(envelope), itemIndex);
}

async function runFind(this: IExecuteFunctions, itemIndex: number): Promise<INodeExecutionData[]> {
	const search = String(this.getNodeParameter('search', itemIndex, '')).trim();
	const platform = String(this.getNodeParameter('platform', itemIndex, '')) || undefined;
	const limit = Math.min(
		50,
		Math.max(1, Number(this.getNodeParameter('maxEndpoints', itemIndex, 5)) || 5),
	);
	const catalog = await fetchCatalog.call(this);
	const found = findEndpoints(catalog, search, { platform, limit });
	return toItems(
		found.map((e) => describeEndpoint(e) as unknown as IDataObject),
		itemIndex,
	);
}

export class Okdata implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'okdata',
		name: 'okdata',
		icon: { light: 'file:okdata.svg', dark: 'file:okdata.dark.svg' },
		group: ['input'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description:
			'Social media data from TikTok, RedNote (Xiaohongshu), Douyin, WeChat, Weibo, X, YouTube and 10 more platforms, billed per call',
		defaults: {
			name: 'okdata',
		},
		usableAsTool: true,
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		credentials: [{ name: 'okdataApi', required: true }],
		properties,
	};

	methods = {
		listSearch: {
			async searchEndpoints(
				this: ILoadOptionsFunctions,
				filter?: string,
			): Promise<INodeListSearchResult> {
				const catalog = await fetchCatalog.call(this);
				const matches = filter?.trim()
					? findEndpoints(catalog, filter, { limit: 50 })
					: catalog.endpoints;
				return {
					results: matches.map((e) => ({
						name: `${e.title?.en ?? e.id} (${e.id}), $${e.price ?? '?'} per ${e.unit ?? 'call'}`,
						value: e.id,
						url: docsUrl(e.id),
					})),
				};
			},
		},
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const out: INodeExecutionData[] = [];
		for (let i = 0; i < items.length; i++) {
			try {
				const resource = this.getNodeParameter('resource', i) as string;
				const operation = this.getNodeParameter('operation', i) as string;
				if (resource === 'endpoint' && operation === 'find') {
					out.push(...(await runFind.call(this, i)));
				} else if (resource === 'endpoint' && operation === 'call') {
					out.push(...(await runCall.call(this, i)));
				} else {
					const spec = OPERATIONS[`${resource}:${operation}`];
					if (!spec) {
						throw new NodeOperationError(
							this.getNode(),
							`Unknown operation ${operation} for ${resource}`,
							{
								itemIndex: i,
							},
						);
					}
					out.push(...(await runCurated.call(this, spec, i)));
				}
			} catch (error) {
				if (this.continueOnFail()) {
					out.push({
						json: {
							error: (error as Error).message,
							description: (error as { description?: string }).description ?? null,
						},
						pairedItem: { item: i },
					});
					continue;
				}
				const failure =
					error instanceof NodeApiError || error instanceof NodeOperationError
						? error
						: new NodeOperationError(this.getNode(), error as Error, { itemIndex: i });
				throw failure;
			}
		}
		return [out];
	}
}
