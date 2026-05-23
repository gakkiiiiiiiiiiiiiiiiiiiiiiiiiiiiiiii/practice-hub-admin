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

export function buildFilenameParser(template: string) {
	const normalized = String(template || '').trim() || DEFAULT_FILENAME_TEMPLATE;
	if (!normalized.includes('{category}') || !normalized.includes('{course}')) {
		throw new Error('命名模板必须同时包含 {category} 和 {course}');
	}

	const tokens = normalized.split(/(\{category\}|\{course\})/).filter((token) => token !== '');
	let regex = '^';
	const fields: Array<'category' | 'course'> = [];

	for (const token of tokens) {
		if (token === '{category}') {
			regex += '(.+?)';
			fields.push('category');
		} else if (token === '{course}') {
			regex += '(.+)';
			fields.push('course');
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

		const result: Record<'category' | 'course', string> = {
			category: '',
			course: '',
		};
		parser.fields.forEach((field, index) => {
			result[field] = String(match[index + 1] || '').trim();
		});
		if (!result.category || !result.course) {
			return null;
		}
		return result;
	} catch {
		return null;
	}
}

export function resolveCategoryFromTree(parsedCategory: string, categoryTree: any[]) {
	const text = String(parsedCategory || '').trim();
	if (!text) {
		return { category: '', sub_category: '' };
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

function createGroupKey(category: string, subCategory: string, courseName: string) {
	return [category, subCategory, courseName].join('::');
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
		const key = createGroupKey(resolved.category, resolved.sub_category, courseName);

		if (!groupMap.has(key)) {
			groupMap.set(key, {
				key,
				courseName,
				category: resolved.category,
				sub_category: resolved.sub_category,
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
