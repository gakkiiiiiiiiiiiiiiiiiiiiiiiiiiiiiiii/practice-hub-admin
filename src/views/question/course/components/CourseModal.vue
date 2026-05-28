<template>
	<a-modal
		:open="open"
		:title="record ? '编辑课程' : '新增课程'"
		@cancel="handleCancel"
		@ok="handleSubmit"
		:confirmLoading="loading"
		width="720px"
	>
		<a-form ref="formRef" :model="formState" :rules="rules" :label-col="{ span: 6 }" :wrapper-col="{ span: 18 }">
			<a-form-item label="课程名称" name="name">
				<a-input v-model:value="formState.name" placeholder="请输入课程名称" />
			</a-form-item>
			<a-form-item label="课程类型" name="content_type">
				<a-radio-group v-model:value="formState.content_type">
					<a-radio value="normal" :disabled="isEditingExistingFileCourseWithoutAdmin">普通题库（章节+题目）</a-radio>
					<a-radio value="file">文件课程（PDF/Word 直接查看）</a-radio>
				</a-radio-group>
				<div v-if="isEditingExistingFileCourseWithoutAdmin" class="form-tip">
					当前账号不能删除已有课程文件，因此不能将文件课程改为普通题库。
				</div>
			</a-form-item>
			<a-form-item v-if="formState.content_type === 'file'" label="课程文件" name="course_files">
				<div class="course-files-panel">
					<a-alert
						v-if="pdfHealthWarnings.length"
						type="warning"
						show-icon
						class="pdf-health-alert"
					>
						<template #message>检测到 PDF 文件结构不规范</template>
						<template #description>
							<ul class="pdf-health-alert__list">
								<li v-for="item in pdfHealthWarnings" :key="`${item.fileId || item.fileUrl}`">
									<strong>{{ item.displayName || '未命名文件' }}</strong>
									<span v-if="item.pageCount">（约 {{ item.pageCount }} 页）</span>
									：{{ item.warnings[0] }}
								</li>
							</ul>
							<div class="form-tip">
								在线预览会使用 Ghostscript 兜底，但建议用 Adobe Acrobat 或 WPS「另存为 PDF」重新导出后上传，以获得最佳兼容性。
							</div>
						</template>
					</a-alert>
					<a-spin :spinning="pdfHealthLoading" tip="正在检测 PDF 文件结构…">
					<a-table
						:data-source="visibleCourseFileRows"
						:columns="courseFileColumns"
						:pagination="false"
						size="small"
						row-key="key"
					>
						<template #bodyCell="{ column, record, index }">
							<template v-if="column.key === 'display_name'">
								<a-input
									v-model:value="record.display_name"
									placeholder="展示名称（必填）"
									:maxlength="100"
								/>
							</template>
							<template v-else-if="column.key === 'file_name'">
								<span class="course-file-meta">{{ record.file_name || '—' }}</span>
							</template>
							<template v-else-if="column.key === 'file_type'">
								<span class="course-file-meta">{{ (record.file_type || '').toUpperCase() }}</span>
							</template>
							<template v-else-if="column.key === 'sort'">
								<a-input-number
									v-model:value="record.sort"
									:min="0"
									:precision="0"
									style="width: 72px"
								/>
							</template>
							<template v-else-if="column.key === 'actions'">
								<a-space size="small">
									<a-button
										v-if="canDownloadCourseFile && record.file_url"
										type="link"
										size="small"
										@click="openCourseFileUrl(record.file_url)"
									>
										下载
									</a-button>
									<a-button
										v-if="canRemoveCourseFileRow(record)"
										type="link"
										size="small"
										danger
										@click="removeCourseFileRow(record.key)"
									>
										删除
									</a-button>
								</a-space>
							</template>
						</template>
					</a-table>
					<div class="course-files-panel__toolbar">
						<a-upload
							:show-upload-list="false"
							:before-upload="beforeCourseFileUpload"
							:custom-request="(opts) => handleCourseFileUpload(opts)"
							accept=".pdf,.doc,.docx"
							multiple
						>
							<a-button type="dashed">
								<upload-outlined />
								添加文件
							</a-button>
						</a-upload>
						<span class="form-tip">可上传多个 PDF/Word；展示名称将显示在小程序资料列表中</span>
					</div>
					<div v-if="courseFileUploading" class="course-file-upload-progress">
						<a-progress :percent="courseFileUploadProgress" size="small" />
						<div class="form-tip">{{ courseFileUploadStage || '正在上传课程文件，请勿关闭窗口' }}</div>
					</div>
					</a-spin>
				</div>
			</a-form-item>
			<a-form-item v-if="formState.content_type === 'file'" label="源文件查看">
				<a-radio-group v-model:value="formState.allow_source_file">
					<a-radio :value="1">允许用户查看源文件</a-radio>
					<a-radio :value="0">关闭</a-radio>
				</a-radio-group>
				<div class="form-tip">关闭后，小程序端不展示“查看完整文件/查看文件”入口，但仍可小程序内在线预览。</div>
			</a-form-item>
			<a-form-item v-if="showCoursePreviewSamples" label="前三页预览">
				<div v-if="previewableCourseFiles.length > 1" class="preview-file-switch">
					<span class="form-tip">选择文件：</span>
					<a-select
						v-model:value="selectedPreviewFileId"
						style="min-width: 220px"
						:options="previewableCourseFiles.map((f) => ({ value: f.id, label: f.display_name }))"
						@change="scheduleLoadPreviewSamples(0)"
					/>
				</div>
				<a-spin :spinning="previewSampleLoading">
					<div v-if="previewSampleHint" class="form-tip preview-sample-hint">{{ previewSampleHint }}</div>
					<div v-if="previewSampleItems.length" class="preview-sample-list">
						<div
							v-for="item in previewSampleItems"
							:key="item.pageNum"
							class="preview-sample-item"
						>
							<div class="preview-sample-item__title">第 {{ item.pageNum }} 页</div>
							<a-spin v-if="item.loading" size="small" />
							<div v-else-if="item.error" class="form-tip">{{ item.error }}</div>
							<template v-else>
								<a-image
									:src="item.src"
									:width="168"
									:height="224"
									class="preview-sample-item__image"
									:preview="{ src: item.src }"
								/>
								<a-button type="link" size="small" @click="downloadPreviewSample(item.pageNum)">
									下载
								</a-button>
							</template>
						</div>
					</div>
					<div v-else-if="!previewSampleLoading && previewSampleSupported" class="form-tip">
						暂无可预览页面，请先在课程列表生成图片缓存
					</div>
				</a-spin>
			</a-form-item>
			<a-form-item label="课程" name="subject">
				<a-input v-model:value="formState.subject" placeholder="请输入课程（如：数学、英语等）" />
			</a-form-item>
			<a-form-item label="课程分类" name="category">
				<a-cascader
					v-model:value="categoryCascaderValue"
					:options="cascaderOptions"
					:field-names="{ label: 'label', value: 'value', children: 'children' }"
					placeholder="请选择课程分类"
					allow-clear
					:show-search="{ filter: cascaderFilter }"
					style="width: 100%"
				/>
			</a-form-item>
			<a-form-item :wrapper-col="{ span: 18, offset: 6 }" class="extra-fields-toggle-row">
				<a-button type="link" class="extra-fields-toggle" @click="extraFieldsExpanded = !extraFieldsExpanded">
					<template v-if="extraFieldsExpanded">
						<up-outlined />
						收起学校 / 专业 / 真题年份 / 答案年份
					</template>
					<template v-else>
						<down-outlined />
						展开学校 / 专业 / 真题年份 / 答案年份
					</template>
				</a-button>
			</a-form-item>
			<template v-if="extraFieldsExpanded">
				<a-form-item label="学校" name="school">
					<a-input v-model:value="formState.school" placeholder="请输入学校（如：北京大学等）" />
				</a-form-item>
				<a-form-item label="专业" name="major">
					<a-input v-model:value="formState.major" placeholder="请输入专业（如：计算机科学与技术等）" />
				</a-form-item>
				<a-form-item label="真题年份" name="exam_year">
					<a-input v-model:value="formState.exam_year" placeholder="请输入真题年份（如：2024）" />
				</a-form-item>
				<a-form-item label="答案年份" name="answer_year">
					<a-input v-model:value="formState.answer_year" placeholder="请输入答案年份（如：2024）" />
				</a-form-item>
			</template>
			<a-form-item label="封面方式">
				<a-radio-group v-model:value="coverMode">
					<a-radio value="manual">手动上传</a-radio>
					<a-radio value="auto">自动生成</a-radio>
				</a-radio-group>
			</a-form-item>
				<a-form-item label="封面图" name="cover_img">
				<template v-if="coverMode === 'manual'">
					<a-upload
						v-model:file-list="fileList"
						:before-upload="beforeUpload"
						:custom-request="handleUpload"
						list-type="picture-card"
						:max-count="1"
					>
						<div v-if="fileList.length < 1">
							<plus-outlined />
							<div style="margin-top: 8px">上传</div>
						</div>
					</a-upload>
				</template>
					<template v-else>
						<div class="cover-generator">
							<div class="cover-generator__actions">
								<a-button @click="handleOpenCoverConfig">
									配置封面模板
								</a-button>
								<span class="cover-generator__hint">
									{{ autoCoverLoading ? '正在同步封面预览...' : '将根据学校、专业、课程、年份等字段实时生成' }}
								</span>
							</div>
							<div v-if="autoCoverPreviewSrc" class="cover-generator__preview">
								<img :src="autoCoverPreviewSrc" alt="自动生成封面预览" />
							</div>
							<div v-else class="cover-generator__empty">填写学校和专业后自动生成预览</div>
						</div>
					</template>
				</a-form-item>
			<a-form-item label="价格" name="price">
				<a-input-number
					v-model:value="formState.price"
					:min="1"
					:precision="0"
					:step="1"
					style="width: 100%"
					placeholder="请输入整数价格（元）"
				/>
				<div class="form-tip">代币支付仅支持整数元，请勿填写小数。</div>
			</a-form-item>
			<a-form-item label="代理商售价" name="agent_price">
				<a-input-number
					v-model:value="formState.agent_price"
					:min="0"
					:precision="0"
					:step="1"
					style="width: 100%"
					placeholder="请输入整数价格（元）"
				/>
				<div class="form-tip">修改价格或免费状态后，将自动同步微信虚拟道具价格，约 10 分钟后生效。</div>
			</a-form-item>
			<a-form-item label="是否免费" name="is_free">
				<a-radio-group v-model:value="formState.is_free">
					<a-radio :value="0">付费</a-radio>
					<a-radio :value="1">免费</a-radio>
				</a-radio-group>
			</a-form-item>
			<a-form-item v-if="formState.is_free === 0" label="有效期设置" name="validity_days">
				<a-radio-group v-model:value="formState.validity_days">
					<a-radio :value="30">30天</a-radio>
					<a-radio :value="90">90天</a-radio>
					<a-radio :value="180">180天</a-radio>
					<a-radio :value="365">365天</a-radio>
					<a-radio :value="null">永久有效</a-radio>
				</a-radio-group>
				<div style="margin-top: 8px; color: #999; font-size: 12px">
					设置用户购买此课程后的有效期，选择"永久有效"则购买后永久可用
				</div>
			</a-form-item>
				<a-form-item label="课程介绍" name="introduction">
				<WangEditor v-model="formState.introduction" placeholder="请输入课程介绍（支持富文本）" />
			</a-form-item>
		</a-form>
	</a-modal>
	<a-modal
		:open="coverConfigOpen"
		title="课程封面配置"
		width="1280px"
		:footer="null"
		@cancel="coverConfigOpen = false"
	>
		<CourseCoverConfig />
	</a-modal>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { message } from 'ant-design-vue';
