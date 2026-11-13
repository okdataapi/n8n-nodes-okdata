// Turns a pasted link into the ID an okdata endpoint expects. Anything that does not match
// is passed through unchanged, so okdata can answer with its own validation error.

const YOUTUBE_ID = /(?:v=|youtu\.be\/|\/shorts\/|\/embed\/|\/live\/)([A-Za-z0-9_-]{11})/;
const DOUYIN_ID = /(?:\/video\/|\/note\/|modal_id=|aweme_id=)(\d{15,21})/;
const XIAOHONGSHU_NOTE_ID = /(?:\/explore\/|\/discovery\/item\/|\/item\/)([0-9a-f]{24})/;

function firstGroup(pattern: RegExp, value: string): string {
	const text = value.trim();
	const match = pattern.exec(text);
	return match ? match[1] : text;
}

/** `dQw4w9WgXcQ`, or the ID inside a watch, youtu.be, shorts, embed or live link. */
export const youtubeVideoId = (value: string): string => firstGroup(YOUTUBE_ID, value);

/** The numeric video ID, also from a douyin.com/video/... link. */
export const douyinVideoId = (value: string): string => firstGroup(DOUYIN_ID, value);

/** The 24-character note ID, also from a xiaohongshu.com/explore/... link. */
export const xiaohongshuNoteId = (value: string): string => firstGroup(XIAOHONGSHU_NOTE_ID, value);
