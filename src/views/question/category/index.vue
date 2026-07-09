<template>
	<div class="course-category-management">
		<a-card>
			<template #extra>
				<a-space>
					<a-button
						type="primary"
						danger
						:disabled="selectedRowKeys.length === 0"
						@click="showBatchDeleteModal"
					>
						<template #icon><delete-outlined /></template>
						批量删除 ({{ selectedRowKeys.length || 0 }})
					</a-button>
					<a-button :disabled="selectedRowKeys.length === 0" @click="handleBatchEnable">
						<template #icon><check-outlined /></template>
						批量启用 ({{ selectedRowKeys.length || 0 }})
					</a-button>
					<a-button :disabled="selectedRowKeys.length === 0" @click="handleBatchDisable">
						<template #icon><close-outlined /></template>
						批量禁用 ({{ selectedRowKeys.length || 0 }})
					</a-button>
					<a-button @click="coverConfigOpen = true">
						分类封面配置
					</a-button>
					<a-button :loading="syncCategoryCoversLoading" @click="syncAllCategoryCovers">
						同步分类封面
					</a-button>
					<a-button type="primary" @click="handleAdd(null)">
						<template #icon><plus-outlined /></template>
						新增一级分类
					</a-button>
				</a-space>
			</template>

			<div class="table-toolbar">
				<TableColumnSetting :items="settingItems" @update:items="updatePreference" @reset="resetColumns" />
			</div>

			<a-table
				:columns="displayColumns"
				:data-source="tableData"
				:loading="loading"
				row-key="id"
				:row-selection="{ selectedRowKeys, onChange: onSelectChange }"
				:pagination="false"
			>
				<template #bodyCell="{ column, record }">
					<template v-if="column.key === 'status'">
						<a-tag :color="record.status === 1 ? 'green' : 'default'">
							{{ record.status === 1 ? '启用' : '禁用' }}
						</a-tag>
					</template>
					<template v-else-if="column.key === 'cover'">
						<a-image
							v-if="record.cover_img"
							:src="record.cover_img"
							:width="56"
							:height="56"
							style="object-fit: cover; border-radius: 8px"
						/>
						<span v-else>-</span>
					</template>
					<template v-else-if="column.key === 'bundle_price'">
						<span>¥{{ Number(record.bundle_price ?? 30).toFixed(0) }}</span>
					</template>
					<template v-else-if="column.key === 'bundle_enabled'">
						<a-switch
							v-if="isSecondaryCategory(record)"
							size="small"
							:checked="Number(record.bundle_enabled ?? 1) === 1"
							:checked-children="'显示'"
							:un-checked-children="'隐藏'"
							@change="(checked) => handleToggleBundleEnabled(record, checked)"
						/>
						<span v-else>-</span>
					</template>
					<template v-else-if="column.key === 'action'">
						<a-space>
							<a-button
								v-if="!record.parent_id"
								type="link"
								size="small"
								@click="handleAdd(record)"
							>
								新增子分类
							</a-button>
							<a-button
								v-if="record.parent_id"
								type="link"
								size="small"
								@click="handleBindCourse(record)"
							>
								绑定课程
							</a-button>
							<a-button
								v-if="record.parent_id"
								type="link"
								size="small"
								danger
								@click="handleUnbindCourse(record)"
							>
								移除课程
							</a-button>
							<a-button type="link" size="small" @click="handleEdit(record)">编辑</a-button>
							<a-popconfirm title="确定要删除这个分类吗？" @confirm="handleDelete(record)">
								<a-button type="link" danger size="small">删除</a-button>
							</a-popconfirm>
						</a-space>
					</template>
				</template>
			</a-table>
		</a-card>

		<a-modal
			v-model:open="batchDeleteModalVisible"
			title="批量删除确认"
			:confirm-loading="batchDeleteLoading"
			@ok="confirmBatchDelete"
			@cancel="cancelBatchDelete"
		>
			<p>确定要删除选中的 {{ selectedRowKeys.length }} 个分类吗？</p>
			<p style="color: #ff4d4f; font-size: 12px; margin-top: 8px">
				如果分类存在子分类或已绑定课程，系统会阻止删除；此操作不可恢复，请谨慎操作。
			</p>
		</a-modal>

		<a-modal
			:open="modalVisible"
			:title="currentRecord ? '编辑分类' : '新增分类'"
			@cancel="handleCancel"
			@ok="handleSubmit"
			:confirmLoading="modalLoading"
			width="520px"
		>
			<a-form ref="formRef" :model="formState" :rules="rules" :label-col="{ span: 6 }" :wrapper-col="{ span: 18 }">
				<a-form-item label="分类名称" name="name">
					<a-input v-model:value="formState.name" placeholder="请输入分类名称" />
				</a-form-item>
				<a-form-item label="所属上级" name="parent_id">
					<a-select
						v-model:value="formState.parent_id"
						:allow-clear="!isEditingSecondaryCategory"
						placeholder="不选择则为一级分类"
						:options="parentOptions"
						:disabled="isEditingPrimaryCategory"
					/>
					<div v-if="!currentRecord" style="margin-top: 4px; color: #999; font-size: 12px">
						只能选择一级分类作为父级，二级分类不允许新增子分类
					</div>
					<div v-else-if="isEditingSecondaryCategory" style="margin-top: 4px; color: #999; font-size: 12px">
						可调整所属一级分类，保存后将同步更新已绑定课程的一级分类
					</div>
					<div v-else style="margin-top: 4px; color: #999; font-size: 12px">
						一级分类不可修改上级
					</div>
				</a-form-item>
				<a-form-item v-if="formState.parent_id" label="封面方式">
					<a-radio-group v-model:value="coverMode">
						<a-radio value="auto">自动生成</a-radio>
						<a-radio value="manual">手动上传</a-radio>
					</a-radio-group>
				</a-form-item>
				<a-form-item v-if="formState.parent_id" label="分类封面" name="cover_img">
					<template v-if="coverMode === 'manual'">
						<a-upload
							list-type="picture-card"
							:show-upload-list="false"
							:before-upload="beforeCoverUpload"
							:disabled="coverUploading"
						>
							<img v-if="formState.cover_img" :src="formState.cover_img" alt="分类封面" class="category-cover-preview" />
							<div v-else class="category-cover-uploader">
								<upload-outlined />
								<div>{{ coverUploading ? '上传中...' : '上传封面' }}</div>
							</div>
						</a-upload>
						<a-button v-if="formState.cover_img" type="link" danger size="small" @click="formState.cover_img = ''">
							清除封面
						</a-button>
					</template>
					<template v-else>
						<div class="category-cover-generator">
							<div class="category-cover-generator__actions">
								<span class="category-cover-generator__hint">
									{{ autoCoverLoading ? '正在同步封面预览...' : '将根据一级分类、二级分类名称实时生成' }}
								</span>
							</div>
							<div v-if="autoCoverPreviewSrc" class="category-cover-generator__preview">
								<img :src="autoCoverPreviewSrc" alt="自动生成分类封面预览" />
							</div>
							<div v-else class="category-cover-generator__empty">
								填写分类名称后自动生成预览
							</div>
						</div>
					</template>
					<div style="margin-top: 4px; color: #999; font-size: 12px">
						该封面用于首页“分类板块”的二级分类卡片展示
					</div>
				</a-form-item>
				<a-form-item label="排序" name="sort">
					<a-input-number v-model:value="formState.sort" :min="0" style="width: 100%" />
				</a-form-item>
				<a-form-item label="整类购买价" name="bundle_price">
					<a-input-number
						v-model:value="formState.bundle_price"
						:min="0"
						:step="1"
						:precision="0"
						style="width: 100%"
					/>
					<div style="margin-top: 4px; color: #999; font-size: 12px">
						小程序课程列表页展示“购买当前分类全部课程”，默认 30 元。
					</div>
				</a-form-item>
				<a-form-item v-if="isCategoryBundleSwitchVisible" label="整类购买入口" name="bundle_enabled">
					<a-switch
						:checked="Number(formState.bundle_enabled ?? 1) === 1"
						:checked-children="'显示'"
						:un-checked-children="'隐藏'"
						@change="(checked) => (formState.bundle_enabled = checked ? 1 : 0)"
					/>
					<div style="margin-top: 4px; color: #999; font-size: 12px">
						开启后，小程序对应分类课程列表的搜索栏下方会展示整类购买入口。
					</div>
				</a-form-item>
				<a-form-item label="状态" name="status">
					<a-radio-group v-model:value="formState.status">
						<a-radio :value="1">启用</a-radio>
						<a-radio :value="0">禁用</a-radio>
					</a-radio-group>
				</a-form-item>
			</a-form>
		</a-modal>
		<a-modal
			:open="coverConfigOpen"
			title="分类封面配置"
			width="1280px"
			:footer="null"
			@cancel="coverConfigOpen = false"
		>
			<CourseCoverConfig config-type="category" @saved="handleCategoryCoverConfigSaved" />
		</a-modal>

		<!-- 课程选择弹窗 -->
		<a-modal
			:open="courseSelectVisible"
			:title="courseSelectMode === 'bind' ? '绑定课程' : '移除课程'"
			@cancel="handleCourseSelectCancel"
			@ok="handleCourseSelectSubmit"
			:confirmLoading="courseSelectLoading"
			width="800px"
		>
			<div style="margin-bottom: 16px">
				<a-input-search
					v-model:value="courseSearchKeyword"
					:placeholder="courseSelectMode === 'bind' ? '搜索课程名称、科目、分类' : '搜索已绑定的课程'"
					@search="applyCourseFilterAndPagination"
					@input="applyCourseFilterAndPagination"
				/>
				<div v-if="courseSelectMode === 'unbind'" style="margin-top: 8px; color: #999; font-size: 12px">
					仅显示已绑定到该分类的课程，选择后将从该分类中移除
				</div>
			</div>
			<a-table
				:columns="courseColumns"
				:data-source="courseList"
				:loading="courseListLoading"
				:row-selection="{
					selectedRowKeys: selectedCourseIds,
					onChange: onCourseSelectChange,
					getCheckboxProps: getCheckboxProps,
				}"
				row-key="id"
				:pagination="coursePagination"
				@change="handleCourseTableChange"
			>
				<template #bodyCell="{ column, record }">
					<template v-if="column.key === 'category'">
						<span>{{ record.category || '-' }}</span>
					</template>
					<template v-else-if="column.key === 'sub_category'">
						<span>{{ record.sub_category || '-' }}</span>
					</template>
					<template v-else-if="column.key === 'status'">
						<a-tag v-if="isCourseBound(record)" color="green">已绑定</a-tag>
					</template>
				</template>
			</a-table>
		</a-modal>
	</div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import { message } from 'ant-design-vue';
