import type { INodeProperties } from 'n8n-workflow';

const show = (resource: string, operation: string[]) => ({
	show: { resource: [resource], operation },
});

const PAGE_NOTE = 'Each page is a separate call, billed at the endpoint price';

const resource: INodeProperties = {
	displayName: 'Resource',
	name: 'resource',
	type: 'options',
	noDataExpression: true,
	options: [
		{
			name: 'Any Endpoint',
			value: 'endpoint',
			description: 'Find or call any of the 200+ okdata endpoints',
		},
		{ name: 'Douyin', value: 'douyin' },
		{ name: 'RedNote (Xiaohongshu)', value: 'xiaohongshu' },
		{ name: 'TikTok', value: 'tiktok' },
		{ name: 'WeChat', value: 'wechat' },
		{ name: 'Weibo', value: 'weibo' },
		{ name: 'X (Twitter)', value: 'x' },
		{ name: 'YouTube', value: 'youtube' },
	],
	default: 'tiktok',
};

const operations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['tiktok'] } },
		options: [
			{
				name: 'Search Videos',
				value: 'searchVideos',
				action: 'Search videos',
				description:
					'Search TikTok videos worldwide by keyword, with plays, likes, comments and shares',
			},
		],
		default: 'searchVideos',
	},
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['xiaohongshu'] } },
		options: [
			{
				name: 'Get Note Comments',
				value: 'getNoteComments',
				action: 'Get note comments',
				description: 'Retrieve the comments on a RedNote (Xiaohongshu) note',
			},
			{
				name: 'Search Notes',
				value: 'searchNotes',
				action: 'Search notes',
				description: 'Search RedNote (Xiaohongshu) notes by keyword, newest or most popular first',
			},
		],
		default: 'searchNotes',
	},
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['douyin'] } },
		options: [
			{
				name: 'Get Hot Search',
				value: 'getHotSearch',
				action: 'Get hot search list',
				description: 'Retrieve the current Douyin hot search board with rank and heat',
			},
			{
				name: 'Get Video Comments',
				value: 'getVideoComments',
				action: 'Get video comments',
				description: 'Retrieve the top comments on a Douyin video',
			},
			{
				name: 'Search Videos',
				value: 'searchVideos',
				action: 'Search videos',
				description: 'Search Douyin videos by keyword, with likes, comments and shares',
			},
		],
		default: 'searchVideos',
	},
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['weibo'] } },
		options: [
			{
				name: 'Get Hot Search',
				value: 'getHotSearch',
				action: 'Get hot search list',
				description: 'Retrieve the current Weibo hot search list with rank and heat',
			},
		],
		default: 'getHotSearch',
	},
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['wechat'] } },
		options: [
			{
				name: 'Get Account Articles',
				value: 'getAccountArticles',
				action: 'Get account articles',
				description: 'Retrieve the articles an Official Account has published, newest first',
			},
			{
				name: 'Get Article Stats',
				value: 'getArticleStats',
				action: 'Get article stats',
				description:
					'Retrieve the reads, likes, shares, saves and comments of an Official Account article',
			},
			{
				name: 'Search Articles',
				value: 'searchArticles',
				action: 'Search articles',
				description: 'Search WeChat for Official Account articles and Channels videos by keyword',
			},
		],
		default: 'searchArticles',
	},
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['x'] } },
		options: [
			{
				name: 'Search Posts',
				value: 'searchPosts',
				action: 'Search X posts',
				description: 'Search X (Twitter) posts; X search operators such as from: and lang: work',
			},
		],
		default: 'searchPosts',
	},
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['youtube'] } },
		options: [
			{
				name: 'Get Transcript',
				value: 'getTranscript',
				action: 'Get video transcript',
				description: 'Retrieve the transcript of a YouTube video with timestamps',
			},
		],
		default: 'getTranscript',
	},
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['endpoint'] } },
		options: [
			{
				name: 'Call',
				value: 'call',
				action: 'Call an endpoint',
				description: 'Call any okdata endpoint by its ID, with parameters as JSON',
			},
			{
				name: 'Find',
				value: 'find',
				action: 'Find endpoints',
				description: 'Find okdata endpoints by plain words, with price and parameters (free)',
			},
		],
		default: 'find',
	},
];

