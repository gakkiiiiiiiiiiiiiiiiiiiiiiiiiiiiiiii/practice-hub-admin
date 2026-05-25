<template>
	<a-modal
		:open="open"
		title="批量上传课程"
		width="980px"
		:confirm-loading="uploading"
		:ok-text="uploading ? '上传中…' : '开始上传'"
		:ok-button-props="{ disabled: !canStartUpload }"
		:cancel-button-props="{ disabled: uploading }"
		@cancel="handleCancel"
		@ok="handleStartUpload"
	>
		<a-tabs v-model:activeKey="activeMode" @change="handleModeChange">
			<a-tab-pane key="category" tab="按分类批量上传">
				<a-form :label-col="{ span: 5 }" :wrapper-col="{ span: 18 }">
					<a-form-item label="目标分类" required>
						<a-cascader
							v-model:value="categoryValue"
							:options="categoryOptions"
							:field-names="{ label: 'label', value: 'value', children: 'children' }"
							:show-search="{ filter: cascaderFilter }"
							change-on-select
							allow-clear
							placeholder="请选择一级或二级分类"
							style="width: 100%"
						/>
						<div class="form-tip">选定分类下的所有文件将归入该分类；文件夹名作为课程名，单文件则使用文件名（不含扩展名）。</div>
					</a-form-item>
				</a-form>
			</a-tab-pane>
			<a-tab-pane key="filename" tab="按文件名解析">
				<a-form :label-col="{ span: 5 }" :wrapper-col="{ span: 18 }">
					<a-form-item label="命名模板" required>
						<a-input :value="filenameTemplate" readonly placeholder="{category}-{course}">
							<template #addonAfter>
								<a-button type="link" size="small" :disabled="!filenameTemplate" @click="clearFilenameTemplate">
									清空
								</a-button>
							</template>
						</a-input>
						<div class="form-tip">
							点击下方参数前的 <strong>+</strong> 添加变量；模板必须包含 <code>{category}</code> 与 <code>{course}</code>。
							<code>{category}</code> 使用「一级分类/二级分类」格式，例如文件
							<code>考研政治/真题-2024.pdf</code> 对应模板 <code>{category}-{course}</code>。
						</div>
					</a-form-item>
				</a-form>
			</a-tab-pane>
		</a-tabs>

		<div class="batch-upload-file-actions">
			<a-upload
				:show-upload-list="false"
				:before-upload="beforeSelectFiles"
				accept=".pdf,.doc,.docx"
				multiple
			>
				<a-button>
					<upload-outlined />
					选择文件
				</a-button>
			</a-upload>
			<a-button @click="triggerFolderSelect">
				<folder-open-outlined />
				选择文件夹
			</a-button>
			<a-button danger :disabled="selectedFiles.length === 0 || uploading" @click="clearSelectedFiles">
				清空文件
			</a-button>
			<span class="form-tip">已选 {{ selectedFiles.length }} 个文件</span>
			<input
				ref="folderInputRef"
				type="file"
				multiple
				webkitdirectory
				directory
				accept=".pdf,.doc,.docx"
				class="batch-upload-folder-input"
				@change="handleFolderSelect"
			/>
		</div>

		<a-collapse v-model:activeKey="defaultsExpanded" class="batch-upload-defaults">
			<a-collapse-panel key="defaults" header="默认参数（可修改，将应用于全部新课程）">
				<a-form :label-col="{ span: 6 }" :wrapper-col="{ span: 16 }">
					<a-row :gutter="16">
						<template v-if="activeMode === 'filename'">
							<a-col :span="12">
								<a-form-item>
									<template #label>
										<span class="template-variable-label">
											<a-button type="link" size="small" class="template-variable-add" @click="appendTemplateVariable('category')">
												<plus-outlined />
											</a-button>
											分类
										</span>
									</template>
									<span class="form-tip">从文件名解析，格式为「一级分类/二级分类」，如 考研政治/真题</span>
								</a-form-item>
							</a-col>
							<a-col :span="12">
								<a-form-item>
									<template #label>
										<span class="template-variable-label">
											<a-button type="link" size="small" class="template-variable-add" @click="appendTemplateVariable('course')">
												<plus-outlined />
											</a-button>
											课程名
										</span>
									</template>
									<span class="form-tip">从文件名解析为课程名称</span>
								</a-form-item>
							</a-col>
						</template>
						<a-col :span="12">
							<a-form-item>
								<template #label>
									<span v-if="activeMode === 'filename'" class="template-variable-label">
										<a-button type="link" size="small" class="template-variable-add" @click="appendTemplateVariable('subject')">
											<plus-outlined />
										</a-button>
										课程
									</span>
									<span v-else>课程</span>
								</template>
								<a-input v-model:value="defaults.subject" allow-clear placeholder="可选" />
							</a-form-item>
						</a-col>
						<a-col :span="12">
							<a-form-item>
								<template #label>
									<span v-if="activeMode === 'filename'" class="template-variable-label">
										<a-button type="link" size="small" class="template-variable-add" @click="appendTemplateVariable('school')">
											<plus-outlined />
										</a-button>
										学校
									</span>
									<span v-else>学校</span>
								</template>
								<a-input v-model:value="defaults.school" allow-clear placeholder="可选" />
							</a-form-item>
						</a-col>
						<a-col :span="12">
							<a-form-item>
								<template #label>
									<span v-if="activeMode === 'filename'" class="template-variable-label">
										<a-button type="link" size="small" class="template-variable-add" @click="appendTemplateVariable('major')">
											<plus-outlined />
										</a-button>
										专业
									</span>
									<span v-else>专业</span>
								</template>
								<a-input v-model:value="defaults.major" allow-clear placeholder="可选" />
							</a-form-item>
						</a-col>
						<a-col :span="12">
							<a-form-item>
								<template #label>
									<span v-if="activeMode === 'filename'" class="template-variable-label">
										<a-button type="link" size="small" class="template-variable-add" @click="appendTemplateVariable('exam_year')">
											<plus-outlined />
										</a-button>
										真题年份
									</span>
									<span v-else>真题年份</span>
								</template>
								<a-input v-model:value="defaults.exam_year" allow-clear placeholder="可选" />
							</a-form-item>
						</a-col>
						<a-col :span="12">
							<a-form-item>
								<template #label>
									<span v-if="activeMode === 'filename'" class="template-variable-label">
										<a-button type="link" size="small" class="template-variable-add" @click="appendTemplateVariable('answer_year')">
											<plus-outlined />
										</a-button>
										答案年份
									</span>
									<span v-else>答案年份</span>
								</template>
								<a-input v-model:value="defaults.answer_year" allow-clear placeholder="可选" />
							</a-form-item>
						</a-col>
						<a-col :span="12">
							<a-form-item label="用户售价">
								<a-input-number v-model:value="defaults.price" :min="0" :step="0.1" style="width: 100%" />
							</a-form-item>
						</a-col>
						<a-col :span="12">
							<a-form-item label="代理商售价">
								<a-input-number v-model:value="defaults.agent_price" :min="0" :step="0.1" style="width: 100%" />
							</a-form-item>
						</a-col>
						<a-col :span="12">
							<a-form-item label="是否免费">
								<a-radio-group v-model:value="defaults.is_free">
									<a-radio :value="0">付费</a-radio>
									<a-radio :value="1">免费</a-radio>
								</a-radio-group>
							</a-form-item>
						</a-col>
						<a-col :span="12">
							<a-form-item label="有效期(天)">
								<a-input-number
									v-model:value="defaults.validity_days"
									:min="1"
									:precision="0"
									:disabled="defaults.is_free === 1"
									style="width: 100%"
								/>
							</a-form-item>
						</a-col>
						<a-col :span="12">
							<a-form-item label="源文件查看">
								<a-radio-group v-model:value="defaults.allow_source_file">
									<a-radio :value="0">关闭</a-radio>
									<a-radio :value="1">允许</a-radio>
								</a-radio-group>
							</a-form-item>
						</a-col>
					</a-row>
				</a-form>
			</a-collapse-panel>
		</a-collapse>

		<div class="batch-upload-preview">
			<div class="batch-upload-preview__header">
				<span>解析预览（{{ previewGroups.length }} 门课程）</span>
				<span v-if="invalidPreviewCount > 0" class="batch-upload-preview__warn">
					{{ invalidPreviewCount }} 个文件无法解析
				</span>
			</div>
			<a-table
				:data-source="previewGroups"
				:columns="previewColumns"
				:pagination="previewGroups.length > 8 ? { pageSize: 8 } : false"
				size="small"
				row-key="key"
				:scroll="{ y: 280 }"
			>
				<template #bodyCell="{ column, record }">
					<template v-if="column.key === 'courseName'">
						<a-input
							v-model:value="record.courseName"
							size="small"
							:disabled="!!record.parseError || uploading"
							@change="handleCourseNameChange(record)"
						/>
					</template>
					<template v-else-if="column.key === 'category'">
						<span>{{ record.category || '—' }}</span>
						<span v-if="record.sub_category"> / {{ record.sub_category }}</span>
						<span v-if="activeMode === 'category' && record.category" class="form-tip">（手动选择）</span>
					</template>
					<template v-else-if="column.key === 'files'">
						<a-tooltip :title="getFileListText(record)">
							<span>{{ record.files.length }} 个文件</span>
						</a-tooltip>
					</template>
					<template v-else-if="column.key === 'status'">
						<a-tag v-if="record.parseError" color="error">解析失败</a-tag>
						<a-tag v-else-if="record.status === 'success'" color="success">成功</a-tag>
						<a-tag v-else-if="record.status === 'failed'" color="error">失败</a-tag>
						<a-tag v-else-if="record.status === 'uploading'" color="processing">上传中</a-tag>
						<a-tag v-else color="default">待上传</a-tag>
					</template>
					<template v-else-if="column.key === 'message'">
						<span class="batch-upload-message">{{ record.error || record.parseError || '—' }}</span>
					</template>
				</template>
			</a-table>
		</div>

		<div v-if="uploading" class="batch-upload-progress">
			<a-progress :percent="uploadPercent" status="active" />
			<div class="form-tip">{{ uploadStage }}</div>
		</div>
	</a-modal>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { message } from 'ant-design-vue';