import { CheckOutlined, CloseOutlined, DeleteOutlined, PlusOutlined, UploadOutlined } from '@ant-design/icons-vue';
import {
	getCourseCategoryTree,
	createCourseCategory,
	updateCourseCategory,
	deleteCourseCategory,
	batchDeleteCourseCategories,
	batchUpdateCourseCategoryStatus,
} from '@/api/course-category';
import { getCourseList, updateCourse } from '@/api/course';
import { getCategoryCoverConfig } from '@/api/system';
import { uploadImage } from '@/api/upload';
import CourseCoverConfig from '@/views/system/config/components/CourseCoverConfig.vue';
import {
	DEFAULT_CATEGORY_COVER_CONFIG,
	resolveCategoryCoverConfigByCategory,
	normalizeCourseCoverTemplatePack,
	renderCourseCover,
} from '@/utils/course-cover';
import type { CourseCoverTemplatePack } from '@/utils/course-cover';
import TableColumnSetting from '@/components/TableColumnSetting/index.vue';
import { useTableColumns } from '@/composables/useTableColumns';

const loading = ref(false);
const modalVisible = ref(false);
const modalLoading = ref(false);
const currentRecord = ref<any>(null);
const categoryTree = ref<any[]>([]);
const formRef = ref();
const courseSelectVisible = ref(false);
const courseSelectLoading = ref(false);
const courseListLoading = ref(false);
const courseList = ref<any[]>([]);
const coverUploading = ref(false);
const coverMode = ref<'auto' | 'manual'>('auto');
const coverConfigOpen = ref(false);
const autoCoverLoading = ref(false);
const syncCategoryCoversLoading = ref(false);
const generatedCoverPreview = ref('');
const courseSearchKeyword = ref('');
const selectedCourseIds = ref<number[]>([]);
const selectedRowKeys = ref<number[]>([]);
const batchDeleteModalVisible = ref(false);
const batchDeleteLoading = ref(false);
const currentCategory = ref<{ category: string; sub_category: string } | null>(null);
const courseSelectMode = ref<'bind' | 'unbind'>('bind'); // 'bind' 绑定课程, 'unbind' 移除课程
let generatedPreviewObjectUrl = '';
let generatedCoverFile: File | null = null;
let coverConfigCache: CourseCoverTemplatePack | null = null;
let autoCoverTimer: ReturnType<typeof setTimeout> | null = null;

