# n8n-nodes-okdata

An [n8n](https://n8n.io/) community node for [okdata](https://okdata.online/?src=n8n-node): public data from social media and online stores for your workflows and AI agents. Search TikTok, YouTube, X, Reddit and Amazon; read Instagram profiles and posts; get the comments on TikTok, YouTube, Instagram and Reddit posts, Amazon product reviews and YouTube transcripts. RedNote (Xiaohongshu), Douyin, WeChat and Weibo are covered too. One okdata API key covers 230+ endpoints on 23 platforms, pay per call with no subscription. You need no platform accounts, cookies or QR logins.

[Installation](#installation) · [Operations](#operations) · [Credentials](#credentials) · [Usage](#usage) · [Costs](#costs) · [Compatibility](#compatibility) · [Resources](#resources)

## Installation

Follow the [community nodes installation guide](https://docs.n8n.io/integrations/community-nodes/installation/): in n8n, open **Settings > Community Nodes**, select **Install**, and enter `n8n-nodes-okdata`.

## Operations

| Resource              | Operation            | What it returns                                                                                                                      | Price per call       |
| --------------------- | -------------------- | ------------------------------------------------------------------------------------------------------------------------------------ | -------------------- |
| TikTok                | Search Videos        | Videos by keyword, with plays, likes, comments and shares                                                                            | $0.002               |
| TikTok                | Get Video Comments   | Comments on a video, with likes and reply counts                                                                                     | $0.002               |
| YouTube               | Search Videos        | Videos by keyword, with views, length and channel                                                                                    | $0.004               |
| YouTube               | Get Video Comments   | Comments on a video, top or newest first                                                                                             | $0.002               |
| YouTube               | Get Transcript       | A video's transcript with timestamps                                                                                                 | $0.004               |
| Instagram             | Get Profile          | An account by handle: name, bio, followers, following and post count                                                                 | $0.004               |
| Instagram             | Get Posts            | An account's posts or reels, newest first                                                                                            | $0.004               |
| Instagram             | Get Post Comments    | Comments on a post or reel, newest first                                                                                             | $0.004               |
| X (Twitter)           | Search Posts         | Posts by query, X search operators included                                                                                          | $0.002               |
| Reddit                | Search Posts         | Posts by keyword, optionally from the last day, week, month or year                                                                  | $0.004               |
| Reddit                | Get Post Comments    | Comments on a post with the first levels of replies                                                                                  | $0.002               |
| Amazon                | Search Products      | Products in a country's Amazon store by keyword: price, rating, ratings count and badges                                             | $0.006               |
| Amazon                | Get Product Reviews  | Customer reviews of a product: stars, text, date and verified purchase                                                               | $0.006               |
| RedNote (Xiaohongshu) | Search Notes         | Notes by keyword, newest or most popular first                                                                                       | $0.02                |
| RedNote (Xiaohongshu) | Get Note Comments    | Comments on a note, with likes and replies                                                                                           | $0.02                |
| Douyin                | Search Videos        | Videos by keyword, with likes, comments and shares                                                                                   | $0.02                |
| Douyin                | Get Video Comments   | Top comments on a video                                                                                                              | $0.002               |
| Douyin                | Get Hot Search       | The current hot search board                                                                                                         | $0.002               |
| WeChat                | Search Articles      | Official Account articles and Channels videos by keyword                                                                             | $0.02                |
| WeChat                | Get Account Articles | An Official Account's published articles, newest first                                                                               | $0.02                |
| WeChat                | Get Article Stats    | Reads, likes, shares, saves and comments of an article                                                                               | $0.02                |
| Weibo                 | Get Hot Search       | The current hot search list                                                                                                          | $0.002               |
| Any Endpoint          | Find                 | Endpoints for a need described in plain words, with price and parameters                                                             | free                 |
| Any Endpoint          | Call                 | Any endpoint by ID: AliExpress, Telegram, Meta Ad Library, Google Ads Transparency, Bilibili, Kuaishou, Zhihu, Taobao, 1688 and more | the endpoint's price |

Live prices and every endpoint's fields: [okdata.online/apis](https://okdata.online/apis/?src=n8n-node).

## Credentials

1. Sign up at [okdata.online](https://okdata.online/signup/?src=n8n-node) with your email. New accounts get trial credit, and the console makes your first API key (it starts with `okd_`).
2. In n8n, create an **okdata API** credential and paste the key into **API Key**. n8n tests it with a free request that reads your balance.

Use a key made for this n8n instance, and give it daily or monthly spending limits in the okdata console if you like.

## Usage

- **List operations** return one n8n item per result, so you can connect a Split Out, Google Sheets or Slack node directly. **Max Pages** fetches more pages by following okdata's cursor.
- **Simplify** returns fewer fields per result (okdata's compact view).
- **Options > Raw Response** returns okdata's full response for each call instead: the results, `page.next_cursor`, and `meta.billing` with the cost and the balance left. Pass `next_cursor` back in **Options > Start Cursor** to continue later.
- **Any Endpoint > Find** is free: describe the data you need ("aliexpress reviews", "telegram channel messages") and it lists matching endpoint IDs with their parameters. **Any Endpoint > Call** then calls one with **Parameters (JSON)**, for example `{"query": "coffee", "sort": "latest"}`.
- **As an AI agent tool**: the node can be attached to an AI Agent. Let the model fill fields such as Search Term with `{{ $fromAI('query', 'keywords to search for') }}`. For the whole catalog, give the agent okdata's [remote MCP server](https://okdata.online/integrations/n8n/?src=n8n-node) through the MCP Client Tool instead.

### Example: weekly Reddit and YouTube comments digest in Slack

1. **Schedule Trigger**: every Monday at 09:00.
2. **okdata**: Resource **Reddit**, Operation **Search Posts**, Search Term = your product name, Sort = **Newest**, Posted Within = **Last Week**.
3. **okdata**: Resource **Reddit**, Operation **Get Post Comments**, Post ID or URL = `{{ $json.id }}`. It runs once for each post found.
4. From the same trigger, a second branch: **okdata** with Resource **YouTube**, Operation **Search Videos**, Search Term = your product name, Sort = **Newest**, then **okdata** with Operation **Get Video Comments**, Video ID or URL = `{{ $json.id }}`.
5. **Merge** (Append) the two branches, then **Aggregate** the `text` field into one item.
6. **Slack**: one message with `{{ $json.text.join('\n\n') }}`, or put an AI step before it to summarize the week.

### Example: daily RedNote brand watch

1. **Schedule Trigger**: every day at 09:00.
2. **okdata**: Resource **RedNote (Xiaohongshu)**, Operation **Search Notes**, Search Term = your brand name, Sort = **Newest**.
3. **Slack** (or Feishu, email, Google Sheets): one message per note with `{{ $json.title }}`, `{{ $json.metrics.likes }}` and `{{ $json.url }}`.

## Costs

okdata is pay per call with no subscription, and new accounts get trial credit. Each call is billed to your okdata balance at the endpoint's price, and every endpoint has its own price ([okdata.online/apis](https://okdata.online/apis/?src=n8n-node)). Each page is a separate call, so Max Pages = 3 makes up to three calls.

Every operation sends a price cap (`X-Max-Price`) a little above the endpoint's current price, and okdata refuses a call priced above the cap before it runs. Change the cap with **Options > Max Price Per Call (USD)**; Any Endpoint > Call defaults to $0.10.

Messages from okdata show its code and what to do, such as `insufficient_balance` (top up in the console) or `max_price_exceeded` (raise the cap); every code is listed at [okdata.online/docs/errors](https://okdata.online/docs/errors/?src=n8n-node).

## Compatibility

Built with the n8n-node CLI (`n8nNodesApiVersion` 1) and tested on n8n 2.47, where it also works as an AI agent tool. No runtime dependencies. The node connects only to `https://api.okdata.online`.

## Privacy

The node sends your API key and the field values of the operation you run to `api.okdata.online`, and stores nothing itself. okdata keeps call records for 30 days and results for 24 hours; see the [okdata privacy policy](https://okdata.online/privacy/?src=n8n-node).

## Resources

- [okdata documentation](https://okdata.online/docs/quickstart/?src=n8n-node)
- [Using okdata in n8n without this node (HTTP Request, MCP Client Tool)](https://okdata.online/integrations/n8n/?src=n8n-node)
- [n8n community nodes documentation](https://docs.n8n.io/integrations/#community-nodes)
- Support: hello@okdata.online or [GitHub issues](https://github.com/okdataapi/n8n-nodes-okdata/issues)

## Version history

See [CHANGELOG.md](CHANGELOG.md).

## License

[MIT](LICENSE)