import { FolderOpenOutlined, PlusOutlined, UploadOutlined } from '@ant-design/icons-vue';
import { createCourse, createCourseFile, warmupCoursePreviewCacheAfterSave, getCourseDefaultParams } from '@/api/course';
import { uploadCourseFile } from '@/api/upload';
import { generateAndUploadCourseCover } from '@/utils/course-auto-cover';
import {
	DEFAULT_BATCH_COURSE_DEFAULTS,
	DEFAULT_FILENAME_TEMPLATE,
	appendFilenameTemplateVariable,
	buildBatchGroupsByCategory,
	buildBatchGroupsByFilenameTemplate,
	mergeSelectedFiles,
	type BatchCoursePreviewGroup,
	type BatchCourseUploadItem,
	type FilenameTemplateField,
	type BatchCourseDefaults,
} from '@/utils/batch-course-upload';
import {
	FALLBACK_COURSE_DEFAULT_PARAMS,
	normalizeCourseDefaultParams,
} from '@/utils/course-default-params';

const props = defineProps<{
	open: boolean;
	categoryTree: any[];
	defaultParamsKey?: number;
}>();

const emit = defineEmits<{
	(e: 'update:open', value: boolean): void;
	(e: 'success'): void;
}>();

const activeMode = ref<'category' | 'filename'>('category');
const categoryValue = ref<string[]>([]);
const filenameTemplate = ref(DEFAULT_FILENAME_TEMPLATE);
const selectedFiles = ref<File[]>([]);
const previewGroups = ref<BatchCourseUploadItem[]>([]);
const defaults = ref<BatchCourseDefaults>({ ...DEFAULT_BATCH_COURSE_DEFAULTS, introduction: '' });
const defaultsExpanded = ref<string[]>([]);
const uploading = ref(false);
const uploadPercent = ref(0);
const uploadStage = ref('');
const folderInputRef = ref<HTMLInputElement | null>(null);

