import type { FeedGroup } from '../app/types/feed'
// 友链检测 CLI 需要使用显式导入和相对路径
import { myFeed } from '../blog.config'

export default [
	// #region 博客圈
	{
		name: '好友博客',
		desc: 'wait to be added...TVT',
		// @keep-sorted { "keys": ["date"] }
		entries: [
			myFeed,
			/* ========从此处新增友链======== */
		],
	},
	// #endregion
] satisfies FeedGroup[]
