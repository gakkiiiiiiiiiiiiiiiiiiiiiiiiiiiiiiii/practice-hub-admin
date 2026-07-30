interface CourseCoverSyncTemplate {
	id: string;
	bindCategory?: string[];
}

interface CourseCoverSyncCourse {
	category?: string;
	sub_category?: string;
}

function normalizeCategory(value?: string) {
	return String(value || '').trim();
}

/**
 * 判断课程是否属于当前模板的同步范围。
 *
 * 已绑定分类的模板必须同时满足“实际解析到该模板”和“命中绑定分类”，
 * 避免模板作为历史兜底模板时把其他分类的课程一并同步。
 */
export function isCourseCoverSyncTarget(
	currentTemplate: CourseCoverSyncTemplate,
	resolvedTemplate: CourseCoverSyncTemplate,
	course: CourseCoverSyncCourse,
) {
	if (resolvedTemplate.id !== currentTemplate.id) return false;

	const [boundCategory, boundSubCategory] = (currentTemplate.bindCategory || []).map(normalizeCategory);
	if (!boundCategory) return true;
	if (normalizeCategory(course.category) !== boundCategory) return false;

	return !boundSubCategory || normalizeCategory(course.sub_category) === boundSubCategory;
}
