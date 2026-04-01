import type { FeedGroup } from '../app/types/feed'
// 友链检测 CLI 需要使用显式导入和相对路径
import { myFeed } from '../blog.config'

export default [
	// #region 博客圈
	{
		name: '博客圈',
		desc: '优质个人博客和技术分享站点。',
		// @keep-sorted { "keys": ["date"] }
		entries: [
			myFeed,
			/* ========从此处新增友链======== */
		],
	},
	// #endregion
] satisfies FeedGroup[]