import { PlusOutlined, UploadOutlined, DownOutlined, UpOutlined } from '@ant-design/icons-vue';
import {
	createCourse,
	updateCourse,
	listCourseFiles,
	createCourseFile,
	updateCourseFile,
	deleteCourseFile,
	warmupCoursePreviewCacheAfterSave,
	getCourseFilesPdfHealth,
	checkCourseFilePdfHealth,
	getCoursePreviewSamplePages,
	fetchCoursePreviewSamplePageBlob,
	getCourseDefaultParams,
} from '@/api/course';
import { getCourseCoverConfig } from '@/api/system';
import { getCourseCategoryTree } from '@/api/course-category';
import { uploadImage, uploadCourseFile } from '@/api/upload';
import { useUserStore } from '@/store/user';
import type { UploadProps } from 'ant-design-vue';
import WangEditor from '@/components/WangEditor/index.vue';
import CourseCoverConfig from '@/views/system/config/components/CourseCoverConfig.vue';
import {
	DEFAULT_COURSE_COVER_CONFIG,
	normalizeCourseCoverTemplatePack,
	resolveCourseCoverConfigByCategory,
	renderCourseCover,
} from '@/utils/course-cover';
import type { CourseCoverTemplatePack } from '@/utils/course-cover';
import { notifyVirtualPayGoodsPriceSync } from '@/utils/virtual-pay-goods';
import {
	buildNewCourseFormDefaults,
	FALLBACK_COURSE_DEFAULT_PARAMS,
	normalizeCourseDefaultParams,
} from '@/utils/course-default-params';

