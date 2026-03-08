/**
 * TCB 图片代理：管理端与 TCB 不同源时会出现 CORS，通过后端代理地址访问即可避免。
 */

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';
const PROXY_PREFIX = `${API_BASE.replace(/\/$/, '')}/admin/upload/proxy-image?url=`;

const TCB_HOST = 'tcb.qcloud.la';

export function getProxiedImageUrl(url: string): string {
	if (!url || typeof url !== 'string') return url;
	if (url.includes(TCB_HOST)) {
		return `${PROXY_PREFIX}${encodeURIComponent(url.trim())}`;
	}
	return url;
}

/** 匹配 img 标签内 TCB 的 src */
const TCB_SRC_REGEX = new RegExp(
	`(<img[^>]+src=["'])(https?://[^"']*${TCB_HOST.replace(/\./g, '\\.')}[^"']*)(["'])`,
	'gi',
);

/**
 * 将 HTML 中所有 TCB 图片的 src 替换为代理地址（用于富文本展示/编辑时能正常加载）
 */
export function proxyImageUrlsInHtml(html: string): string {
	if (!html || typeof html !== 'string') return html;
	return html.replace(TCB_SRC_REGEX, (_: string, prefix: string, url: string, suffix: string) => {
		return prefix + getProxiedImageUrl(url) + suffix;
	});
}

/** 匹配代理 URL 的 src（用于还原） */
const PROXY_SRC_REGEX = (() => {
	const escaped = PROXY_PREFIX.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
	return new RegExp(`(<img[^>]+src=["'])${escaped}([^"&]+)(["'])`, 'gi');
})();

/**
 * 将 HTML 中代理地址还原为原始 TCB 地址（保存到后端前调用，避免把代理 URL 存进库）
 */
export function reverseProxyUrlsInHtml(html: string): string {
	if (!html || typeof html !== 'string') return html;
	return html.replace(PROXY_SRC_REGEX, (_: string, prefix: string, encoded: string, suffix: string) => {
		try {
			return prefix + decodeURIComponent(encoded) + suffix;
		} catch {
			return prefix + encoded + suffix;
		}
	});
}
