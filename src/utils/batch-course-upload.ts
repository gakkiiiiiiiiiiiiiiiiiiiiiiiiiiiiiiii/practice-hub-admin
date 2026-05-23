const SUPPORTED_EXT = /\.(pdf|doc|docx)$/i;

export const DEFAULT_BATCH_COURSE_DEFAULTS = {
	subject: '',
	school: '',
	major: '',
	exam_year: '',
	answer_year: '',
	price: 0.5,
	agent_price: 0.1,
	is_free: 0,
	validity_days: 365 as number | null,
	allow_source_file: 0,
	introduction: '',
};

export const DEFAULT_FILENAME_TEMPLATE = '{category}-{course}';

export const FILENAME_TEMPLATE_FIELDS = [
	'category',
	'course',
	'subject',
	'school',
	'major',
	'exam_year',
	'answer_year',
] as const;

export type FilenameTemplateField = (typeof FILENAME_TEMPLATE_FIELDS)[number];

export const FILENAME_TEMPLATE_FIELD_LABELS: Record<FilenameTemplateField, string> = {
	category: '分类',
	course: '课程名',
	subject: '课程',
	school: '学校',
	major: '专业',
	exam_year: '真题年份',
	answer_year: '答案年份',
};

/** 文件名中 {category} 的命名规则：一级分类/二级分类 */
export const CATEGORY_FILENAME_RULE = '一级分类/二级分类';

export type BatchCourseDefaults = typeof DEFAULT_BATCH_COURSE_DEFAULTS;

export type BatchCourseFileItem = {
	file: File;
	fileName: string;
	fileStem: string;
	displayName: string;
};

export type BatchCoursePreviewGroup = {
	key: string;
	courseName: string;
	category: string;
	sub_category: string;
	subject?: string;
	school?: string;
	major?: string;
	exam_year?: string;
	answer_year?: string;
	files: BatchCourseFileItem[];
	parseError?: string;
};

export type BatchCourseUploadStatus = 'pending' | 'uploading' | 'success' | 'failed';

export type BatchCourseUploadItem = BatchCoursePreviewGroup & {
	status: BatchCourseUploadStatus;
	error?: string;
	courseId?: number;
};

export function isSupportedCourseFile(file: File) {
	const name = String(file?.name || '').trim();
	return SUPPORTED_EXT.test(name);
}

export function getFileExtension(fileName: string) {
	const match = String(fileName || '').match(/\.(pdf|doc|docx)$/i);
	if (!match) return '';
	return match[1].toLowerCase();
}

export function getFileStem(fileName: string) {
	const base = String(fileName || '').split(/[/\\]/).pop() || fileName;
	return base.replace(SUPPORTED_EXT, '');
}

