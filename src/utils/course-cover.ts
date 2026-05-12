import defaultCourseCoverBg from '@/assets/course-cover-default-bg.jpg';

export const defaultCourseCoverBackground = defaultCourseCoverBg;

export type CourseCoverFieldType = 'courseField' | 'staticText';
export type CourseCoverAlign = 'left' | 'center' | 'right';

export interface CourseCoverFieldConfig {
	id: string;
	label: string;
	type: CourseCoverFieldType;
	sourceKey?: string;
	text?: string;
	x: number;
	y: number;
	fontSize: number;
	color: string;
	backgroundColor?: string;
	fontWeight?: string;
	fontFamily?: string;
	maxWidth?: number;
	align?: CourseCoverAlign;
	maxLines?: number;
	lineHeight?: number;
}

export interface CourseCoverConfig {
	width: number;
	height: number;
	backgroundImage?: string;
	backgroundColor?: string;
	fields: CourseCoverFieldConfig[];
}

export interface CourseCoverPayload {
	name?: string;
	subject?: string;
	category?: string;
	sub_category?: string;
	school?: string;
	major?: string;
	exam_year?: string;
	answer_year?: string;
	[key: string]: string | undefined;
}

export const COURSE_COVER_FIELD_OPTIONS = [
	{ label: '学校', value: 'school' },
	{ label: '专业', value: 'major' },
	{ label: '真题年份', value: 'exam_year' },
	{ label: '答案年份', value: 'answer_year' },
	{ label: '课程名称', value: 'name' },
	{ label: '科目', value: 'subject' },
	{ label: '一级分类', value: 'category' },
	{ label: '二级分类', value: 'sub_category' },
];

/** 与 Canvas / CSS 共用的字体栈，便于预览与导出一致 */
export const COURSE_COVER_FONT_PRESETS: ReadonlyArray<{ label: string; value: string }> = [
	{ label: '宋体 · 衬线（偏印刷/试卷）', value: 'STSong, "SimSun", "Songti SC", "Noto Serif CJK SC", serif' },
	{ label: '黑体 · 无衬线', value: '"PingFang SC", "Microsoft YaHei", "Noto Sans CJK SC", sans-serif' },
	{ label: '思源宋体（若本机已安装）', value: '"Source Han Serif SC", "Noto Serif CJK SC", STSong, "SimSun", serif' },
	{ label: '思源黑体（若本机已安装）', value: '"Source Han Sans SC", "Noto Sans CJK SC", "PingFang SC", sans-serif' },
	{ label: '楷体', value: 'KaiTi, "Kaiti SC", STKaiti, serif' },
	{ label: '仿宋', value: 'FangSong, "FangSong SC", STFangSong, serif' },
	{ label: '苹方 / 冬青黑体', value: '"PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif' },
	{ label: '系统衬线', value: 'ui-serif, "Songti SC", STSong, "SimSun", serif' },
	{ label: '系统非衬线', value: 'ui-sans-serif, "PingFang SC", "Microsoft YaHei", sans-serif' },
	{ label: '等宽（数字/代码感）', value: 'ui-monospace, "SF Mono", Menlo, Consolas, monospace' },
];

const DEFAULT_COVER_FONT_STACK = COURSE_COVER_FONT_PRESETS[0].value;

export function normalizeFontFamilyForCover(raw?: string | null): string {
	const trimmed = String(raw || '').trim();
	if (!trimmed) return DEFAULT_COVER_FONT_STACK;
	if (COURSE_COVER_FONT_PRESETS.some((preset) => preset.value === trimmed)) {
		return trimmed;
	}
	const lower = trimmed.toLowerCase();
	if (lower === 'serif') return DEFAULT_COVER_FONT_STACK;
	if (lower === 'sans-serif') return COURSE_COVER_FONT_PRESETS[1].value;
	if (lower === 'monospace') return COURSE_COVER_FONT_PRESETS[9].value;
	if (trimmed.includes(',')) return trimmed.slice(0, 220);
	return trimmed.slice(0, 220);
}

