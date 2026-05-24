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
	content_type: 'normal' | 'file';
};

export const FALLBACK_COURSE_DEFAULT_PARAMS: CourseDefaultParams = {
	subject: '',
	school: '',
	major: '',
	exam_year: '',
	answer_year: '',
	price: 0.5,
	agent_price: 0.1,
	is_free: 0,
	validity_days: 365,
	allow_source_file: 0,
	content_type: 'normal',
};

export const normalizeCourseDefaultParams = (input?: Partial<CourseDefaultParams> | null): CourseDefaultParams => {
	const source = input || {};
	const isFree = Number(source.is_free ?? FALLBACK_COURSE_DEFAULT_PARAMS.is_free) === 1 ? 1 : 0;
	const contentType = source.content_type === 'file' ? 'file' : 'normal';
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
		content_type: contentType,
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
});
