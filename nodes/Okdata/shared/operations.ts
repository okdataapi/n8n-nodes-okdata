import { douyinVideoId, xiaohongshuNoteId, youtubeVideoId } from './ids';

/**
 * One curated operation: the okdata endpoint it calls, whether it returns a list, the default
 * price cap per call (a little above the endpoint's price; the Max Price Per Call option
 * overrides it), and which node fields become which API parameters.
 */
export interface OperationSpec {
	endpointId: string;
	list: boolean;
	maxPrice: string;
	/** node field name -> API parameter name */
	fields: Readonly<Record<string, string>>;
	/** API parameter name -> clean-up of the value typed in (a link becomes an ID) */
	clean?: Readonly<Record<string, (value: string) => string>>;
}

export const OPERATIONS: Readonly<Record<string, OperationSpec>> = {
	'tiktok:searchVideos': {
		endpointId: 'tiktok.videos.search',
		list: true,
		maxPrice: '0.01',
		fields: { query: 'query', tiktokSort: 'sort' },
	},
	'xiaohongshu:searchNotes': {
		endpointId: 'xiaohongshu.notes.search',
		list: true,
		maxPrice: '0.05',
		fields: { query: 'query', xiaohongshuSort: 'sort', noteType: 'type' },
	},
	'xiaohongshu:getNoteComments': {
		endpointId: 'xiaohongshu.notes.comments.list',
		list: true,
		maxPrice: '0.05',
		fields: { noteId: 'id' },
		clean: { id: xiaohongshuNoteId },
	},
	'douyin:searchVideos': {
		endpointId: 'douyin.videos.search',
		list: true,
		maxPrice: '0.05',
		fields: { query: 'query', douyinSort: 'sort' },
	},
	'douyin:getVideoComments': {
		endpointId: 'douyin.videos.comments.list',
		list: true,
		maxPrice: '0.01',
		fields: { douyinVideoId: 'id' },
		clean: { id: douyinVideoId },
	},
	'douyin:getHotSearch': {
		endpointId: 'douyin.trends.list',
		list: true,
		maxPrice: '0.01',
		fields: {},
	},
	'weibo:getHotSearch': {
		endpointId: 'weibo.trends.list',
		list: true,
		maxPrice: '0.01',
		fields: {},
	},
	'wechat:searchArticles': {
		endpointId: 'wechat.posts.search',
		list: true,
		maxPrice: '0.05',
		fields: {
			query: 'query',
			wechatSort: 'sort',
			publishedWithin: 'published_within',
			resultType: 'type',
		},
	},
	'wechat:getAccountArticles': {
		endpointId: 'wechat_mp.accounts.articles.list',
		list: true,
		maxPrice: '0.05',
		fields: { accountId: 'id', tab: 'tab' },
	},
	'wechat:getArticleStats': {
		endpointId: 'wechat_mp.articles.metrics',
		list: false,
		maxPrice: '0.05',
		fields: { articleUrl: 'url' },
	},
	'x:searchPosts': {
		endpointId: 'x.posts.search',
		list: true,
		maxPrice: '0.01',
		fields: { query: 'query', xSort: 'sort' },
	},
	'youtube:getTranscript': {
		endpointId: 'youtube.videos.transcript.get',
		list: false,
		maxPrice: '0.01',
		fields: { youtubeVideoId: 'id', language: 'lang' },
		clean: { id: youtubeVideoId },
	},
};

/** The default cap for Call Any Endpoint. */
export const CALL_ENDPOINT_MAX_PRICE = '0.1';

/** Pages fetched at most in one run of a list operation, whatever Max Pages says. */
export const MAX_PAGES_CEILING = 50;