export const DEFAULT_COURSE_COVER_CONFIG: CourseCoverConfig = {
	width: 1200,
	height: 1200,
	backgroundImage: defaultCourseCoverBackground,
	backgroundColor: '#5d9ef0',
	fields: [
		{
			id: 'top_title',
			label: '顶部标题',
			type: 'staticText',
			text: '赠送公共课数学英语政治历年真题及资料',
			x: 600,
			y: 96,
			fontSize: 56,
			color: '#F9F4DF',
			backgroundColor: 'transparent',
			fontWeight: '700',
			fontFamily: 'serif',
			maxWidth: 1140,
			align: 'center',
			maxLines: 1,
			lineHeight: 56,
		},
		{
			id: 'school',
			label: '学校',
			type: 'courseField',
			sourceKey: 'school',
			x: 600,
			y: 325,
			fontSize: 108,
			color: '#58A7F7',
			backgroundColor: 'transparent',
			fontWeight: '700',
			fontFamily: 'serif',
			maxWidth: 940,
			align: 'center',
			maxLines: 1,
			lineHeight: 108,
		},
		{
			id: 'major',
			label: '专业',
			type: 'courseField',
			sourceKey: 'major',
			x: 600,
			y: 515,
			fontSize: 62,
			color: '#FDF8ED',
			backgroundColor: 'transparent',
			fontWeight: '700',
			fontFamily: 'serif',
			maxWidth: 1080,
			align: 'center',
			maxLines: 1,
			lineHeight: 62,
		},
		{
			id: 'store_text',
			label: '店铺文案',
			type: 'staticText',
			text: '下一站上岸书店',
			x: 600,
			y: 745,
			fontSize: 58,
			color: '#f3ea53',
			backgroundColor: 'transparent',
			fontWeight: '700',
			fontFamily: 'serif',
			maxWidth: 900,
			align: 'center',
			maxLines: 1,
			lineHeight: 58,
		},
		{
			id: 'exam_year',
			label: '真题年份',
			type: 'courseField',
			sourceKey: 'exam_year',
			x: 360,
			y: 840,
			fontSize: 42,
			color: '#FFFFFF',
			backgroundColor: 'transparent',
			fontWeight: '700',
			fontFamily: 'serif',
			maxWidth: 460,
			align: 'left',
			maxLines: 1,
			lineHeight: 42,
		},
		{
			id: 'answer_year',
			label: '答案年份',
			type: 'courseField',
			sourceKey: 'answer_year',
			x: 360,
			y: 915,
			fontSize: 42,
			color: '#FFFFFF',
			backgroundColor: 'transparent',
			fontWeight: '700',
			fontFamily: 'serif',
			maxWidth: 460,
			align: 'left',
			maxLines: 1,
			lineHeight: 42,
		},
		{
			id: 'delivery_text',
			label: '底部主文案',
			type: 'staticText',
			text: '网盘电子版  速发',
			x: 600,
			y: 1075,
			fontSize: 76,
			color: '#58A7F7',
			backgroundColor: 'transparent',
			fontWeight: '700',
			fontFamily: 'serif',
			maxWidth: 980,
			align: 'center',
			maxLines: 1,
			lineHeight: 76,
		},
		{
			id: 'bottom_caption',
			label: '底部说明',
			type: 'staticText',
			text: '全网最新考研(学长学姐自用资料)',
			x: 600,
			y: 1180,
			fontSize: 52,
			color: '#FDF9EE',
			backgroundColor: 'transparent',
			fontWeight: '700',
			fontFamily: 'serif',
			maxWidth: 1140,
			align: 'center',
			maxLines: 1,
			lineHeight: 52,
		},
	],
};

/** 与后端 getDefaultCategoryCoverConfig 保持一致，供管理端恢复默认与兜底 */
export const DEFAULT_CATEGORY_COVER_CONFIG: CourseCoverConfig = {
	width: 1200,
	height: 1200,
	backgroundImage: '',
	backgroundColor: '#F4F7FB',
	fields: [
		{
			id: 'category',
			label: '一级分类',
			type: 'courseField',
			sourceKey: 'category',
			x: 600,
			y: 460,
			fontSize: 112,
			color: '#8A9AB3',
			backgroundColor: 'transparent',
			fontWeight: '800',
			fontFamily: DEFAULT_COVER_FONT_STACK,
			maxWidth: 920,
			align: 'center',
			maxLines: 1,
			lineHeight: 122,
		},
		{
			id: 'sub_category',
			label: '二级分类',
			type: 'courseField',
			sourceKey: 'sub_category',
			x: 600,
			y: 735,
			fontSize: 148,
			color: '#6F7F99',
			backgroundColor: 'transparent',
			fontWeight: '900',
			fontFamily: DEFAULT_COVER_FONT_STACK,
			maxWidth: 980,
			align: 'center',
			maxLines: 1,
			lineHeight: 158,
		},
	],
};