const searchFields: INodeProperties[] = [
	{
		displayName: 'Search Term',
		name: 'query',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'e.g. coffee',
		description:
			'Keywords, as typed into the platform search box. Chinese keywords work best on Chinese platforms.',
		displayOptions: {
			show: {
				operation: ['searchVideos', 'searchNotes', 'searchArticles', 'searchPosts'],
				resource: ['tiktok', 'xiaohongshu', 'douyin', 'wechat', 'x'],
			},
		},
	},
	{
		displayName: 'Sort',
		name: 'tiktokSort',
		type: 'options',
		options: [
			{ name: 'Most Liked', value: 'most_liked' },
			{ name: 'Most Relevant', value: 'relevance' },
			{ name: 'Newest', value: 'latest' },
		],
		default: 'relevance',
		description: 'Order of the results',
		displayOptions: show('tiktok', ['searchVideos']),
	},
	{
		displayName: 'Sort',
		name: 'douyinSort',
		type: 'options',
		options: [
			{ name: 'Most Liked', value: 'most_liked' },
			{ name: 'Most Relevant', value: 'relevance' },
			{ name: 'Newest', value: 'latest' },
		],
		default: 'relevance',
		description: 'Order of the results',
		displayOptions: show('douyin', ['searchVideos']),
	},
	{
		displayName: 'Sort',
		name: 'xiaohongshuSort',
		type: 'options',
		options: [
			{ name: 'Most Popular', value: 'popular' },
			{ name: 'Most Relevant', value: 'general' },
			{ name: 'Newest', value: 'latest' },
		],
		default: 'general',
		description: 'Order of the results',
		displayOptions: show('xiaohongshu', ['searchNotes']),
	},
	{
		displayName: 'Note Type',
		name: 'noteType',
		type: 'options',
		options: [
			{ name: 'All', value: 'all' },
			{ name: 'Image Notes', value: 'image' },
			{ name: 'Video Notes', value: 'video' },
		],
		default: 'all',
		description: 'All notes, or only video or image notes',
		displayOptions: show('xiaohongshu', ['searchNotes']),
	},
	{
		displayName: 'Sort',
		name: 'wechatSort',
		type: 'options',
		options: [
			{ name: 'Most Popular', value: 'popular' },
			{ name: 'Most Relevant', value: 'relevance' },
			{ name: 'Newest', value: 'latest' },
		],
		default: 'relevance',
		description: 'Order of the results',
		displayOptions: show('wechat', ['searchArticles']),
	},
	{
		displayName: 'Posted Within',
		name: 'publishedWithin',
		type: 'options',
		options: [
			{ name: 'Any Time', value: '' },
			{ name: 'Last Day', value: 'day' },
			{ name: 'Last Half Year', value: 'half_year' },
			{ name: 'Last Week', value: 'week' },
		],
		default: '',
		description: 'Only results posted in this period',
		displayOptions: show('wechat', ['searchArticles']),
	},
	{
		displayName: 'Result Type',
		name: 'resultType',
		type: 'options',
		options: [
			{ name: 'Articles and Videos', value: '' },
			{ name: 'Channels Videos Only', value: 'video' },
			{ name: 'Official Account Articles Only', value: 'article' },
		],
		default: '',
		description: 'Official Account articles, Channels videos, or both mixed',
		displayOptions: show('wechat', ['searchArticles']),
	},
	{
		displayName: 'Sort',
		name: 'xSort',
		type: 'options',
		options: [
			{ name: 'Latest', value: 'latest' },
			{ name: 'Top', value: 'top' },
		],
		default: 'latest',
		description: 'Order of the results',
		displayOptions: show('x', ['searchPosts']),
	},
];