const props = defineProps<{
	open: boolean;
	record: any;
}>();

const emit = defineEmits<{
	(e: 'update:open', value: boolean): void;
	(e: 'success'): void;
}>();

const formRef = ref();
const userStore = useUserStore();
const loading = ref(false);
const uploadLoading = ref(false);
const courseFileUploading = ref(false);
const courseFileUploadProgress = ref(0);
const courseFileUploadStage = ref('');
const autoCoverLoading = ref(false);
const fileList = ref<any[]>([]);
type CourseFileRow = {
	key: string;
	id?: number;
	display_name: string;
	file_url: string;
	file_name: string;
	file_type: string;
	file_size: number;
	sort: number;
	removed?: boolean;
};
const courseFileRows = ref<CourseFileRow[]>([]);
const selectedPreviewFileId = ref<number | undefined>(undefined);
const courseFileColumns = [
	{ title: '展示名称', key: 'display_name', width: 200 },
	{ title: '原始文件名', key: 'file_name', width: 160 },
	{ title: '类型', key: 'file_type', width: 72 },
	{ title: '排序', key: 'sort', width: 88 },
	{ title: '操作', key: 'actions', width: 120 },
];
const visibleCourseFileRows = computed(() =>
	courseFileRows.value.filter((row) => !row.removed).sort((a, b) => a.sort - b.sort),
);
const categoryTree = ref<any[]>([]);
const categoryCascaderValue = ref<string[]>([]);
const coverMode = ref<'manual' | 'auto'>('auto');
const coverConfigOpen = ref(false);
const generatedCoverPreview = ref('');
let generatedPreviewObjectUrl = '';
let generatedCoverFile: File | null = null;
let coverConfigCache: CourseCoverTemplatePack | null = null;
let autoCoverTimer: ReturnType<typeof setTimeout> | null = null;
const extraFieldsExpanded = ref(false);
const previewSampleLoading = ref(false);
const previewSampleSupported = ref(true);
const previewSampleHint = ref('');
type PreviewSampleItem = {
	pageNum: number;
	src: string;
	loading: boolean;
	error?: string;
};
const previewSampleItems = ref<PreviewSampleItem[]>([]);
let previewSampleObjectUrls: string[] = [];
let previewSampleLoadTimer: ReturnType<typeof setTimeout> | null = null;
const pdfHealthLoading = ref(false);
const pdfHealthWarnings = ref<any[]>([]);
let pdfHealthRequestId = 0;

const autoCoverPreviewSrc = computed(() => generatedCoverPreview.value);
const previewableCourseFiles = computed(() =>
	visibleCourseFileRows.value.filter((row) => ['pdf', 'doc', 'docx'].includes((row.file_type || '').toLowerCase())),
);
const showCoursePreviewSamples = computed(
	() =>
		!!props.record?.id &&
		formState.value.content_type === 'file' &&
		previewableCourseFiles.value.some((row) => row.id),
);
const canDownloadCourseFile = computed(() => userStore.hasRole('super_admin'));
const canRemoveCourseFile = computed(() => !props.record || userStore.hasRole('super_admin'));
const isEditingExistingFileCourseWithoutAdmin = computed(
	() => !!props.record && props.record.content_type === 'file' && !userStore.hasRole('super_admin'),
);
const canRemoveCourseFileRow = (row: CourseFileRow) => {
	if (!canRemoveCourseFile.value) return false;
	const activeCount = visibleCourseFileRows.value.length;
	if (props.record && activeCount <= 1) return false;
	return true;
};

// 转换为级联选择器需要的格式
const cascaderOptions = computed(() => {
	return categoryTree.value
		.map((parent) => ({
			label: parent.status === 0 ? `${parent.name}（已禁用）` : parent.name,
			value: parent.name,
			children: Array.isArray(parent.children)
				? parent.children
						.map((child) => ({
							label: child.status === 0 ? `${child.name}（已禁用）` : child.name,
							value: child.name,
						}))
				: [],
		}))
		.filter((item) => item.children.length > 0 || item.value === formState.value.category);
});

// 级联选择器搜索过滤函数
const cascaderFilter = (inputValue: string, path: any[]) => {
	return path.some((option) => option.label.toLowerCase().indexOf(inputValue.toLowerCase()) > -1);
};