export function cloneCourseCoverConfig(config: CourseCoverConfig): CourseCoverConfig {
	return JSON.parse(JSON.stringify(config));
}

export function normalizeCourseCoverConfig(input?: Partial<CourseCoverConfig> | null): CourseCoverConfig {
	const merged = cloneCourseCoverConfig(DEFAULT_COURSE_COVER_CONFIG);
	if (!input) return merged;
	merged.width = Number(input.width) || merged.width;
	merged.height = Number(input.height) || merged.height;
	if (input.backgroundImage !== undefined) {
		merged.backgroundImage = input.backgroundImage || '';
	}
	merged.backgroundColor = input.backgroundColor || merged.backgroundColor;
	if (Array.isArray(input.fields) && input.fields.length > 0) {
		merged.fields = input.fields.map((field, index) => ({
			id: field.id || `field_${index + 1}`,
			label: field.label || `字段${index + 1}`,
			type: field.type === 'staticText' ? 'staticText' : 'courseField',
			sourceKey: field.sourceKey || '',
			text: field.text || '',
			x: Number(field.x) || 0,
			y: Number(field.y) || 0,
			fontSize: Number(field.fontSize) || 32,
			color: field.color || '#FFFFFF',
			backgroundColor: field.backgroundColor || 'transparent',
			fontWeight: field.fontWeight || '700',
			fontFamily: normalizeFontFamilyForCover(field.fontFamily),
			maxWidth: Number(field.maxWidth) || undefined,
			align: field.align || 'center',
			maxLines: Number(field.maxLines) || 1,
			lineHeight: Number(field.lineHeight) || Number(field.fontSize) || 32,
		}));
	}
	return merged;
}

export async function renderCourseCover(
	config: CourseCoverConfig,
	payload: CourseCoverPayload,
	options?: {
		includeFields?: boolean;
	},
): Promise<HTMLCanvasElement> {
	const normalized = normalizeCourseCoverConfig(config);
	const canvas = document.createElement('canvas');
	canvas.width = normalized.width;
	canvas.height = normalized.height;
	const ctx = canvas.getContext('2d');
	if (!ctx) throw new Error('当前浏览器不支持 Canvas');

	await drawCourseCover(ctx, normalized, payload, options);
	return canvas;
}

async function drawCourseCover(
	ctx: CanvasRenderingContext2D,
	config: CourseCoverConfig,
	payload: CourseCoverPayload,
	options?: {
		includeFields?: boolean;
	},
) {
	await drawBackground(ctx, config);

	if (options?.includeFields === false) {
		return;
	}

	for (const field of config.fields) {
		const text = resolveCourseCoverFieldText(field, payload);
		if (!text) continue;
		drawConfiguredText(ctx, field, text);
	}
}

async function drawBackground(ctx: CanvasRenderingContext2D, config: CourseCoverConfig) {
	const { width, height } = ctx.canvas;
	ctx.fillStyle = config.backgroundColor || '#5d9ef0';
	ctx.fillRect(0, 0, width, height);

	if (config.backgroundImage) {
		try {
			const img = await loadImage(config.backgroundImage);
			ctx.save();
			ctx.globalAlpha = 1;
			ctx.drawImage(img, 0, 0, width, height);
			ctx.restore();
		} catch (error) {
			console.error('加载封面背景图失败:', error);
		}
	}
}