const autoCoverPreviewSrc = computed(() => generatedCoverPreview.value);

const courseColumns = [
	{ title: '课程名称', dataIndex: 'name', key: 'name' },
	{ title: '一级分类', key: 'category', width: 120 },
	{ title: '二级分类', key: 'sub_category', width: 120 },
	{ title: '价格', dataIndex: 'price', key: 'price', width: 100 },
	{ title: '状态', key: 'status', width: 100 },
];

const coursePagination = ref({
	current: 1,
	pageSize: 10,
	total: 0,
});

const formState = ref({
	name: '',
	parent_id: null as number | null,
	cover_img: '',
	bundle_price: 30,
	bundle_enabled: 1,
	sort: 0,
	status: 1,
});

const rules = {
	name: [{ required: true, message: '请输入分类名称', trigger: 'blur' }],
};

const baseColumns = [
	{ title: '分类名称', dataIndex: 'name', key: 'name' },
	{ title: '封面', key: 'cover', width: 100 },
	{ title: '整类购买价', dataIndex: 'bundle_price', key: 'bundle_price', width: 130 },
	{ title: '整类购买入口', dataIndex: 'bundle_enabled', key: 'bundle_enabled', width: 140 },
	{ title: '排序', dataIndex: 'sort', key: 'sort', width: 120 },
	{ title: '状态', key: 'status', width: 120 },
	{ title: '操作', key: 'action', width: 360, fixed: 'right' },
];