const idFields: INodeProperties[] = [
	{
		displayName: 'Note ID or URL',
		name: 'noteId',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'e.g. 6650a1b2000000001e00abcd',
		description: 'The note ID from Search Notes, or a xiaohongshu.com/explore/... link.',
		displayOptions: show('xiaohongshu', ['getNoteComments']),
	},
	{
		displayName: 'Video ID or URL',
		name: 'douyinVideoId',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'e.g. 7301234567890123456',
		description: 'The numeric video ID from Search Videos, or a douyin.com/video/... link.',
		displayOptions: show('douyin', ['getVideoComments']),
	},
	{
		displayName: 'Account ID',
		name: 'accountId',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'e.g. gh_363b924965e9',
		description: "The Official Account's WeChat ID, or its original ID starting with gh_",
		displayOptions: show('wechat', ['getAccountArticles']),
	},
	{
		displayName: 'Tab',
		name: 'tab',
		type: 'options',
		options: [
			{ name: 'Articles', value: 'articles' },
			{ name: 'Pictures', value: 'images' },
			{ name: 'Videos', value: 'videos' },
		],
		default: 'articles',
		description: "Which tab of the account's page to read",
		displayOptions: show('wechat', ['getAccountArticles']),
	},
	{
		displayName: 'Article URL',
		name: 'articleUrl',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'e.g. https://mp.weixin.qq.com/s/abc123',
		description: 'The article link on mp.weixin.qq.com, long or short form',
		displayOptions: show('wechat', ['getArticleStats']),
	},
	{
		displayName: 'Video ID or URL',
		name: 'youtubeVideoId',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'e.g. dQw4w9WgXcQ',
		description: 'The 11-character video ID, or a youtube.com or youtu.be link',
		displayOptions: show('youtube', ['getTranscript']),
	},
	{
		displayName: 'Language',
		name: 'language',
		type: 'string',
		default: '',
		placeholder: 'e.g. en',
		description: 'Preferred transcript language code. Leave empty for the original language.',
		displayOptions: show('youtube', ['getTranscript']),
	},
];

const endpointFields: INodeProperties[] = [
	{
		displayName: 'Search',
		name: 'search',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'e.g. kuaishou comments',
		description: 'What data you need, in plain words (English or Chinese)',
		displayOptions: show('endpoint', ['find']),
	},
	{
		displayName: 'Platform',
		name: 'platform',
		type: 'options',
		options: [
			{ name: 'All Platforms', value: '' },
			{ name: 'Bilibili', value: 'bilibili' },
			{ name: 'Douyin', value: 'douyin' },
			{ name: 'Google Ads Transparency', value: 'google' },
			{ name: 'Instagram', value: 'instagram' },
			{ name: 'Kuaishou', value: 'kuaishou' },
			{ name: 'Meta Ad Library', value: 'meta' },
			{ name: 'Reddit', value: 'reddit' },
			{ name: 'RedNote (Xiaohongshu)', value: 'xiaohongshu' },
			{ name: 'Telegram', value: 'telegram' },
			{ name: 'TikTok', value: 'tiktok' },
			{ name: 'WeChat Channels', value: 'wechat_channels' },
			{ name: 'WeChat Official Accounts', value: 'wechat_mp' },
			{ name: 'WeChat Search', value: 'wechat' },
			{ name: 'Weibo', value: 'weibo' },
			{ name: 'X (Twitter)', value: 'x' },
			{ name: 'YouTube', value: 'youtube' },
			{ name: 'Zhihu', value: 'zhihu' },
		],
		default: '',
		description: 'Only endpoints of this platform',
		displayOptions: show('endpoint', ['find']),
	},
	{
		displayName: 'Max Endpoints',
		name: 'maxEndpoints',
		type: 'number',
		typeOptions: { minValue: 1, maxValue: 50 },
		default: 5,
		description: 'How many matching endpoints to return, best first',
		displayOptions: show('endpoint', ['find']),
	},
	{
		displayName: 'Endpoint',
		name: 'endpointId',
		type: 'resourceLocator',
		required: true,
		default: { mode: 'list', value: '' },
		description: 'The okdata endpoint to call',
		displayOptions: show('endpoint', ['call']),
		modes: [
			{
				displayName: 'From List',
				name: 'list',
				type: 'list',
				typeOptions: { searchListMethod: 'searchEndpoints', searchable: true },
			},
			{
				displayName: 'By ID',
				name: 'id',
				type: 'string',
				placeholder: 'e.g. bilibili.trends.list',
				validation: [
					{
						type: 'regex',
						properties: {
							regex: '^[a-z0-9_]+(\\.[a-z0-9_]+)+$',
							errorMessage: 'Use an endpoint ID such as bilibili.trends.list',
						},
					},
				],
			},
		],
	},
	{
		displayName: 'Parameters (JSON)',
		name: 'parameters',
		type: 'json',
		default: '{}',
		description:
			'The endpoint parameters as a JSON object, e.g. {"query": "coffee", "sort": "latest"}. For the next page add "cursor" from the previous result.',
		displayOptions: show('endpoint', ['call']),
	},
];

