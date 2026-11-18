import { amazonAsin, douyinVideoId, tiktokVideoId, xiaohongshuNoteId, youtubeVideoId } from './ids';

/**
 * One curated operation: the okdata endpoint it calls, whether it returns a list, the default
 * price cap per call (a little above the endpoint's price: $0.01 for endpoints priced under a
 * cent, $0.05 for those at $0.02; the Max Price Per Call option overrides it), and which node
 * fields become which API parameters.
 */
export interface OperationSpec {
	endpointId: string;
	list: boolean;
	maxPrice: string;
	/** node field name -> API parameter name */
	fields: Readonly<Record<string, string>>;
	/** API parameter name -> clean-up of the value typed in (a link becomes an ID) */
	clean?: Readonly<Record<string, (value: string) => string>>;
	/** API parameter name -> the parameter that takes a link instead, used when a link is typed in */
	linkParam?: Readonly<Record<string, string>>;
}

export const OPERATIONS: Readonly<Record<string, OperationSpec>> = {
	'tiktok:searchVideos': {
		endpointId: 'tiktok.videos.search',
		list: true,
		maxPrice: '0.01',
		fields: { query: 'query', tiktokSort: 'sort' },
	},
	'tiktok:getVideoComments': {
		endpointId: 'tiktok.videos.comments.list',
		list: true,
		maxPrice: '0.01',
		fields: { tiktokVideoId: 'id' },
		clean: { id: tiktokVideoId },
	},
	'youtube:searchVideos': {
		endpointId: 'youtube.videos.search',
		list: true,
		maxPrice: '0.01',
		fields: { query: 'query', youtubeSort: 'sort' },
	},
	'youtube:getVideoComments': {
		endpointId: 'youtube.videos.comments.list',
		list: true,
		maxPrice: '0.01',
		fields: { youtubeVideoId: 'id', youtubeCommentSort: 'sort' },
		clean: { id: youtubeVideoId },
	},
	'youtube:getTranscript': {
		endpointId: 'youtube.videos.transcript.get',
		list: false,
		maxPrice: '0.01',
		fields: { youtubeVideoId: 'id', language: 'lang' },
		clean: { id: youtubeVideoId },
	},
	'instagram:getProfile': {
		endpointId: 'instagram.users.get',
		list: false,
		maxPrice: '0.01',
		fields: { instagramUsername: 'username' },
	},
	'instagram:getPosts': {
		endpointId: 'instagram.users.posts.list',
		list: true,
		maxPrice: '0.01',
		fields: { instagramUsername: 'username', instagramPostType: 'type' },
	},
	'instagram:getPostComments': {
		endpointId: 'instagram.posts.comments.list',
		list: true,
		maxPrice: '0.01',
		fields: { instagramPostId: 'id' },
		linkParam: { id: 'url' },
	},
	'x:searchPosts': {
		endpointId: 'x.posts.search',
		list: true,
		maxPrice: '0.01',
		fields: { query: 'query', xSort: 'sort' },
	},
	'reddit:searchPosts': {
		endpointId: 'reddit.posts.search',
		list: true,
		maxPrice: '0.01',
		fields: { query: 'query', redditSort: 'sort', redditPublishedWithin: 'published_within' },
	},
	'reddit:getPostComments': {
		endpointId: 'reddit.posts.comments.list',
		list: true,
		maxPrice: '0.01',
		fields: { redditPostId: 'id', redditCommentSort: 'sort' },
		linkParam: { id: 'url' },
	},
	'amazon:searchProducts': {
		endpointId: 'amazon.products.search',
		list: true,
		maxPrice: '0.01',
		fields: { query: 'query', amazonCountry: 'country', amazonSort: 'sort' },
	},
	// The catalog gives this endpoint no next page, so the node offers no Max Pages for it.
	'amazon:getProductReviews': {
		endpointId: 'amazon.products.reviews.list',
		list: true,
		maxPrice: '0.01',
		fields: { amazonAsin: 'id', amazonCountry: 'country' },
		clean: { id: amazonAsin },
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
	'weibo:getHotSearch': {
		endpointId: 'weibo.trends.list',
		list: true,
		maxPrice: '0.01',
		fields: {},
	},
};

/** The default cap for Call Any Endpoint. */
export const CALL_ENDPOINT_MAX_PRICE = '0.1';

/** Pages fetched at most in one run of a list operation, whatever Max Pages says. */
export const MAX_PAGES_CEILING = 50;