const formState = ref(buildNewCourseFormDefaults(FALLBACK_COURSE_DEFAULT_PARAMS));


const rules = {
	name: [{ required: true, message: '请输入课程名称', trigger: 'blur' }],
	price: [
		{ required: true, message: '请输入价格', trigger: 'blur' },
		{
			validator: (_rule: unknown, value: number) => {
				if (formState.value.is_free === 1) return Promise.resolve();
				if (!Number.isInteger(Number(value)) || Number(value) < 1) {
					return Promise.reject(new Error('付费课程价格必须为不小于 1 的整数元'));
				}
				return Promise.resolve();
			},
			trigger: 'blur',
		},
	],
	course_files: [
		{
			validator: async () => {
				if (formState.value.content_type !== 'file') {
					return Promise.resolve();
				}
				const active = visibleCourseFileRows.value;
				if (active.length === 0) {
					return Promise.reject(new Error('请至少上传一个课程文件（PDF 或 Word）'));
				}
				if (active.some((row) => !String(row.display_name || '').trim())) {
					return Promise.reject(new Error('请为每个文件填写展示名称'));
				}
				return Promise.resolve();
			},
			trigger: 'change',
		},
	],
};

const defaultDisplayName = (fileName: string) => {
	const base = String(fileName || '').trim();
	return base.replace(/\.(pdf|docx?)$/i, '') || base || '课程文件';
};

const syncPrimaryFromRows = () => {
	const primary = visibleCourseFileRows.value[0];
	if (!primary) {
		formState.value.file_url = '';
		formState.value.file_name = '';
		formState.value.file_type = '';
		formState.value.file_size = 0;
		return;
	}
	formState.value.file_url = primary.file_url;
	formState.value.file_name = primary.file_name;
	formState.value.file_type = primary.file_type;
	formState.value.file_size = Number(primary.file_size || 0);
};

const loadCourseFileRows = async () => {
	courseFileRows.value = [];
	selectedPreviewFileId.value = undefined;
	if (formState.value.content_type !== 'file') return;
	if (props.record?.id) {
		try {
			const res = await listCourseFiles(props.record.id);
			const files = Array.isArray((res as any)?.data) ? (res as any).data : Array.isArray(res) ? res : [];
			courseFileRows.value = files.map((file: any, index: number) => ({
				key: `file-${file.id}`,
				id: file.id,
				display_name: file.display_name || file.file_name || defaultDisplayName(file.file_name),
				file_url: file.file_url,
				file_name: file.file_name || '',
				file_type: (file.file_type || 'pdf').toLowerCase(),
				file_size: Number(file.file_size || 0),
				sort: Number.isInteger(file.sort) ? file.sort : index,
			}));
		} catch (error: any) {
			message.error(error?.message || '加载课程文件失败');
		}
	}
	if (courseFileRows.value.length === 0 && formState.value.file_url) {
		courseFileRows.value = [
			{
				key: 'legacy-0',
				display_name: defaultDisplayName(formState.value.file_name || formState.value.name),
				file_url: formState.value.file_url,
				file_name: formState.value.file_name || '',
				file_type: (formState.value.file_type || 'pdf').toLowerCase(),
				file_size: Number(formState.value.file_size || 0),
				sort: 0,
			},
		];
	}
	syncPrimaryFromRows();
	const firstPreviewable = previewableCourseFiles.value.find((row) => row.id);
	selectedPreviewFileId.value = firstPreviewable?.id;
	void loadPdfHealthWarnings();
};

const loadPdfHealthWarnings = async () => {
	pdfHealthWarnings.value = [];
	if (formState.value.content_type !== 'file') return;

	const pdfRows = visibleCourseFileRows.value.filter(
		(row) => row.file_url && (row.file_type || '').toLowerCase() === 'pdf',
	);
	if (!pdfRows.length) return;

	const requestId = ++pdfHealthRequestId;
	pdfHealthLoading.value = true;
	try {
		if (props.record?.id) {
			const res = await getCourseFilesPdfHealth(props.record.id);
			if (requestId !== pdfHealthRequestId) return;
			const list = Array.isArray((res as any)?.data) ? (res as any).data : Array.isArray(res) ? res : [];
			pdfHealthWarnings.value = list.filter((item: any) => item && item.healthy === false);
			return;
		}

		const results = await Promise.all(
			pdfRows.map((row) =>
				checkCourseFilePdfHealth(row.file_url, row.display_name || row.file_name).then((res) => {
					const data = (res as any)?.data ?? res;
					return { ...data, fileUrl: row.file_url };
				}),
			),
		);
		if (requestId !== pdfHealthRequestId) return;
		pdfHealthWarnings.value = results.filter((item) => item && item.healthy === false);
	} catch (error: any) {
		if (requestId !== pdfHealthRequestId) return;
		console.warn('PDF 结构检测失败:', error);
	} finally {
		if (requestId === pdfHealthRequestId) {
			pdfHealthLoading.value = false;
		}
	}
};

const syncCourseFilesAfterSave = async (courseId: number) => {
	const activeRows = [...visibleCourseFileRows.value].sort((a, b) => a.sort - b.sort);
	const serverRes = await listCourseFiles(courseId);
	const serverFiles = Array.isArray((serverRes as any)?.data)
		? (serverRes as any).data
		: Array.isArray(serverRes)
			? serverRes
			: [];
	const serverByUrl = new Map(serverFiles.map((file: any) => [file.file_url, file]));
	const keepIds = new Set<number>();

	for (let index = 0; index < activeRows.length; index += 1) {
		const row = activeRows[index];
		const payload = {
			display_name: String(row.display_name || '').trim(),
			file_url: row.file_url,
			file_name: row.file_name,
			file_type: row.file_type,
			file_size: row.file_size,
			sort: Number.isInteger(row.sort) ? row.sort : index,
		};
		let fileId = row.id;
		if (!fileId) {
			const matched = serverByUrl.get(row.file_url);
			if (matched?.id) {
				fileId = matched.id;
			}
		}
		if (fileId) {
			await updateCourseFile(courseId, fileId, payload);
			keepIds.add(fileId);
			row.id = fileId;
			row.key = `file-${fileId}`;
		} else {
			const created = await createCourseFile(courseId, payload);
			const createdData = (created as any)?.data ?? created;
			if (createdData?.id) {
				keepIds.add(createdData.id);
				row.id = createdData.id;
				row.key = `file-${createdData.id}`;
				serverByUrl.set(row.file_url, createdData);
			}
		}
	}

	for (const serverFile of serverFiles) {
		if (!keepIds.has(serverFile.id) && canRemoveCourseFile.value) {
			await deleteCourseFile(courseId, serverFile.id);
		}
	}
	syncPrimaryFromRows();
	await loadCourseFileRows();
};