const categoryOptions = computed(() =>
	(props.categoryTree || []).map((parent) => ({
		label: parent.status === 0 ? `${parent.name}（已禁用）` : parent.name,
		value: parent.name,
		children: Array.isArray(parent.children)
			? parent.children.map((child: any) => ({
					label: child.status === 0 ? `${child.name}（已禁用）` : child.name,
					value: child.name,
				}))
			: [],
	})),
);

const previewColumns = [
	{ title: '课程名称', key: 'courseName', width: 220 },
	{ title: '分类', key: 'category', width: 180 },
	{ title: '文件', key: 'files', width: 90 },
	{ title: '状态', key: 'status', width: 90 },
	{ title: '说明', key: 'message' },
];

const invalidPreviewCount = computed(() => previewGroups.value.filter((item) => item.parseError).length);
const validPreviewGroups = computed(() => previewGroups.value.filter((item) => !item.parseError));

const canStartUpload = computed(() => {
	if (uploading.value) return false;
	if (selectedFiles.value.length === 0) return false;
	if (validPreviewGroups.value.length === 0) return false;
	if (activeMode.value === 'category' && categoryValue.value.length === 0) return false;
	if (
		activeMode.value === 'filename' &&
		(!filenameTemplate.value.includes('{category}') || !filenameTemplate.value.includes('{course}'))
	) {
		return false;
	}
	return validPreviewGroups.value.every((item) => String(item.courseName || '').trim());
});

