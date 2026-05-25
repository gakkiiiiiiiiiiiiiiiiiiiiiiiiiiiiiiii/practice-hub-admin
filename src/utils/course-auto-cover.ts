import { getCourseCoverConfig } from '@/api/system';
import { uploadImage } from '@/api/upload';
import {
	DEFAULT_COURSE_COVER_CONFIG,
	normalizeCourseCoverConfig,
	normalizeCourseCoverTemplatePack,
	resolveCourseCoverConfigByCategory,
	renderCourseCover,
	type CourseCoverTemplatePack,
} from '@/utils/course-cover';

let coverConfigCache: CourseCoverTemplatePack | null = null;

export type CourseCoverGenerateInput = {
	name?: string;
	subject?: string;
	category?: string;
	sub_category?: string;
	school?: string;
	major?: string;
	exam_year?: string;
	answer_year?: string;
	/** 指定封面模板 ID；不传则按分类自动匹配 */
	templateId?: string;
};

export function resetCourseCoverConfigCache() {
	coverConfigCache = null;
}

export async function fetchCourseCoverTemplatePack() {
	if (!coverConfigCache) {
		const res = await getCourseCoverConfig();
		coverConfigCache = normalizeCourseCoverTemplatePack(res.data || res, { configType: 'course' });
	}
	return coverConfigCache;
}

function resolveCoverConfig(pack: CourseCoverTemplatePack, input: CourseCoverGenerateInput) {
	const templateId = String(input.templateId || '').trim();
	if (templateId) {
		const template = pack.templates.find((item) => item.id === templateId);
		if (template) {
			return normalizeCourseCoverConfig(template.config, DEFAULT_COURSE_COVER_CONFIG);
		}
	}
	return resolveCourseCoverConfigByCategory(pack, {
		category: String(input.category || '').trim(),
		sub_category: String(input.sub_category || '').trim(),
	});
}

function buildCoverPayload(input: CourseCoverGenerateInput) {
	const school = String(input.school || input.category || input.name || '').trim();
	const major = String(input.major || input.sub_category || input.name || '').trim();
	return {
		school,
		major,
		payload: {
			name: String(input.name || '').trim(),
			subject: String(input.subject || '').trim(),
			category: String(input.category || '').trim(),
			sub_category: String(input.sub_category || '').trim(),
			school,
			major,
			exam_year: String(input.exam_year || '').trim() || '待更新',
			answer_year: String(input.answer_year || '').trim() || '待更新',
		},
	};
}

function sanitizeFileName(value: string) {
	return value.replace(/[\\/:*?"<>|]+/g, '-').slice(0, 40);
}

export async function generateCourseCoverFile(input: CourseCoverGenerateInput): Promise<File | null> {
	const { school, major, payload } = buildCoverPayload(input);
	if (!school || !major) {
		return null;
	}

	let config = DEFAULT_COURSE_COVER_CONFIG;
	try {
		const pack = await fetchCourseCoverTemplatePack();
		config = resolveCoverConfig(pack, input);
	} catch {
		config = DEFAULT_COURSE_COVER_CONFIG;
	}

	const canvas = await renderCourseCover(config, payload);

	const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png', 0.96));
	if (!blob) {
		throw new Error('封面生成失败');
	}

	const fileName = `${sanitizeFileName(school)}-${sanitizeFileName(major)}-cover.png`;
	return new File([blob], fileName, { type: 'image/png' });
}

export async function generateAndUploadCourseCover(input: CourseCoverGenerateInput): Promise<string | null> {
	const coverFile = await generateCourseCoverFile(input);
	if (!coverFile) {
		return null;
	}
	const response = await uploadImage(coverFile);
	return response.url || response.imageUrl || null;
}