const { displayColumns, settingItems, resetColumns, updatePreference } = useTableColumns(
	'question-category-list',
	baseColumns,
	{ lockRightKeys: ['action'] },
);

const tableData = computed(() => categoryTree.value);

const onSelectChange = (keys: number[]) => {
	selectedRowKeys.value = keys;
};

// 只显示一级分类作为父级选项（二级分类不允许新增子分类）
const parentOptions = computed(() =>
	categoryTree.value
		.filter((item) => !item.parent_id) // 只显示一级分类
		.map((item) => ({ label: item.name, value: item.id })),
);

const isEditingSecondaryCategory = computed(() => !!currentRecord.value?.parent_id);

const isEditingPrimaryCategory = computed(() => !!currentRecord.value && !currentRecord.value.parent_id);

const isCategoryBundleSwitchVisible = computed(() => !!formState.value.parent_id);

const isSecondaryCategory = (record: any) => !!record?.parent_id;

const findCategoryById = (items: any[], id?: number | null): any | null => {
	if (!id) return null;
	for (const item of items) {
		if (Number(item.id) === Number(id)) return item;
		if (Array.isArray(item.children)) {
			const found = findCategoryById(item.children, id);
			if (found) return found;
		}
	}
	return null;
};

const getSelectedParentName = () => {
	const parent = findCategoryById(categoryTree.value, formState.value.parent_id);
	return parent?.name || currentRecord.value?.parentCategoryName || '';
};

const fetchCategories = async () => {
	loading.value = true;
	try {
		const res = await getCourseCategoryTree();
		const tree = Array.isArray(res.data) ? res.data : [];
		// 移除二级分类的 children 属性，避免显示展开图标，同时添加父级分类名称
		const processTree = (items: any[], parentName?: string): any[] => {
			return items.map((item) => {
				if (item.parent_id) {
					// 二级分类，移除 children 属性，添加父级分类名称
					const { children, ...rest } = item;
					return {
						...rest,
						parentCategoryName: parentName || '',
					};
				} else {
					// 一级分类，递归处理子分类，传递当前分类名称作为父级名称
					return {
						...item,
						children: item.children ? processTree(item.children, item.name) : [],
					};
				}
			});
		};
		categoryTree.value = processTree(tree);
		selectedRowKeys.value = selectedRowKeys.value.filter((id) => containsCategoryId(categoryTree.value, id));
	} catch (error) {
		message.error('获取分类列表失败');
	} finally {
		loading.value = false;
	}
};

const containsCategoryId = (items: any[], id: number): boolean =>
	items.some((item) => item.id === id || (Array.isArray(item.children) && containsCategoryId(item.children, id)));

const handleAdd = (record: any | null) => {
	// 如果传入的record是二级分类（有parent_id），则不允许添加子分类
	if (record && record.parent_id !== null && record.parent_id !== undefined) {
		message.warning('二级分类不允许新增子分类');
		return;
	}
	currentRecord.value = null;
	formState.value = {
		name: '',
		parent_id: record?.id ?? null,
		cover_img: '',
		bundle_price: 30,
		bundle_enabled: 1,
		sort: 0,
		status: 1,
	};
	coverMode.value = record?.id ? 'auto' : 'manual';
	clearGeneratedCoverPreview();
	modalVisible.value = true;
};