const cascaderFilter = (inputValue: string, path: any[]) =>
	path.some((option) => String(option.label || '').toLowerCase().includes(inputValue.toLowerCase()));

const appendTemplateVariable = (field: FilenameTemplateField) => {
	if (activeMode.value !== 'filename') return;
	filenameTemplate.value = appendFilenameTemplateVariable(filenameTemplate.value, field);
};

const clearFilenameTemplate = () => {
	filenameTemplate.value = '';
};

const rebuildPreview = () => {
	if (selectedFiles.value.length === 0) {
		previewGroups.value = [];
		return;
	}

	let groups: BatchCoursePreviewGroup[] = [];
	if (activeMode.value === 'category') {
		const category = categoryValue.value[0] || '';
		const subCategory = categoryValue.value[1] || '';
		groups = buildBatchGroupsByCategory(selectedFiles.value, category, subCategory);
	} else {
		try {
			groups = buildBatchGroupsByFilenameTemplate(
				selectedFiles.value,
				filenameTemplate.value,
				props.categoryTree || [],
			);
		} catch (error: any) {
			message.error(error?.message || '命名模板无效');
			previewGroups.value = [];
			return;
		}
	}

	previewGroups.value = groups.map((group) => ({
		...group,
		status: 'pending' as const,
		error: '',
		courseId: undefined,
	}));
};

watch(
	() => [props.open, activeMode.value, categoryValue.value, filenameTemplate.value, selectedFiles.value],
	() => {
		if (!props.open) return;
		rebuildPreview();
	},
	{ deep: true },
);

watch(
	() => defaults.value.is_free,
	(value) => {
		if (value === 1) {
			defaults.value.validity_days = null;
		} else if (defaults.value.validity_days == null) {
			defaults.value.validity_days = 365;
		}
	},
);

const beforeSelectFiles = (file: File) => {
	selectedFiles.value = mergeSelectedFiles(selectedFiles.value, [file]);
	return false;
};

const triggerFolderSelect = () => {
	folderInputRef.value?.click();
};

const handleFolderSelect = (event: Event) => {
	const input = event.target as HTMLInputElement;
	const files = Array.from(input.files || []);
	if (files.length === 0) return;
	selectedFiles.value = mergeSelectedFiles(selectedFiles.value, files);
	input.value = '';
};

const clearSelectedFiles = () => {
	selectedFiles.value = [];
	previewGroups.value = [];
};

const handleModeChange = () => {
	previewGroups.value = [];
};