function escapeRegExp(value: string) {
	return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function appendFilenameTemplateVariable(template: string, field: FilenameTemplateField) {
	const token = `{${field}}`;
	const current = String(template || '').trim();
	if (!current) {
		return token;
	}
	if (current.includes(token)) {
		return current;
	}
	if (current.endsWith('-') || current.endsWith('_')) {
		return `${current}${token}`;
	}
	return `${current}-${token}`;
}

export function buildFilenameParser(template: string) {
	const normalized = String(template || '').trim() || DEFAULT_FILENAME_TEMPLATE;
	if (!normalized.includes('{category}') || !normalized.includes('{course}')) {
		throw new Error('命名模板必须同时包含 {category} 和 {course}');
	}

	const placeholderPattern = FILENAME_TEMPLATE_FIELDS.map((field) => `\\{${field}\\}`).join('|');
	const splitRegex = new RegExp(`(${placeholderPattern})`, 'g');
	const tokens = normalized.split(splitRegex).filter((token) => token !== '');
	const fields: FilenameTemplateField[] = [];

	for (const token of tokens) {
		const matched = token.match(/^\{(\w+)\}$/);
		if (matched && FILENAME_TEMPLATE_FIELDS.includes(matched[1] as FilenameTemplateField)) {
			fields.push(matched[1] as FilenameTemplateField);
		}
	}

	let regex = '^';
	const placeholderCount = fields.length;
	for (const token of tokens) {
		const matched = token.match(/^\{(\w+)\}$/);
		if (matched && FILENAME_TEMPLATE_FIELDS.includes(matched[1] as FilenameTemplateField)) {
			const fieldIndex = fields.indexOf(matched[1] as FilenameTemplateField);
			regex += fieldIndex === placeholderCount - 1 ? '(.+)' : '(.+?)';
		} else {
			regex += escapeRegExp(token);
		}
	}
	regex += '$';

	return {
		template: normalized,
		regex: new RegExp(regex),
		fields,
	};
}

export function parseFilenameByTemplate(fileStem: string, template: string) {
	try {
		const parser = buildFilenameParser(template);
		const match = String(fileStem || '').trim().match(parser.regex);
		if (!match) {
			return null;
		}

		const result: Partial<Record<FilenameTemplateField, string>> = {};
		parser.fields.forEach((field, index) => {
			result[field] = String(match[index + 1] || '').trim();
		});
		if (!result.category || !result.course) {
			return null;
		}
		return result as Record<FilenameTemplateField, string> & { category: string; course: string };
	} catch {
		return null;
	}
}

export function resolveCategoryFromTree(parsedCategory: string, categoryTree: any[]) {
	const text = String(parsedCategory || '').trim();
	if (!text) {
		return { category: '', sub_category: '' };
	}

	// {category} 命名规则：一级分类/二级分类
	const slashIndex = text.indexOf('/');
	if (slashIndex > 0) {
		const category = text.slice(0, slashIndex).trim();
		const sub_category = text.slice(slashIndex + 1).trim();
		return {
			category,
			sub_category: sub_category || '',
		};
	}

	for (const parent of categoryTree || []) {
		const children = Array.isArray(parent?.children) ? parent.children : [];
		for (const child of children) {
			if (String(child?.name || '').trim() === text) {
				return {
					category: String(parent?.name || '').trim(),
					sub_category: text,
				};
			}
		}
	}

	for (const parent of categoryTree || []) {
		if (String(parent?.name || '').trim() === text) {
			return {
				category: text,
				sub_category: '',
			};
		}
	}

	return { category: text, sub_category: '' };
}

function buildDisplayName(courseName: string, fileStem: string, multiFile: boolean) {
	const course = String(courseName || '').trim();
	const stem = String(fileStem || '').trim();
	if (!multiFile) {
		return course || stem;
	}
	if (!stem || stem === course) {
		return course;
	}
	return `${course}-${stem}`;
}

function getRelativeFolderName(file: File) {
	const relativePath = String((file as File & { webkitRelativePath?: string }).webkitRelativePath || '').trim();
	if (!relativePath || !relativePath.includes('/')) {
		return '';
	}
	const parts = relativePath.split('/').filter(Boolean);
	return parts.length >= 2 ? parts[parts.length - 2] : '';
}

function createGroupKey(
	category: string,
	subCategory: string,
	courseName: string,
	extra?: Partial<Pick<BatchCoursePreviewGroup, 'subject' | 'school' | 'major' | 'exam_year' | 'answer_year'>>,
) {
	return [category, subCategory, courseName, extra?.subject, extra?.school, extra?.major, extra?.exam_year, extra?.answer_year]
		.filter((item) => item !== undefined && item !== '')
		.join('::');
}

export function buildBatchGroupsByCategory(
	files: File[],
	category: string,
	subCategory: string,
): BatchCoursePreviewGroup[] {
	const groupMap = new Map<string, BatchCoursePreviewGroup>();

	for (const file of files) {
		if (!isSupportedCourseFile(file)) continue;

		const folderName = getRelativeFolderName(file);
		const fileStem = getFileStem(file.name);
		const courseName = folderName || fileStem;
		const key = createGroupKey(category, subCategory, courseName);

		if (!groupMap.has(key)) {
			groupMap.set(key, {
				key,
				courseName,
				category,
				sub_category: subCategory,
				files: [],
			});
		}

		const group = groupMap.get(key)!;
		group.files.push({
			file,
			fileName: file.name,
			fileStem,
			displayName: '',
		});
	}

	return finalizeBatchGroups([...groupMap.values()]);
}

export function buildBatchGroupsByFilenameTemplate(
	files: File[],
	template: string,
	categoryTree: any[],
): BatchCoursePreviewGroup[] {
	const groupMap = new Map<string, BatchCoursePreviewGroup>();
	const invalidFiles: BatchCoursePreviewGroup[] = [];

	for (const file of files) {
		if (!isSupportedCourseFile(file)) continue;

		const fileStem = getFileStem(file.name);
		const parsed = parseFilenameByTemplate(fileStem, template);
		if (!parsed) {
			invalidFiles.push({
				key: `invalid-${file.name}`,
				courseName: fileStem,
				category: '',
				sub_category: '',
				files: [
					{
						file,
						fileName: file.name,
						fileStem,
						displayName: fileStem,
					},
				],
				parseError: `无法按模板解析：${file.name}`,
			});
			continue;
		}

		const resolved = resolveCategoryFromTree(parsed.category, categoryTree);
		const courseName = parsed.course;
		const parsedMeta = {
			subject: parsed.subject || '',
			school: parsed.school || '',
			major: parsed.major || '',
			exam_year: parsed.exam_year || '',
			answer_year: parsed.answer_year || '',
		};
		const key = createGroupKey(resolved.category, resolved.sub_category, courseName, parsedMeta);

		if (!groupMap.has(key)) {
			groupMap.set(key, {
				key,
				courseName,
				category: resolved.category,
				sub_category: resolved.sub_category,
				subject: parsedMeta.subject,
				school: parsedMeta.school,
				major: parsedMeta.major,
				exam_year: parsedMeta.exam_year,
				answer_year: parsedMeta.answer_year,
				files: [],
			});
		}

		groupMap.get(key)!.files.push({
			file,
			fileName: file.name,
			fileStem,
			displayName: '',
		});
	}

	return [...finalizeBatchGroups([...groupMap.values()]), ...invalidFiles];
}

function finalizeBatchGroups(groups: BatchCoursePreviewGroup[]) {
	return groups
		.map((group) => {
			const multiFile = group.files.length > 1;
			return {
				...group,
				files: group.files.map((item) => ({
					...item,
					displayName: buildDisplayName(group.courseName, item.fileStem, multiFile),
				})),
			};
		})
		.sort((a, b) => {
			const categoryCompare = `${a.category}/${a.sub_category}`.localeCompare(`${b.category}/${b.sub_category}`, 'zh-CN');
			if (categoryCompare !== 0) return categoryCompare;
			return a.courseName.localeCompare(b.courseName, 'zh-CN');
		});
}

export function mergeSelectedFiles(current: File[], incoming: File[]) {
	const map = new Map<string, File>();
	for (const file of current) {
		const relativePath = String((file as File & { webkitRelativePath?: string }).webkitRelativePath || file.name);
		map.set(`${relativePath}::${file.size}::${file.lastModified}`, file);
	}
	for (const file of incoming) {
		if (!isSupportedCourseFile(file)) continue;
		const relativePath = String((file as File & { webkitRelativePath?: string }).webkitRelativePath || file.name);
		map.set(`${relativePath}::${file.size}::${file.lastModified}`, file);
	}
	return [...map.values()];
}