function drawReferenceShapes(ctx: CanvasRenderingContext2D, width: number, height: number) {
	roundRect(ctx, 78, 160, width - 156, 260, 34, '#F8F8F6');

	ctx.beginPath();
	ctx.moveTo(70, 585);
	ctx.lineTo(width - 70, 585);
	ctx.lineTo(width - 118, 1045);
	ctx.lineTo(118, 1045);
	ctx.closePath();
	ctx.fillStyle = '#FFFFFF';
	ctx.fill();

	ctx.beginPath();
	ctx.moveTo(160, 642);
	ctx.lineTo(width - 160, 642);
	ctx.lineTo(width - 270, 930);
	ctx.lineTo(270, 930);
	ctx.closePath();
	ctx.fillStyle = '#5a98ea';
	ctx.fill();
}

export function resolveCourseCoverFieldText(field: CourseCoverFieldConfig, payload: CourseCoverPayload) {
	if (field.type === 'staticText') {
		return (field.text || '').trim();
	}
	const raw = field.sourceKey ? payload[field.sourceKey] : '';
	if (!raw) return '';
	if (field.sourceKey === 'exam_year') return `真题：${raw}`;
	if (field.sourceKey === 'answer_year') return `答案：${raw}`;
	return String(raw).trim();
}

function drawConfiguredText(ctx: CanvasRenderingContext2D, field: CourseCoverFieldConfig, text: string) {
	const align = field.align || 'center';
	const fontWeight = field.fontWeight || '700';
	const fontFamily = normalizeFontFamilyForCover(field.fontFamily);
	const lineHeight = field.lineHeight || field.fontSize;
	const maxWidth = field.maxWidth || ctx.canvas.width - 40;
	ctx.save();
	ctx.textAlign = align;
	ctx.textBaseline = 'alphabetic';
	ctx.font = `${fontWeight} ${field.fontSize}px ${fontFamily}`;
	const lines = buildMultilineTextLines(ctx, text, maxWidth, field.maxLines || 1);
	drawTextBackground(ctx, field, lines, maxWidth, lineHeight, align);
	ctx.fillStyle = field.color || '#FFFFFF';
	lines.forEach((line, index) => {
		ctx.fillText(line, field.x, field.y + index * lineHeight);
	});
	ctx.restore();
}

/** 折叠换行与多余空白，避免 Canvas 把不可见换行算进排版导致异常换行 */
function normalizeCoverTextForLayout(text: string): string {
	return String(text || '')
		.replace(/\r\n|\r|\n/g, ' ')
		.replace(/[\u00a0\u3000]+/g, ' ')
		.replace(/\s+/g, ' ')
		.trim();
}

const ELLIPSIS = '...';

/** 单行：宽度内完整展示，否则仅一行 + 省略号（不出现第二行） */
function fitSingleLineWithEllipsis(
	ctx: CanvasRenderingContext2D,
	text: string,
	maxWidth: number,
): string[] {
	if (!text) return [];
	if (ctx.measureText(text).width <= maxWidth) return [text];
	if (ctx.measureText(ELLIPSIS).width > maxWidth) {
		return [text.slice(0, 1)];
	}
	let lo = 0;
	let hi = text.length;
	let fitLen = 0;
	while (lo <= hi) {
		const mid = (lo + hi) >> 1;
		const candidate = text.slice(0, mid) + ELLIPSIS;
		if (ctx.measureText(candidate).width <= maxWidth) {
			fitLen = mid;
			lo = mid + 1;
		} else {
			hi = mid - 1;
		}
	}
	let prefix = text.slice(0, fitLen);
	while (prefix.length > 0 && ctx.measureText(prefix + ELLIPSIS).width > maxWidth) {
		prefix = prefix.slice(0, -1);
	}
	return [prefix ? prefix + ELLIPSIS : ELLIPSIS];
}