const handleCourseNameChange = (record: BatchCourseUploadItem) => {
	const multiFile = record.files.length > 1;
	record.files = record.files.map((item) => ({
		...item,
		displayName: multiFile
			? `${String(record.courseName || '').trim()}-${item.fileStem}`
			: String(record.courseName || '').trim() || item.fileStem,
	}));
};

const getFileListText = (record: BatchCourseUploadItem) =>
	record.files.map((item) => `${item.displayName} (${item.fileName})`).join('\n');

const buildSubmitPayload = (
	group: BatchCourseUploadItem,
	primary: {
		fileUrl: string;
		fileName: string;
		fileType: string;
		fileSize: number;
	},
) => {
	const payload: Record<string, unknown> = {
		name: String(group.courseName || '').trim(),
		content_type: 'file',
		status: 0,
		price: defaults.value.price,
		agent_price: defaults.value.agent_price,
		is_free: defaults.value.is_free,
		allow_source_file: defaults.value.allow_source_file,
		file_url: primary.fileUrl,
		file_name: primary.fileName,
		file_type: primary.fileType,
		file_size: primary.fileSize,
	};

	if (group.category) payload.category = group.category;
	if (group.sub_category) payload.sub_category = group.sub_category;
	const subject = group.subject || defaults.value.subject;
	const school = group.school || defaults.value.school;
	const major = group.major || defaults.value.major;
	const examYear = group.exam_year || defaults.value.exam_year;
	const answerYear = group.answer_year || defaults.value.answer_year;
	if (subject) payload.subject = subject;
	if (school) payload.school = school;
	if (major) payload.major = major;
	if (examYear) payload.exam_year = examYear;
	if (answerYear) payload.answer_year = answerYear;
	if (defaults.value.introduction) payload.introduction = defaults.value.introduction;
	payload.validity_days = defaults.value.is_free === 1 ? null : defaults.value.validity_days ?? 365;
	return payload;
};

const uploadSingleGroup = async (group: BatchCourseUploadItem) => {
	const uploadedFiles: Array<{
		displayName: string;
		fileUrl: string;
		fileName: string;
		fileType: string;
		fileSize: number;
	}> = [];

	for (let index = 0; index < group.files.length; index += 1) {
		const item = group.files[index];
		uploadStage.value = `正在上传文件 ${item.fileName}（${index + 1}/${group.files.length}）`;
		const result = await uploadCourseFile(item.file);
		uploadedFiles.push({
			displayName: item.displayName,
			fileUrl: result.fileUrl || result.url,
			fileName: result.fileName || item.fileName,
			fileType: result.fileType,
			fileSize: item.file.size || 0,
		});
	}

	const primary = uploadedFiles[0];
	uploadStage.value = `正在生成封面：${group.courseName}`;
	const coverImg = await generateAndUploadCourseCover({
		name: String(group.courseName || '').trim(),
		subject: group.subject || defaults.value.subject,
		category: group.category,
		sub_category: group.sub_category,
		school: group.school || defaults.value.school,
		major: group.major || defaults.value.major,
		exam_year: group.exam_year || defaults.value.exam_year,
		answer_year: group.answer_year || defaults.value.answer_year,
	});

	uploadStage.value = `正在创建课程：${group.courseName}`;
	const payload = buildSubmitPayload(group, primary);
	if (coverImg) {
		payload.cover_img = coverImg;
	}
	const createdRes = await createCourse(payload);
	const created = (createdRes as any)?.data ?? createdRes;
	const courseId = Number(created?.id);
	if (!courseId) {
		throw new Error('创建课程失败：未返回课程 ID');
	}

	for (let index = 1; index < uploadedFiles.length; index += 1) {
		const fileItem = uploadedFiles[index];
		await createCourseFile(courseId, {
			display_name: fileItem.displayName,
			file_url: fileItem.fileUrl,
			file_name: fileItem.fileName,
			file_type: fileItem.fileType,
			file_size: fileItem.fileSize,
			sort: index,
		});
	}

	try {
		await warmupCoursePreviewCacheAfterSave(courseId, false);
	} catch (error) {
		console.warn('批量上传后触发图片缓存失败:', error);
	}

	group.courseId = courseId;
};

