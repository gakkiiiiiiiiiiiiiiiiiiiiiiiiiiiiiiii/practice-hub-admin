/**
 * 对象存储图片代理：支持 OSS 地址，并兼容迁移前已入库的 TCB 地址。
 */

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';
const PROXY_PREFIX = `${API_BASE.replace(/\/$/, '')}/admin/upload/proxy-image?url=`;

const STORAGE_HOST_PATTERN = /(?:\.aliyuncs\.com|\.tcb\.qcloud\.la)/i;

export function getProxiedImageUrl(url: string): string {
	if (!url || typeof url !== 'string') return url;
	if (STORAGE_HOST_PATTERN.test(url)) {
		return `${PROXY_PREFIX}${encodeURIComponent(url.trim())}`;
	}
	return url;
}

/** 匹配 img 标签内 OSS/TCB 的 src */
const STORAGE_SRC_REGEX = /(<img[^>]+src=["'])(https?:\/\/[^"']*(?:\.aliyuncs\.com|\.tcb\.qcloud\.la)[^"']*)(["'])/gi;

/**
 * 将 HTML 中所有对象存储图片的 src 替换为代理地址（用于富文本展示/编辑时能正常加载）
 */
export function proxyImageUrlsInHtml(html: string): string {
	if (!html || typeof html !== 'string') return html;
	return html.replace(STORAGE_SRC_REGEX, (_: string, prefix: string, url: string, suffix: string) => {
		return prefix + getProxiedImageUrl(url) + suffix;
	});
}

/** 匹配代理 URL 的 src（用于还原） */
const PROXY_SRC_REGEX = (() => {
	const escaped = PROXY_PREFIX.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
	return new RegExp(`(<img[^>]+src=["'])${escaped}([^"&]+)(["'])`, 'gi');
})();

/**
 * 将 HTML 中代理地址还原为原始对象存储地址（保存到后端前调用，避免把代理 URL 存进库）
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