const handleEdit = (record: any) => {
	currentRecord.value = record;
	formState.value = {
		name: record.name || '',
		parent_id: record.parent_id ?? null,
		cover_img: record.cover_img || '',
		bundle_price: Number(record.bundle_price ?? 30),
		bundle_enabled: Number(record.bundle_enabled ?? 1) === 1 ? 1 : 0,
		sort: record.sort ?? 0,
		status: record.status ?? 1,
	};
	coverMode.value = record.parent_id ? (record.cover_img ? 'manual' : 'auto') : 'manual';
	clearGeneratedCoverPreview();
	modalVisible.value = true;
};

const handleCancel = () => {
	modalVisible.value = false;
	formRef.value?.resetFields();
	coverConfigOpen.value = false;
	if (autoCoverTimer) {
		clearTimeout(autoCoverTimer);
		autoCoverTimer = null;
	}
	clearGeneratedCoverPreview();
};

const scheduleAutoCoverPreview = (delay = 240) => {
	if (autoCoverTimer) {
		clearTimeout(autoCoverTimer);
	}
	autoCoverTimer = setTimeout(() => {
		refreshAutoCoverPreview();
	}, delay);
};

const refreshAutoCoverPreview = async () => {
	try {
		if (!modalVisible.value || coverMode.value !== 'auto' || !formState.value.parent_id) return;
		if (!formState.value.name?.trim() || !getSelectedParentName()) {
			clearGeneratedCoverPreview();
			return;
		}
		autoCoverLoading.value = true;
		const coverFile = await generateCategoryCoverFile();
		generatedCoverFile = coverFile;
		if (generatedPreviewObjectUrl) {
			URL.revokeObjectURL(generatedPreviewObjectUrl);
		}
		generatedPreviewObjectUrl = URL.createObjectURL(coverFile);
		generatedCoverPreview.value = generatedPreviewObjectUrl;
	} catch (error) {
		generatedCoverFile = null;
		generatedCoverPreview.value = '';
		console.error('分类封面预览生成失败:', error);
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
	if (coverMode.value !== 'auto' || !formState.value.parent_id) return;
	const coverFile = await generateCategoryCoverFile();
	generatedCoverFile = coverFile;
	const response = await uploadImage(coverFile);
	const url = response.url || response.imageUrl;
	if (!url) {
		throw new Error('自动生成分类封面上传失败');
	}
	formState.value.cover_img = url;
};

const generateCategoryCoverFile = async (
	primaryCategoryInput = getSelectedParentName(),
	secondaryCategoryInput = formState.value.name,
): Promise<File> => {
	const primaryCategory = String(primaryCategoryInput || '').trim();
	const secondaryCategory = String(secondaryCategoryInput || '').trim();
	if (!primaryCategory || !secondaryCategory) {
		throw new Error('请先填写一级分类和二级分类名称');
	}
	let config = DEFAULT_CATEGORY_COVER_CONFIG;
	try {
		if (!coverConfigCache) {
			const res = await getCategoryCoverConfig();
			coverConfigCache = normalizeCourseCoverTemplatePack(res.data || res, { configType: 'category' });
		}
		config = resolveCategoryCoverConfigByCategory(coverConfigCache, {
			category: primaryCategory,
			sub_category: secondaryCategory,
		});
	} catch (_) {
		config = DEFAULT_CATEGORY_COVER_CONFIG;
	}
	const canvas = await renderCourseCover(config, {
		category: primaryCategory,
		sub_category: secondaryCategory,
		name: secondaryCategory,
		subject: primaryCategory,
		school: primaryCategory,
		major: secondaryCategory,
	});
	const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png', 0.96));
	if (!blob) {
		throw new Error('分类封面生成失败');
	}
	const fileName = `${sanitizeFileName(primaryCategory)}-${sanitizeFileName(secondaryCategory)}-category-cover.png`;
	return new File([blob], fileName, { type: 'image/png' });
};

const flattenSecondLevelCategories = () => {
	const categories: Array<{ id: number; name: string; parentName: string }> = [];
	categoryTree.value.forEach((parent) => {
		if (!Array.isArray(parent.children)) return;
		parent.children.forEach((child: any) => {
			if (!child?.id || !child?.name) return;
			categories.push({
				id: Number(child.id),
				name: child.name,
				parentName: parent.name || child.parentCategoryName || '',
			});
		});
	});
	return categories;
};

const syncAllCategoryCovers = async () => {
	const categories = flattenSecondLevelCategories();
	if (!categories.length) {
		message.info('暂无二级分类需要同步封面');
		return;
	}
	syncCategoryCoversLoading.value = true;
	coverConfigCache = null;
	const progressMessageKey = 'sync-category-covers';
	message.loading({ content: `正在同步分类封面 0/${categories.length}...`, key: progressMessageKey, duration: 0 });
	let successCount = 0;
	try {
		for (const [index, category] of categories.entries()) {
			const coverFile = await generateCategoryCoverFile(category.parentName, category.name);
			const response = await uploadImage(coverFile);
			const url = response.url || response.imageUrl;
			if (!url) {
				throw new Error(`${category.parentName}/${category.name} 封面上传失败`);
			}
			await updateCourseCategory(category.id, { cover_img: url });
			successCount += 1;
			message.loading({
				content: `正在同步分类封面 ${index + 1}/${categories.length}...`,
				key: progressMessageKey,
				duration: 0,
			});
		}
		message.success({ content: `已同步 ${successCount} 个分类封面`, key: progressMessageKey, duration: 2 });
		await fetchCategories();
	} catch (error: any) {
		message.error({
			content: error?.message || `分类封面同步失败，已完成 ${successCount}/${categories.length}`,
			key: progressMessageKey,
			duration: 3,
		});
	} finally {
		syncCategoryCoversLoading.value = false;
	}
};

const handleCategoryCoverConfigSaved = async () => {
	coverConfigCache = null;
	await syncAllCategoryCovers();
	scheduleAutoCoverPreview(0);
};

const sanitizeFileName = (value: string) => value.replace(/[\\/:*?"<>|]+/g, '-').slice(0, 40);

const beforeCoverUpload = async (file: File) => {
	if (!file.type.startsWith('image/')) {
		message.warning('请上传图片文件');
		return false;
	}
	coverUploading.value = true;
	try {
		const res = await uploadImage(file);
		formState.value.cover_img = res.imageUrl || res.url;
		message.success('封面上传成功');
	} catch (error: any) {
		message.error(error?.message || '封面上传失败');
	} finally {
		coverUploading.value = false;
	}
	return false;
};

watch(
	[() => modalVisible.value, () => coverMode.value, () => formState.value.parent_id, () => formState.value.name],
	() => {
		if (coverMode.value === 'auto' && formState.value.parent_id) {
			scheduleAutoCoverPreview();
		}
	},
);

const handleSubmit = async () => {
	try {
		await formRef.value?.validate();
		modalLoading.value = true;
		if (coverMode.value === 'auto' && formState.value.parent_id) {
			autoCoverLoading.value = true;
			await ensureAutoCoverUploaded();
		}
		if (currentRecord.value) {
			const res = await updateCourseCategory(currentRecord.value.id, formState.value);
			const syncedCourseCount = Number((res as any)?.data?.syncedCourseCount ?? (res as any)?.syncedCourseCount ?? 0);
			message.success(
				syncedCourseCount > 0 ? `更新成功，已同步 ${syncedCourseCount} 门课程` : '更新成功',
			);
		} else {
			await createCourseCategory(formState.value);
			message.success('创建成功');
		}
		modalVisible.value = false;
		formRef.value?.resetFields();
		fetchCategories();
	} catch (error: any) {
		if (error?.errorFields) return;
		message.error(error?.message || '提交失败');
	} finally {
		modalLoading.value = false;
		autoCoverLoading.value = false;
	}
};

const handleToggleBundleEnabled = async (record: any, checked: boolean) => {
	if (!isSecondaryCategory(record)) return;
	const nextValue = checked ? 1 : 0;
	const previousValue = Number(record.bundle_enabled ?? 1) === 1 ? 1 : 0;
	record.bundle_enabled = nextValue;
	try {
		await updateCourseCategory(record.id, { bundle_enabled: nextValue });
		message.success(nextValue === 1 ? '已显示整类购买入口' : '已隐藏整类购买入口');
	} catch (error: any) {
		record.bundle_enabled = previousValue;
		message.error(error?.message || '更新整类购买入口失败');
	}
};

const handleDelete = async (record: any) => {
	try {
		await deleteCourseCategory(record.id);
		message.success('删除成功');
		fetchCategories();
	} catch (error: any) {
		message.error(error?.message || '删除失败');
	}
};

const showBatchDeleteModal = () => {
	if (selectedRowKeys.value.length === 0) {
		message.warning('请先选择要删除的分类');
		return;
	}
	batchDeleteModalVisible.value = true;
};

const cancelBatchDelete = () => {
	batchDeleteModalVisible.value = false;
};

const confirmBatchDelete = async () => {
	if (selectedRowKeys.value.length === 0) return;

	batchDeleteLoading.value = true;
	try {
		await batchDeleteCourseCategories(selectedRowKeys.value);
		message.success(`成功删除 ${selectedRowKeys.value.length} 个分类`);
		batchDeleteModalVisible.value = false;
		selectedRowKeys.value = [];
		fetchCategories();
	} catch (error: any) {
		message.error(error?.msg || error?.message || '批量删除失败');
	} finally {
		batchDeleteLoading.value = false;
	}
};

const handleBatchEnable = async () => {
	if (selectedRowKeys.value.length === 0) {
		message.warning('请先选择要启用的分类');
		return;
	}

	try {
		await batchUpdateCourseCategoryStatus(selectedRowKeys.value, 1);
		message.success(`成功启用 ${selectedRowKeys.value.length} 个分类`);
		selectedRowKeys.value = [];
		fetchCategories();
	} catch (error: any) {
		message.error(error?.msg || error?.message || '批量启用失败');
	}
};

const handleBatchDisable = async () => {
	if (selectedRowKeys.value.length === 0) {
		message.warning('请先选择要禁用的分类');
		return;
	}

	try {
		await batchUpdateCourseCategoryStatus(selectedRowKeys.value, 0);
		message.success(`成功禁用 ${selectedRowKeys.value.length} 个分类`);
		selectedRowKeys.value = [];
		fetchCategories();
	} catch (error: any) {
		message.error(error?.msg || error?.message || '批量禁用失败');
	}
};

// 处理绑定课程
const handleBindCourse = (record: any) => {
	// 只有二级分类才能绑定课程
	if (!record.parent_id) {
		message.warning('一级分类不能直接绑定课程，请先创建二级分类');
		return;
	}
	// 使用记录中的父级分类名称（在 processTree 中已添加）
	const parentCategoryName = record.parentCategoryName || '';
	// 保存当前分类信息
	currentCategory.value = {
		category: parentCategoryName,
		sub_category: record.name,
	};
	// 设置为绑定模式
	courseSelectMode.value = 'bind';
	// 重置选择
	selectedCourseIds.value = [];
	courseSearchKeyword.value = '';
	coursePagination.value.current = 1;
	// 打开课程选择弹窗
	courseSelectVisible.value = true;
	// 加载课程列表
	fetchCourseList();
};

// 处理移除课程
const handleUnbindCourse = async (record: any) => {
	// 只有二级分类才能移除课程
	if (!record.parent_id) {
		message.warning('一级分类不能移除课程');
		return;
	}
	// 使用记录中的父级分类名称（在 processTree 中已添加）
	const parentCategoryName = record.parentCategoryName || '';
	// 保存当前分类信息
	currentCategory.value = {
		category: parentCategoryName,
		sub_category: record.name,
	};
	// 设置为移除模式
	courseSelectMode.value = 'unbind';
	// 重置选择
	selectedCourseIds.value = [];
	courseSearchKeyword.value = '';
	coursePagination.value.current = 1;
	// 打开课程选择弹窗
	courseSelectVisible.value = true;
	// 加载已绑定到该分类的课程列表
	fetchBoundCourseList();
};

// 存储所有课程数据（用于前端搜索和分页）
const allCourseList = ref<any[]>([]);

// 获取课程列表
const fetchCourseList = async () => {
	courseListLoading.value = true;
	try {
		const res = await getCourseList();
		// 处理返回数据
		if (res.data && Array.isArray(res.data)) {
			allCourseList.value = res.data;
		} else {
			allCourseList.value = [];
		}
		// 应用搜索和分页
		applyCourseFilterAndPagination();
	} catch (error) {
		message.error('获取课程列表失败');
		allCourseList.value = [];
		courseList.value = [];
		coursePagination.value.total = 0;
	} finally {
		courseListLoading.value = false;
	}
};

// 获取已绑定到当前分类的课程列表
const fetchBoundCourseList = async () => {
	courseListLoading.value = true;
	try {
		const res = await getCourseList();
		// 处理返回数据
		if (res.data && Array.isArray(res.data)) {
			allCourseList.value = res.data;
		} else {
			allCourseList.value = [];
		}
		// 过滤出已绑定到当前分类的课程
		if (currentCategory.value) {
			allCourseList.value = allCourseList.value.filter(
				(course) =>
					course.category === currentCategory.value!.category &&
					course.sub_category === currentCategory.value!.sub_category,
			);
		}
		// 应用搜索和分页
		applyCourseFilterAndPagination();
	} catch (error) {
		message.error('获取课程列表失败');
		allCourseList.value = [];
		courseList.value = [];
		coursePagination.value.total = 0;
	} finally {
		courseListLoading.value = false;
	}
};

// 应用搜索和分页
const applyCourseFilterAndPagination = () => {
	let filtered = [...allCourseList.value];
	
	// 搜索过滤
	if (courseSearchKeyword.value) {
		const keyword = courseSearchKeyword.value.toLowerCase();
		filtered = filtered.filter(
			(course) =>
				course.name?.toLowerCase().includes(keyword) ||
				course.subject?.toLowerCase().includes(keyword) ||
				course.category?.toLowerCase().includes(keyword) ||
				course.sub_category?.toLowerCase().includes(keyword),
		);
	}
	
	// 更新总数
	coursePagination.value.total = filtered.length;
	
	// 分页
	const start = (coursePagination.value.current - 1) * coursePagination.value.pageSize;
	const end = start + coursePagination.value.pageSize;
	courseList.value = filtered.slice(start, end);
};

// 判断课程是否已绑定到当前分类
const isCourseBound = (course: any): boolean => {
	if (!currentCategory.value) {
		return false;
	}
	return (
		course.category === currentCategory.value.category &&
		course.sub_category === currentCategory.value.sub_category
	);
};

// 获取复选框属性（用于禁用已绑定的课程）
const getCheckboxProps = (record: any) => {
	// 在绑定模式下，如果课程已经绑定到当前分类，则禁用
	if (courseSelectMode.value === 'bind' && isCourseBound(record)) {
		return {
			disabled: true,
		};
	}
	return {};
};

// 课程选择变化
const onCourseSelectChange = (selectedKeys: number[]) => {
	selectedCourseIds.value = selectedKeys;
};

// 课程表格变化（分页）
const handleCourseTableChange = (pag: any) => {
	coursePagination.value.current = pag.current;
	coursePagination.value.pageSize = pag.pageSize;
	applyCourseFilterAndPagination();
};

// 取消课程选择
const handleCourseSelectCancel = () => {
	courseSelectVisible.value = false;
	selectedCourseIds.value = [];
	courseSearchKeyword.value = '';
	currentCategory.value = null;
	courseSelectMode.value = 'bind';
};

// 提交课程选择
const handleCourseSelectSubmit = async () => {
	if (selectedCourseIds.value.length === 0) {
		message.warning(`请至少选择一个课程`);
		return;
	}
	if (!currentCategory.value) {
		message.error('分类信息丢失，请重试');
		return;
	}
	courseSelectLoading.value = true;
	try {
		if (courseSelectMode.value === 'bind') {
			// 绑定模式：批量更新选中课程的分类
			const updatePromises = selectedCourseIds.value.map((courseId) =>
				updateCourse(courseId, {
					category: currentCategory.value!.category,
					sub_category: currentCategory.value!.sub_category,
				}),
			);
			await Promise.all(updatePromises);
			message.success(`成功将 ${selectedCourseIds.value.length} 个课程绑定到该分类`);
		} else {
			// 移除模式：清空选中课程的分类
			const updatePromises = selectedCourseIds.value.map((courseId) =>
				updateCourse(courseId, {
					category: null,
					sub_category: null,
				}),
			);
			await Promise.all(updatePromises);
			message.success(`成功移除 ${selectedCourseIds.value.length} 个课程的分类绑定`);
		}
		courseSelectVisible.value = false;
		selectedCourseIds.value = [];
		courseSearchKeyword.value = '';
		currentCategory.value = null;
	} catch (error: any) {
		message.error(error?.message || '操作失败');
	} finally {
		courseSelectLoading.value = false;
	}
};

onMounted(() => {
	fetchCategories();
});
</script>

<style scoped>
.category-cover-preview {
	width: 96px;
	height: 96px;
	object-fit: cover;
	border-radius: 8px;
}

.category-cover-uploader {
	color: #999;
}

.category-cover-generator {
	display: flex;
	flex-direction: column;
	gap: 12px;
}

.category-cover-generator__actions {
	display: flex;
	align-items: center;
	gap: 12px;
	flex-wrap: wrap;
}

.category-cover-generator__hint {
	color: #999;
	font-size: 12px;
}

.category-cover-generator__preview {
	width: 160px;
	height: 160px;
	padding: 8px;
	border: 1px solid #f0f0f0;
	border-radius: 12px;
	background: #fff;
}

.category-cover-generator__preview img {
	width: 100%;
	height: 100%;
	object-fit: cover;
	border-radius: 8px;
	display: block;
}

.category-cover-generator__empty {
	width: 160px;
	height: 160px;
	display: flex;
	align-items: center;
	justify-content: center;
	border: 1px dashed #d9d9d9;
	border-radius: 12px;
	color: #999;
	font-size: 12px;
	background: #fafafa;
}
</style>