const handleStartUpload = async () => {
	if (!canStartUpload.value) {
		if (activeMode.value === 'category' && categoryValue.value.length === 0) {
			message.warning('请先选择目标分类');
		} else if (validPreviewGroups.value.length === 0) {
			message.warning('没有可上传的有效课程，请检查文件命名或模板');
		}
		return;
	}

	uploading.value = true;
	uploadPercent.value = 0;
	const validGroups = validPreviewGroups.value;
	let successCount = 0;
	let failedCount = 0;

	try {
		for (let index = 0; index < validGroups.length; index += 1) {
			const group = validGroups[index];
			group.status = 'uploading';
			group.error = '';
			uploadStage.value = `正在处理 ${index + 1}/${validGroups.length}：${group.courseName}`;
			uploadPercent.value = Math.round((index / validGroups.length) * 100);

			try {
				await uploadSingleGroup(group);
				group.status = 'success';
				successCount += 1;
			} catch (error: any) {
				group.status = 'failed';
				group.error = error?.message || '上传失败';
				failedCount += 1;
			}
		}

		uploadPercent.value = 100;
		uploadStage.value = '批量上传完成';

		if (failedCount === 0) {
			message.success(`成功上传 ${successCount} 门课程`);
			emit('success');
			uploading.value = false;
			emit('update:open', false);
			resetState();
			return;
		}

		message.warning(`上传完成：成功 ${successCount} 门，失败 ${failedCount} 门`);
		if (successCount > 0) {
			emit('success');
		}
	} finally {
		uploading.value = false;
	}
};

const loadBatchDefaults = async () => {
	try {
		const res = await getCourseDefaultParams();
		const params = normalizeCourseDefaultParams((res as any)?.data ?? res);
		defaults.value = { ...params, introduction: '' };
	} catch (error) {
		console.warn('加载课程默认参数失败，使用内置默认值', error);
		defaults.value = { ...FALLBACK_COURSE_DEFAULT_PARAMS, introduction: '' };
	}
};

const resetState = () => {
	activeMode.value = 'category';
	categoryValue.value = [];
	filenameTemplate.value = DEFAULT_FILENAME_TEMPLATE;
	selectedFiles.value = [];
	previewGroups.value = [];
	defaults.value = { ...DEFAULT_BATCH_COURSE_DEFAULTS, introduction: '' };
	defaultsExpanded.value = [];
	uploading.value = false;
	uploadPercent.value = 0;
	uploadStage.value = '';
};

const handleCancel = () => {
	if (uploading.value) {
		message.warning('上传进行中，请等待当前任务完成');
		return;
	}
	emit('update:open', false);
	resetState();
};

watch(
	() => props.open,
	async (value) => {
		if (value) {
			resetState();
			await loadBatchDefaults();
			return;
		}
		if (!uploading.value) {
			resetState();
		}
	},
);

watch(
	() => props.defaultParamsKey,
	async (value, oldValue) => {
		if (value === oldValue || !props.open) return;
		await loadBatchDefaults();
	},
);
</script>

<style scoped>
.batch-upload-file-actions {
	display: flex;
	align-items: center;
	flex-wrap: wrap;
	gap: 8px;
	margin: 12px 0 16px;
}

.batch-upload-folder-input {
	display: none;
}

.batch-upload-defaults {
	margin-bottom: 16px;
}

.batch-upload-preview__header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-bottom: 8px;
	font-weight: 500;
}

.batch-upload-preview__warn {
	color: #ff4d4f;
	font-size: 12px;
}

.batch-upload-message {
	color: #ff4d4f;
	word-break: break-all;
}

.batch-upload-progress {
	margin-top: 16px;
}

.form-tip {
	color: rgba(0, 0, 0, 0.45);
	font-size: 12px;
	line-height: 1.6;
}

.form-tip code {
	padding: 0 4px;
	background: rgba(0, 0, 0, 0.04);
	border-radius: 4px;
}

.template-variable-label {
	display: inline-flex;
	align-items: center;
	gap: 2px;
}

.template-variable-add {
	padding: 0 4px;
	height: 22px;
	line-height: 22px;
}
</style>