const resetNewCourseForm = async () => {
	try {
		const res = await getCourseDefaultParams();
		const params = normalizeCourseDefaultParams((res as any)?.data ?? res);
		formState.value = buildNewCourseFormDefaults(params);
	} catch (error) {
		console.warn('加载课程默认参数失败，使用内置默认值', error);
		formState.value = buildNewCourseFormDefaults(FALLBACK_COURSE_DEFAULT_PARAMS);
	}
	fileList.value = [];
	courseFileRows.value = [];
	selectedPreviewFileId.value = undefined;
	coverMode.value = 'auto';
	generatedCoverPreview.value = '';
	generatedCoverFile = null;
	scheduleAutoCoverPreview(0);
};

watch(
	() => props.open,
	async (val) => {
		if (val) {
			if (props.record) {
				// 映射后端字段到前端表单
				formState.value = {
					name: props.record.name || '',
					subject: props.record.subject || '',
					category: props.record.category || '',
					sub_category: props.record.sub_category || '',
					school: props.record.school || '',
					major: props.record.major || '',
					exam_year: props.record.exam_year || '',
					answer_year: props.record.answer_year || '',
					cover_img: props.record.cover_img || props.record.cover || '',
					price: props.record.price ?? 1,
					agent_price: props.record.agent_price ?? 1,
						is_free: props.record.is_free ?? 0,
						validity_days: props.record.validity_days ?? 365,
						introduction: props.record.introduction || '',
					content_type: props.record.content_type || 'normal',
					file_url: props.record.file_url || '',
					file_name: props.record.file_name || '',
					file_type: props.record.file_type || '',
					file_size: Number(props.record.file_size || 0),
					allow_source_file: props.record.allow_source_file ?? 0,
				};
				if (formState.value.cover_img) {
					fileList.value = [
						{
							uid: '-1',
							name: 'cover.png',
							status: 'done',
							url: formState.value.cover_img,
						},
					];
				} else {
					fileList.value = [];
				}
					coverMode.value = 'manual';
					generatedCoverPreview.value = '';
					generatedCoverFile = null;
					void loadCourseFileRows();
			} else {
				await resetNewCourseForm();
			}
			extraFieldsExpanded.value = false;
			fetchCategoryTree();
			scheduleLoadPreviewSamples();
		} else {
			clearPreviewSampleUrls();
			pdfHealthWarnings.value = [];
			pdfHealthRequestId += 1;
			pdfHealthLoading.value = false;
		}
	}
	);

watch(
	() => [props.record?.id, selectedPreviewFileId.value, formState.value.content_type],
	() => {
		if (!props.open) return;
		scheduleLoadPreviewSamples();
	},
);

	watch(
		coverMode,
		(mode) => {
			if (mode === 'auto') {
				scheduleAutoCoverPreview();
			}
		},
	);

	watch(
		[
			() => formState.value.name,
			() => formState.value.subject,
			() => formState.value.category,
			() => formState.value.sub_category,
			() => formState.value.school,
			() => formState.value.major,
			() => formState.value.exam_year,
			() => formState.value.answer_year,
		],
		() => {
			if (coverMode.value === 'auto') {
				scheduleAutoCoverPreview();
			}
		},
	);

	watch(
		coverConfigOpen,
		(open) => {
			if (!open && coverMode.value === 'auto') {
				coverConfigCache = null;
				scheduleAutoCoverPreview(0);
			}
		},
	);

	watch(
		() => formState.value.is_free,
		(isFree) => {
			if (isFree === 0 && formState.value.validity_days == null) {
				formState.value.validity_days = 365;
			}
		},
	);

// 监听级联选择器的值变化，同步到 formState
watch(
	() => categoryCascaderValue.value,
	(newValue) => {
		if (Array.isArray(newValue) && newValue.length > 0) {
			formState.value.category = newValue[0] || '';
			formState.value.sub_category = newValue[1] || '';
		} else {
			formState.value.category = '';
			formState.value.sub_category = '';
		}
	},
);

// 监听 formState 的 category 和 sub_category 变化，同步到级联选择器
// 注意：只在 categoryTree 加载完成后才同步，避免数据未加载时的错误
watch(
	[() => formState.value.category, () => formState.value.sub_category, () => categoryTree.value.length],
	([category, subCategory, treeLength]) => {
		// 等待分类树加载完成
		if (treeLength === 0) {
			return;
		}
		if (category && subCategory) {
			categoryCascaderValue.value = [category, subCategory];
		} else if (category) {
			categoryCascaderValue.value = [category];
		} else {
			categoryCascaderValue.value = [];
		}
	},
	{ immediate: true },
);

const clearPreviewSampleUrls = () => {
	if (previewSampleLoadTimer) {
		clearTimeout(previewSampleLoadTimer);
		previewSampleLoadTimer = null;
	}
	previewSampleObjectUrls.forEach((url) => URL.revokeObjectURL(url));
	previewSampleObjectUrls = [];
	previewSampleItems.value = [];
	previewSampleHint.value = '';
};