const pagingFields: INodeProperties[] = [
	{
		displayName: 'Max Pages',
		name: 'maxPages',
		type: 'number',
		typeOptions: { minValue: 1, maxValue: 50 },
		default: 1,
		description: `How many pages of results to fetch. ${PAGE_NOTE}. If a later page fails, the pages already fetched are returned.`,
		displayOptions: {
			show: {
				operation: [
					'searchVideos',
					'searchNotes',
					'searchArticles',
					'searchPosts',
					'getNoteComments',
					'getVideoComments',
					'getAccountArticles',
				],
				resource: ['tiktok', 'xiaohongshu', 'douyin', 'wechat', 'x'],
			},
		},
	},
];

const paidOperations = {
	show: {
		resource: ['tiktok', 'xiaohongshu', 'douyin', 'weibo', 'wechat', 'x', 'youtube', 'endpoint'],
	},
	hide: { operation: ['find'] },
};

const outputFields: INodeProperties[] = [
	{
		displayName: 'Simplify',
		name: 'simplify',
		type: 'boolean',
		default: false,
		description: 'Whether to return fewer fields per result (okdata compact view, same price)',
		displayOptions: paidOperations,
	},
	{
		displayName: 'Options',
		name: 'options',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: paidOperations,
		options: [
			{
				displayName: 'Fields',
				name: 'fields',
				type: 'string',
				default: '',
				placeholder: 'e.g. text,author.name,metrics.likes',
				description: 'Comma-separated fields to keep in each result, with dots for nested fields',
			},
			{
				displayName: 'Max Price Per Call (USD)',
				name: 'maxPrice',
				type: 'number',
				typeOptions: { minValue: 0.0001, maxValue: 100, numberPrecision: 4 },
				default: 0.1,
				description:
					'Calls that could cost more than this are refused before they run and bill nothing. Without this option each operation uses a cap a little above its current price.',
			},
			{
				displayName: 'Raw Response',
				name: 'rawResponse',
				type: 'boolean',
				default: false,
				description:
					"Whether to return okdata's full response for each call (with next_cursor, cost and balance) instead of one item per result",
			},
			{
				displayName: 'Start Cursor',
				name: 'cursor',
				type: 'string',
				default: '',
				description: 'Start from this page: next_cursor from a previous raw response',
			},
		],
	},
];

export const properties: INodeProperties[] = [
	resource,
	...operations,
	...searchFields,
	...idFields,
	...endpointFields,
	...pagingFields,
	...outputFields,
];
