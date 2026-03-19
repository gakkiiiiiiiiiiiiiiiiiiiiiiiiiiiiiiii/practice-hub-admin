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
			fontWeight: '700',
			fontFamily: 'serif',
			maxWidth: 1140,
			align: 'center',
			maxLines: 1,
			lineHeight: 52,
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
			fontWeight: field.fontWeight || '700',
			fontFamily: field.fontFamily || 'serif',
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
	if (!config.backgroundImage) {
		const { width, height } = ctx.canvas;
		drawReferenceShapes(ctx, width, height);
	}

	if (options?.includeFields === false) {
		return;
	}

	for (const field of config.fields) {
		const text = resolveFieldText(field, payload);
		if (!text) continue;
		drawConfiguredText(ctx, field, text);
	}
}

async function drawBackground(ctx: CanvasRenderingContext2D, config: CourseCoverConfig) {
	const { width, height } = ctx.canvas;
	const bg = ctx.createLinearGradient(0, 0, 0, height);
	bg.addColorStop(0, config.backgroundColor || '#5d9ef0');
	bg.addColorStop(1, '#5a98ea');
	ctx.fillStyle = bg;
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

function drawConfiguredText(ctx: CanvasRenderingContext2D, field: CourseCoverFieldConfig, text: string) {
	const align = field.align || 'center';
	const fontWeight = field.fontWeight || '700';
	const fontFamily = field.fontFamily || 'serif';
	const lineHeight = field.lineHeight || field.fontSize;
	ctx.save();
	ctx.fillStyle = field.color || '#FFFFFF';
	ctx.textAlign = align;
	ctx.font = `${fontWeight} ${field.fontSize}px ${fontFamily}`;
	drawMultilineText(
		ctx,
		text,
		field.x,
		field.y,
		field.maxWidth || ctx.canvas.width - 40,
		lineHeight,
		field.maxLines || 1,
		align,
	);
	ctx.restore();
}

function resolveFieldText(field: CourseCoverFieldConfig, payload: CourseCoverPayload) {
	if (field.type === 'staticText') {
		return (field.text || '').trim();
	}
	const raw = field.sourceKey ? payload[field.sourceKey] : '';
	if (!raw) return '';
	if (field.sourceKey === 'exam_year') return `真题：${raw}`;
	if (field.sourceKey === 'answer_year') return `答案：${raw}`;
	return String(raw).trim();
}

function drawMultilineText(
	ctx: CanvasRenderingContext2D,
	text: string,
	x: number,
	startY: number,
	maxWidth: number,
	lineHeight: number,
	maxLines: number,
	align: CourseCoverAlign,
) {
	const lines: string[] = [];
	let currentLine = '';
	for (const char of text) {
		const nextLine = currentLine + char;
		if (ctx.measureText(nextLine).width > maxWidth && currentLine) {
			lines.push(currentLine);
			currentLine = char;
			if (lines.length === maxLines - 1) break;
		} else {
			currentLine = nextLine;
		}
	}
	if (currentLine && lines.length < maxLines) {
		lines.push(currentLine);
	}
	const renderedLength = lines.join('').length;
	const hasRemaining = text.length > renderedLength;
	lines.forEach((line, index) => {
		let output = line;
		if (index === lines.length - 1 && hasRemaining) {
			while (ctx.measureText(`${output}...`).width > maxWidth && output.length > 1) {
				output = output.slice(0, -1);
			}
			output = `${output}...`;
		}
		const drawX = align === 'left' ? x : align === 'right' ? x : x;
		ctx.fillText(output, drawX, startY + index * lineHeight);
	});
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