const scheduleLoadPreviewSamples = (delay = 240) => {
	if (previewSampleLoadTimer) {
		clearTimeout(previewSampleLoadTimer);
	}
	previewSampleLoadTimer = setTimeout(() => {
		previewSampleLoadTimer = null;
		if (!props.open || !showCoursePreviewSamples.value) {
			clearPreviewSampleUrls();
			return;
		}
		loadPreviewSamples();
	}, delay);
};

const loadPreviewSamples = async () => {
	const courseId = props.record?.id;
	if (!courseId || !showCoursePreviewSamples.value) {
		clearPreviewSampleUrls();
		return;
	}
	previewSampleLoading.value = true;
	clearPreviewSampleUrls();
	try {
		const res = await getCoursePreviewSamplePages(courseId, selectedPreviewFileId.value);
		const data = res?.data || res;
		if (!data?.supported) {
			previewSampleSupported.value = false;
			previewSampleHint.value = '当前课程文件类型不支持图片预览';
			return;
		}
		previewSampleSupported.value = true;
		const pages = Array.isArray(data.samplePages) ? data.samplePages : [];
		if (pages.length === 0) {
			previewSampleHint.value = '课程文件暂无可预览页面';
			return;
		}
		previewSampleItems.value = pages.map((page: { pageNum: number }) => ({
			pageNum: page.pageNum,
			src: '',
			loading: true,
		}));
		const hasUncached = pages.some((page: { ready?: boolean }) => !page.ready);
		if (hasUncached) {
			previewSampleHint.value =
				'部分页面缓存尚未生成，已尝试实时渲染；也可在课程列表点击「图片缓存」批量生成';
		}
		await Promise.all(
			pages.map(async (page: { pageNum: number }) => {
				try {
					const blob = (await fetchCoursePreviewSamplePageBlob(
						courseId,
						page.pageNum,
						selectedPreviewFileId.value,
					)) as Blob;
					const url = URL.createObjectURL(blob);
					previewSampleObjectUrls.push(url);
					const target = previewSampleItems.value.find((item) => item.pageNum === page.pageNum);
					if (target) {
						target.src = url;
						target.loading = false;
					}
				} catch (error: any) {
					const target = previewSampleItems.value.find((item) => item.pageNum === page.pageNum);
					if (target) {
						target.loading = false;
						target.error = error?.message || '加载失败';
					}
				}
			}),
		);
	} catch (error: any) {
		previewSampleSupported.value = false;
		previewSampleHint.value = error?.message || '加载预览图失败';
	} finally {
		previewSampleLoading.value = false;
	}
};