/** 最长前缀宽度不超过 maxWidth；若截断点落在词中间，则回退到段内最后一个空格（避免丢字） */
function takeLinePrefixPreferSpaceBreak(
	ctx: CanvasRenderingContext2D,
	remaining: string,
	maxWidth: number,
): { line: string; nextStart: number } {
	if (!remaining) return { line: '', nextStart: 0 };
	let lo = 0;
	let hi = remaining.length;
	let best = 0;
	while (lo <= hi) {
		const mid = (lo + hi) >> 1;
		const sub = remaining.slice(0, mid);
		if (ctx.measureText(sub).width <= maxWidth) {
			best = mid;
			lo = mid + 1;
		} else {
			hi = mid - 1;
		}
	}
	if (best === 0) {
		return { line: remaining[0] || '', nextStart: Math.min(1, remaining.length) };
	}
	if (best < remaining.length) {
		const slice = remaining.slice(0, best);
		const lastSpace = slice.lastIndexOf(' ');
		if (lastSpace > 0) {
			const line = remaining.slice(0, lastSpace).trimEnd();
			return { line, nextStart: lastSpace + 1 };
		}
	}
	return { line: remaining.slice(0, best), nextStart: best };
}

function buildMultilineTextLines(
	ctx: CanvasRenderingContext2D,
	text: string,
	maxWidth: number,
	maxLines: number,
) {
	const safeMaxWidth = Math.max(1, Number(maxWidth) || 1);
	const normalizedMaxLines = Math.max(1, Math.floor(Number(maxLines) || 1));
	const normalizedText = normalizeCoverTextForLayout(text);
	if (!normalizedText) return [];

	if (normalizedMaxLines === 1) {
		return fitSingleLineWithEllipsis(ctx, normalizedText, safeMaxWidth);
	}

	const lines: string[] = [];
	let remaining = normalizedText;

	while (remaining && lines.length < normalizedMaxLines) {
		if (lines.length === normalizedMaxLines - 1) {
			lines.push(...fitSingleLineWithEllipsis(ctx, remaining, safeMaxWidth));
			break;
		}
		const { line, nextStart } = takeLinePrefixPreferSpaceBreak(ctx, remaining, safeMaxWidth);
		if (!line.trim() && remaining) {
			lines.push(remaining[0]);
			remaining = remaining.slice(1).replace(/^\s+/, '');
			continue;
		}
		lines.push(line.trimEnd());
		remaining = remaining.slice(nextStart).replace(/^\s+/, '');
	}

	return lines;
}

function drawTextBackground(
	ctx: CanvasRenderingContext2D,
	field: CourseCoverFieldConfig,
	lines: string[],
	maxWidth: number,
	lineHeight: number,
	align: CourseCoverAlign,
) {
	if (isTransparentColor(field.backgroundColor) || lines.length === 0) return;
	const horizontalPadding = Math.max(8, field.fontSize * 0.12);
	const verticalPadding = Math.max(4, lineHeight * 0.08);
	ctx.save();
	ctx.fillStyle = field.backgroundColor || 'transparent';
	lines.forEach((line, index) => {
		const textWidth = Math.min(ctx.measureText(line).width, maxWidth);
		const width = textWidth + horizontalPadding * 2;
		const height = lineHeight + verticalPadding * 2;
		const lineY = field.y + index * lineHeight;
		const rectX = align === 'left' ? field.x - horizontalPadding : align === 'right' ? field.x - width + horizontalPadding : field.x - width / 2;
		const rectY = lineY - field.fontSize - verticalPadding;
		ctx.fillRect(rectX, rectY, width, height);
	});
	ctx.restore();
}

function isTransparentColor(color?: string) {
	const normalized = String(color || '').trim().toLowerCase();
	return !normalized || normalized === 'transparent';
}

function roundRect(
	ctx: CanvasRenderingContext2D,
	x: number,
	y: number,
	width: number,
	height: number,
	radius: number,
	fillStyle: string,
) {
	ctx.save();
	ctx.beginPath();
	ctx.moveTo(x + radius, y);
	ctx.arcTo(x + width, y, x + width, y + height, radius);
	ctx.arcTo(x + width, y + height, x, y + height, radius);
	ctx.arcTo(x, y + height, x, y, radius);
	ctx.arcTo(x, y, x + width, y, radius);
	ctx.closePath();
	ctx.fillStyle = fillStyle;
	ctx.fill();
	ctx.restore();
}

function loadImage(src: string): Promise<HTMLImageElement> {
	return new Promise((resolve, reject) => {
		const img = new Image();
		img.crossOrigin = 'anonymous';
		img.onload = () => resolve(img);
		img.onerror = reject;
		img.src = src;
	});
}
