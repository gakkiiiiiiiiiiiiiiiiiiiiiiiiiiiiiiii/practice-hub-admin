export type CourseDefaultParams = {
	subject: string;
	school: string;
	major: string;
	exam_year: string;
	answer_year: string;
	price: number;
	agent_price: number;
	is_free: number;
	validity_days: number | null;
	allow_source_file: number;
	trial_preview_page_count: number;
	content_type: 'normal' | 'file' | 'paper_exam';
	status: number;
};

export const FALLBACK_COURSE_DEFAULT_PARAMS: CourseDefaultParams = {
	subject: '',
	school: '',
	major: '',
	exam_year: '',
	answer_year: '',
	price: 1,
	agent_price: 1,
	is_free: 0,
	validity_days: 365,
	allow_source_file: 0,
	trial_preview_page_count: 3,
	content_type: 'normal',
	status: 0,
};

export const normalizeCourseDefaultParams = (input?: Partial<CourseDefaultParams> | null): CourseDefaultParams => {
	const source = input || {};
	const isFree = Number(source.is_free ?? FALLBACK_COURSE_DEFAULT_PARAMS.is_free) === 1 ? 1 : 0;
	const rawContentType = String(source.content_type || 'normal');
	const contentType: CourseDefaultParams['content_type'] =
		rawContentType === 'file' || rawContentType === 'paper_exam' ? rawContentType : 'normal';
	return {
		subject: String(source.subject || '').trim(),
		school: String(source.school || '').trim(),
		major: String(source.major || '').trim(),
		exam_year: String(source.exam_year || '').trim(),
		answer_year: String(source.answer_year || '').trim(),
		price: Math.max(0, Number(source.price ?? FALLBACK_COURSE_DEFAULT_PARAMS.price) || 0),
		agent_price: Math.max(0, Number(source.agent_price ?? FALLBACK_COURSE_DEFAULT_PARAMS.agent_price) || 0),
		is_free: isFree,
		validity_days: isFree === 1 ? null : Math.max(1, Number(source.validity_days ?? FALLBACK_COURSE_DEFAULT_PARAMS.validity_days) || 365),
		allow_source_file: Number(source.allow_source_file ?? FALLBACK_COURSE_DEFAULT_PARAMS.allow_source_file) === 1 ? 1 : 0,
		trial_preview_page_count: Math.min(
			50,
			Math.max(
				0,
				Math.trunc(Number(source.trial_preview_page_count ?? FALLBACK_COURSE_DEFAULT_PARAMS.trial_preview_page_count) || 0),
			),
		),
		content_type: contentType,
		status: Number(source.status ?? FALLBACK_COURSE_DEFAULT_PARAMS.status) === 1 ? 1 : 0,
	};
};

export const buildNewCourseFormDefaults = (params: CourseDefaultParams) => ({
	name: '',
	subject: params.subject,
	category: '',
	sub_category: '',
	school: params.school,
	major: params.major,
	exam_year: params.exam_year,
	answer_year: params.answer_year,
	cover_img: '',
	price: params.price,
	agent_price: params.agent_price,
	is_free: params.is_free,
	validity_days: params.validity_days,
	introduction: '',
	content_type: params.content_type,
	file_url: '',
	file_name: '',
	file_type: '',
	file_size: 0,
	allow_source_file: params.allow_source_file,
	trial_preview_page_count: params.trial_preview_page_count,
});
