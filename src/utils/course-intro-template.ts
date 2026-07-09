export type CourseIntroTemplateItem = {
	id: string;
	name: string;
	bindCategory: string[];
	template: string;
};

export type CourseIntroTemplatePack = {
	activeTemplateId: string;
	templates: CourseIntroTemplateItem[];
	template: string;
};

export const DEFAULT_COURSE_INTRO_TEMPLATE = [
	'<h3>课程介绍</h3>',
	'<p>本课程包含系统整理的复习资料与配套练习内容，适合用于日常复习、考前冲刺和查漏补缺。</p>',
	'<p>购买或激活后，可在小程序内查看课程内容，并根据课程类型进行在线练习或文件学习。</p>',
].join('');

export function createCourseIntroTemplateId() {
	return `intro_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function createCourseIntroTemplate(
	name: string,
	template: string,
	options?: {
		id?: string;
		bindCategory?: string[];
	},
): CourseIntroTemplateItem {
	return {
		id: options?.id || createCourseIntroTemplateId(),
		name: String(name || '').trim() || '课程介绍模板',
		bindCategory: Array.isArray(options?.bindCategory) ? options.bindCategory.filter(Boolean).slice(0, 2) : [],
		template: String(template || '').trim(),
	};
}

export function normalizeCourseIntroTemplatePack(input: any): CourseIntroTemplatePack {
	const legacyTemplate = typeof input === 'string' ? input : input?.template;
	const rawTemplates = Array.isArray(input?.templates) ? input.templates : [];
	const templates = rawTemplates
		.map((item: any, index: number) =>
			createCourseIntroTemplate(
				item?.name || `课程介绍模板${index ? index + 1 : ''}`,
				item?.template ?? item?.content ?? '',
				{
					id: String(item?.id || `intro_${index + 1}`).trim(),
					bindCategory: item?.bindCategory,
				},
			),
		)
		.filter((item: CourseIntroTemplateItem) => item.id && item.name);

	if (!templates.length) {
		templates.push(
			createCourseIntroTemplate('默认课程介绍', legacyTemplate || DEFAULT_COURSE_INTRO_TEMPLATE, {
				id: 'default',
			}),
		);
	}

	const activeTemplateId = templates.some((item) => item.id === input?.activeTemplateId)
		? input.activeTemplateId
		: templates[0].id;
	const activeTemplate = templates.find((item) => item.id === activeTemplateId) || templates[0];

	return {
		activeTemplateId,
		templates,
		template: activeTemplate?.template || DEFAULT_COURSE_INTRO_TEMPLATE,
	};
}

export function resolveCourseIntroTemplateByCategory(
	input: CourseIntroTemplatePack | any,
	payload: {
		category?: string;
		sub_category?: string;
	},
) {
	const pack = normalizeCourseIntroTemplatePack(input);
	const category = String(payload.category || '').trim();
	const subCategory = String(payload.sub_category || '').trim();
	const exactMatch = pack.templates.find((item) => {
		const bind = item.bindCategory || [];
		return bind[0] === category && bind[1] === subCategory;
	});
	const primaryMatch = pack.templates.find((item) => {
		const bind = item.bindCategory || [];
		return bind[0] === category && !bind[1];
	});
	const active = pack.templates.find((item) => item.id === pack.activeTemplateId) || pack.templates[0];
	return (exactMatch || primaryMatch || active)?.template || DEFAULT_COURSE_INTRO_TEMPLATE;
}