const downloadPreviewSample = async (pageNum: number) => {
	const courseId = props.record?.id;
	if (!courseId) return;
	try {
		const blob = (await fetchCoursePreviewSamplePageBlob(courseId, pageNum, selectedPreviewFileId.value)) as Blob;
		const url = URL.createObjectURL(blob);
		const link = document.createElement('a');
		const safeName = (formState.value.name || '课程').replace(/[\\/:*?"<>|]+/g, '-').slice(0, 40);
		link.href = url;
		link.download = `${safeName}-第${pageNum}页.jpg`;
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
		URL.revokeObjectURL(url);
	} catch (error: any) {
		message.error(error?.message || '下载失败');
	}
};

const fetchCategoryTree = async () => {
	try {
		const res = await getCourseCategoryTree();
		categoryTree.value = Array.isArray(res.data) ? res.data : [];
		// 数据加载完成后，同步级联选择器的值
		if (formState.value.category && formState.value.sub_category) {
			categoryCascaderValue.value = [formState.value.category, formState.value.sub_category];
		} else if (formState.value.category) {
			categoryCascaderValue.value = [formState.value.category];
		} else {
			categoryCascaderValue.value = [];
		}
	} catch (error) {
		message.error('获取分类列表失败');
	}
};

const beforeUpload: UploadProps['beforeUpload'] = (file) => {
	const isImage = file.type.startsWith('image/');
	if (!isImage) {
		message.error('只能上传图片文件!');
		return false;
	}
	// 允许 upload 组件继续（返回true触发customRequest调用handleUpload）
	return true;
};

const beforeCourseFileUpload: UploadProps['beforeUpload'] = (file) => {
	const name = (file.name || '').toLowerCase();
	const ok = name.endsWith('.pdf') || name.endsWith('.doc') || name.endsWith('.docx');
	if (!ok) {
		message.error('仅支持 PDF、Word（.doc/.docx）文件');
		return false;
	}
	return true;
};

const handleCourseFileUpload = async (options: any) => {
	const { file, onSuccess, onError } = options;
	try {
		courseFileUploading.value = true;
		courseFileUploadProgress.value = 0;
		courseFileUploadStage.value = '准备上传课程文件';
		const res = await uploadCourseFile(file as File, {
			onProgress: (percent, stage) => {
				courseFileUploadProgress.value = percent;
				courseFileUploadStage.value = stage || '';
			},
		});
		const fileName = res.fileName || (file as File).name;
		const nextSort =
			courseFileRows.value.reduce((max, row) => Math.max(max, Number(row.sort) || 0), -1) + 1;
		courseFileRows.value.push({
			key: `new-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
			display_name: defaultDisplayName(fileName),
			file_url: res.url || res.fileUrl,
			file_name: fileName,
			file_type: (res.fileType || '').toLowerCase(),
			file_size: (file as File).size || 0,
			sort: nextSort,
		});
		syncPrimaryFromRows();
		onSuccess?.();
		message.success('课程文件上传成功');
		if ((res.fileType || '').toLowerCase() === 'pdf') {
			void loadPdfHealthWarnings();
		}
		if (props.record?.id) {
			scheduleLoadPreviewSamples(400);
		}
	} catch (e: any) {
		message.error(e?.message || '上传失败');
		onError?.(e);
	} finally {
		courseFileUploading.value = false;
		courseFileUploadProgress.value = 0;
		courseFileUploadStage.value = '';
	}
};

const openCourseFileUrl = (url: string) => {
	if (!url) return;
	window.open(url, '_blank');
};

const removeCourseFileRow = (key: string) => {
	const target = courseFileRows.value.find((row) => row.key === key);
	if (!target || !canRemoveCourseFileRow(target)) {
		message.warning('当前账号不能删除该文件');
		return;
	}
	target.removed = true;
	syncPrimaryFromRows();
};

const handleUpload = async (options: any) => {
	const { file, onSuccess, onError } = options;
	try {
		uploadLoading.value = true;
		const response = await uploadImage(file as File);

		// 修正：uploadImage返回 { url, imageUrl }
		const url = response.url || response.imageUrl;

		if (url) {
			formState.value.cover_img = url;
			fileList.value = [
				{
					uid: Date.now().toString(),
					name: file.name,
					status: 'done',
					url,
				},
			];
			onSuccess?.('ok');
			message.success('上传成功');
		} else {
			throw new Error('上传失败：未返回图片URL');
		}
	} catch (error: any) {
		console.error('图片上传失败:', error);
		message.error(error?.message || '图片上传失败');
		onError?.(error);
	} finally {
		uploadLoading.value = false;
	}
};

	const scheduleAutoCoverPreview = (delay = 360) => {
		if (autoCoverTimer) {
			clearTimeout(autoCoverTimer);
		}
		autoCoverTimer = setTimeout(() => {
			refreshAutoCoverPreview();
		}, delay);
	};

	const refreshAutoCoverPreview = async () => {
		try {
			if (coverMode.value !== 'auto') return;
			if (
				!formState.value.school?.trim() &&
				!formState.value.major?.trim() &&
				!formState.value.category?.trim() &&
				!formState.value.name?.trim()
			) {
				clearGeneratedCoverPreview();
				return;
			}
			autoCoverLoading.value = true;
			const coverFile = await generateCourseCoverFile();
			generatedCoverFile = coverFile;
			if (generatedPreviewObjectUrl) {
				URL.revokeObjectURL(generatedPreviewObjectUrl);
			}
			generatedPreviewObjectUrl = URL.createObjectURL(coverFile);
			generatedCoverPreview.value = generatedPreviewObjectUrl;
		} catch (error: any) {
			generatedCoverFile = null;
			generatedCoverPreview.value = '';
			console.error('自动封面预览生成失败:', error);
		} finally {
			autoCoverLoading.value = false;
		}
	};

	const clearGeneratedCoverPreview = () => {
		generatedCoverFile = null;
		generatedCoverPreview.value = '';
		if (generatedPreviewObjectUrl) {
			URL.revokeObjectURL(generatedPreviewObjectUrl);
			generatedPreviewObjectUrl = '';
		}
	};

	const ensureAutoCoverUploaded = async () => {
		if (coverMode.value !== 'auto') return;
		const coverFile = await generateCourseCoverFile();
		generatedCoverFile = coverFile;
		const response = await uploadImage(coverFile);
		const url = response.url || response.imageUrl;
		if (!url) {
			throw new Error('自动生成封面上传失败');
		}
		formState.value.cover_img = url;
		fileList.value = [
			{
				uid: `auto-${Date.now()}`,
				name: coverFile.name,
				status: 'done',
				url,
			},
		];
	};

const generateCourseCoverFile = async (): Promise<File> => {
	const school = formState.value.school?.trim() || formState.value.category?.trim() || formState.value.name?.trim();
	const major = formState.value.major?.trim() || formState.value.sub_category?.trim() || formState.value.name?.trim();

	if (!school || !major) {
		throw new Error('请先填写学校和专业，或至少填写分类/课程名称后再自动生成封面');
	}
		let config = DEFAULT_COURSE_COVER_CONFIG;
		try {
			if (!coverConfigCache) {
				const res = await getCourseCoverConfig();
				coverConfigCache = normalizeCourseCoverTemplatePack(res.data || res, { configType: 'course' });
			}
			config = resolveCourseCoverConfigByCategory(coverConfigCache, {
				category: formState.value.category?.trim(),
				sub_category: formState.value.sub_category?.trim(),
			});
		} catch (_) {
			config = DEFAULT_COURSE_COVER_CONFIG;
		}
	const canvas = await renderCourseCover(config, {
		name: formState.value.name?.trim(),
		subject: formState.value.subject?.trim(),
		category: formState.value.category?.trim(),
		sub_category: formState.value.sub_category?.trim(),
		school,
		major,
		exam_year: formState.value.exam_year?.trim() || '待更新',
		answer_year: formState.value.answer_year?.trim() || '待更新',
	});
	const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png', 0.96));
	if (!blob) {
		throw new Error('封面生成失败');
	}

	const fileName = `${sanitizeFileName(school)}-${sanitizeFileName(major)}-cover.png`;
	return new File([blob], fileName, { type: 'image/png' });
};

const sanitizeFileName = (value: string) => value.replace(/[\\/:*?"<>|]+/g, '-').slice(0, 40);

const handleOpenCoverConfig = () => {
	coverConfigOpen.value = true;
};

	const handleCancel = () => {
		emit('update:open', false);
		formRef.value?.resetFields();
		categoryCascaderValue.value = [];
		coverConfigOpen.value = false;
		if (autoCoverTimer) {
			clearTimeout(autoCoverTimer);
			autoCoverTimer = null;
		}
		clearGeneratedCoverPreview();
		clearPreviewSampleUrls();
		extraFieldsExpanded.value = false;
	};

const handleSubmit = async () => {
		try {
			await formRef.value?.validate();
			loading.value = true;
			if (coverMode.value === 'auto') {
				autoCoverLoading.value = true;
				await ensureAutoCoverUploaded();
			}

			// 构建符合后端 DTO 的数据
		const submitData: any = {
			name: formState.value.name,
		};

		// 只添加有值的字段
		if (formState.value.subject) {
			submitData.subject = formState.value.subject;
		}
		if (formState.value.category) {
			submitData.category = formState.value.category;
		}
		if (formState.value.sub_category) {
			submitData.sub_category = formState.value.sub_category;
		}
		if (formState.value.school) {
			submitData.school = formState.value.school;
		}
		if (formState.value.major) {
			submitData.major = formState.value.major;
		}
		if (formState.value.exam_year) {
			submitData.exam_year = formState.value.exam_year;
		}
		if (formState.value.answer_year) {
			submitData.answer_year = formState.value.answer_year;
		}
		if (formState.value.cover_img) {
			submitData.cover_img = formState.value.cover_img;
		}
		if (formState.value.price !== undefined && formState.value.price !== null) {
			submitData.price = formState.value.price;
		}
		if (formState.value.agent_price !== undefined && formState.value.agent_price !== null) {
			submitData.agent_price = formState.value.agent_price;
		}
		if (formState.value.is_free !== undefined) {
			submitData.is_free = formState.value.is_free;
		}
		// 只有付费课程才设置有效期
		if (formState.value.is_free === 0) {
			if (formState.value.validity_days !== undefined) {
				submitData.validity_days = formState.value.validity_days;
			}
		} else {
			// 免费课程不设置有效期
			submitData.validity_days = null;
		}
			if (formState.value.introduction !== undefined) {
			submitData.introduction = formState.value.introduction;
		}
		submitData.content_type = formState.value.content_type || 'normal';
		if (isEditingExistingFileCourseWithoutAdmin.value) {
			submitData.content_type = 'file';
			if (!formState.value.file_url) {
				submitData.file_url = props.record.file_url;
				submitData.file_name = props.record.file_name;
				submitData.file_type = props.record.file_type;
				submitData.file_size = Number(props.record.file_size || 0);
			}
		}
		if (submitData.content_type === 'file') {
			syncPrimaryFromRows();
			const fallbackRecord = isEditingExistingFileCourseWithoutAdmin.value ? props.record : null;
			submitData.file_url = formState.value.file_url || fallbackRecord?.file_url || null;
			submitData.file_name = formState.value.file_name || fallbackRecord?.file_name || null;
			submitData.file_type = formState.value.file_type || fallbackRecord?.file_type || null;
			submitData.file_size = Number(formState.value.file_size || fallbackRecord?.file_size || 0);
			submitData.allow_source_file = formState.value.allow_source_file ?? 0;
		} else {
			submitData.file_url = null;
			submitData.file_name = null;
			submitData.file_type = null;
			submitData.file_size = 0;
			submitData.allow_source_file = 0;
		}

		let courseId = props.record?.id as number | undefined;
		let saveResponse: any = null;
		if (props.record) {
			const updatedRes = await updateCourse(props.record.id, submitData);
			saveResponse = (updatedRes as any)?.data ?? updatedRes;
			courseId = props.record.id;
			message.success('更新成功');
		} else {
			const createdRes = await createCourse(submitData);
			saveResponse = (createdRes as any)?.data ?? createdRes;
			courseId = Number(saveResponse?.id);
			message.success('创建成功');
		}
		notifyVirtualPayGoodsPriceSync(saveResponse);

		if (submitData.content_type === 'file' && courseId) {
			await syncCourseFilesAfterSave(courseId);
			try {
				await warmupCoursePreviewCacheAfterSave(courseId, false);
			} catch (error) {
				console.warn('课程图片缓存后台生成触发失败:', error);
			}
		}

		emit('success');
		emit('update:open', false);
	} catch (error: any) {
		if (error?.errorFields) {
			return;
		}
		message.error(error?.message || '操作失败');
		} finally {
			loading.value = false;
			autoCoverLoading.value = false;
		}
	};
</script>

<style scoped>
.cover-generator {
	display: flex;
	flex-direction: column;
	gap: 12px;
}

.cover-generator__actions {
	display: flex;
	align-items: center;
	flex-wrap: wrap;
	gap: 12px;
}

.cover-generator__hint {
	color: #8c8c8c;
	font-size: 12px;
}

.cover-generator__preview {
	width: 180px;
	padding: 8px;
	border: 1px solid #f0f0f0;
	border-radius: 12px;
	background: #fafafa;
}

.cover-generator__preview img {
	display: block;
	width: 100%;
	border-radius: 8px;
}

.course-file-upload-progress {
	margin-top: 8px;
}

.course-file-upload--readonly :deep(.ant-upload-list-item-name) {
	color: rgba(0, 0, 0, 0.88);
	cursor: default;
	pointer-events: none;
}

.extra-fields-toggle-row {
	margin-bottom: 0;
}

.extra-fields-toggle {
	padding-left: 0;
	height: auto;
}

.preview-sample-hint {
	margin-bottom: 12px;
}

.pdf-health-alert {
	margin-bottom: 12px;
}

.pdf-health-alert__list {
	margin: 8px 0 0;
	padding-left: 18px;
}

.pdf-health-alert__list li + li {
	margin-top: 4px;
}

.preview-sample-list {
	display: flex;
	flex-wrap: wrap;
	gap: 16px;
}

.preview-sample-item {
	display: flex;
	flex-direction: column;
	align-items: flex-start;
	gap: 8px;
	padding: 10px;
	border: 1px solid #f0f0f0;
	border-radius: 10px;
	background: #fafafa;
}

.course-files-panel {
	display: flex;
	flex-direction: column;
	gap: 12px;
}

.course-files-panel__toolbar {
	display: flex;
	align-items: center;
	flex-wrap: wrap;
	gap: 12px;
}

.course-file-meta {
	font-size: 12px;
	color: #666;
	word-break: break-all;
}

.preview-file-switch {
	display: flex;
	align-items: center;
	gap: 8px;
	margin-bottom: 12px;
}

.preview-sample-item__title {
	font-size: 13px;
	color: #595959;
}

.preview-sample-item__image :deep(.ant-image-img) {
	object-fit: contain;
	background: #fff;
	border-radius: 6px;
}
</style>
