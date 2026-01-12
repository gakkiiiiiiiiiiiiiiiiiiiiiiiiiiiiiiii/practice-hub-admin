/**
 * HTML 安全工具函数
 * 用于防止 XSS 攻击
 */

/**
 * 转义 HTML 特殊字符
 * @param text 需要转义的文本
 * @returns 转义后的文本
 */
export function escapeHtml(text: string | null | undefined): string {
	if (!text) return '';
	
	const map: Record<string, string> = {
		'&': '&amp;',
		'<': '&lt;',
		'>': '&gt;',
		'"': '&quot;',
		"'": '&#039;',
	};
	
	return String(text).replace(/[&<>"']/g, (char) => map[char]);
}

/**
 * 去除 HTML 标签，提取纯文本
 * @param html HTML 字符串
 * @returns 纯文本
 */
export function stripHtmlTags(html: string | null | undefined): string {
	if (!html) return '';
	
	// 创建一个临时 DOM 元素来提取文本
	const div = document.createElement('div');
	div.innerHTML = html;
	return div.textContent || div.innerText || '';
}

/**
 * 安全地截取文本（用于列表显示）
 * @param text 文本内容
 * @param maxLength 最大长度
 * @returns 截取后的文本
 */
export function truncateText(text: string | null | undefined, maxLength: number = 50): string {
	if (!text) return '';
	const plainText = stripHtmlTags(text);
	return plainText.length > maxLength ? plainText.substring(0, maxLength) + '...' : plainText;
}
