<template>
	<div class="recommend-management">
		<a-card>
			<template #extra>
				<a-space>
					<a-button type="primary" @click="handleAddCategory('course')">
						<template #icon><plus-outlined /></template>
						新增课程板块
					</a-button>
					<a-button @click="handleAddCategory('category')">
						<template #icon><plus-outlined /></template>
						新增分类板块
					</a-button>
				</a-space>
			</template>

			<div class="table-toolbar">
				<TableColumnSetting :items="settingItems" @update:items="updatePreference" @reset="resetColumns" />
			</div>

			<a-table
				:columns="displayColumns"
				:data-source="dataSource"
				:loading="loading"
				:pagination="false"
				row-key="id"
			>
				<template #bodyCell="{ column, record }">
					<template v-if="column.key === 'status'">
						<a-tag :color="record.status === 1 ? 'green' : 'default'">
							{{ record.status === 1 ? '显示' : '隐藏' }}
						</a-tag>
					</template>
					<template v-else-if="column.key === 'type'">
						<a-tag :color="record.type === 'category' ? 'blue' : 'purple'">
							{{ record.type === 'category' ? '分类板块' : '课程板块' }}
						</a-tag>
					</template>
					<template v-else-if="column.key === 'item_count'">
						<a-button
							type="link"
							:disabled="record.type === 'category'"
							@click="handleManageItems(record)"
						>
							{{ record.item_count || 0 }} 个{{ record.type === 'category' ? '二级分类' : '课程' }}
						</a-button>
					</template>
					<template v-else-if="column.key === 'action'">
						<a-space>
							<a-button type="link" size="small" @click="handleEditCategory(record)">
								编辑
							</a-button>
							<a-button type="link" danger size="small" @click="showDeleteModal(record)">
								删除
							</a-button>
						</a-space>
					</template>
				</template>
			</a-table>
		</a-card>

		<!-- 版块编辑弹窗 -->
		<a-modal
			v-model:open="categoryModalVisible"
			:title="currentCategory ? '编辑版块' : categoryForm.type === 'category' ? '新增分类板块' : '新增课程板块'"
			@ok="handleCategorySubmit"
			@cancel="handleCategoryCancel"
		>
			<a-form
				ref="categoryFormRef"
				:model="categoryForm"
				:label-col="{ span: 6 }"
				:wrapper-col="{ span: 18 }"
				:rules="categoryFormRules"
			>
				<a-form-item label="版块名称" name="name">
					<a-input v-model:value="categoryForm.name" placeholder="请输入版块名称" />
				</a-form-item>
				<a-form-item label="版块类型" name="type">
					<a-radio-group v-model:value="categoryForm.type" :disabled="!!currentCategory">
						<a-radio value="course">课程板块</a-radio>
						<a-radio value="category">分类板块</a-radio>
					</a-radio-group>
				</a-form-item>
				<a-form-item v-if="categoryForm.type === 'category'" label="绑定分类" name="bind_category_id">
					<a-select
						v-model:value="categoryForm.bind_category_id"
						placeholder="请选择一级分类"
						:options="primaryCategoryOptions"
						show-search
						:filter-option="filterSelectOption"
					/>
					<div style="color: #999; font-size: 12px; margin-top: 4px">
						板块内将自动展示该一级分类下所有启用的二级分类
					</div>
				</a-form-item>
				<a-form-item label="排序权重" name="sort">
					<a-input-number v-model:value="categoryForm.sort" :min="0" style="width: 100%" />
					<div style="color: #999; font-size: 12px; margin-top: 4px">
						数字越小，排序越靠前
					</div>
				</a-form-item>
				<a-form-item label="每行列数" name="columns">
					<a-input-number v-model:value="categoryForm.columns" :min="1" :max="4" style="width: 100%" />
					<div style="color: #999; font-size: 12px; margin-top: 4px">
						控制小程序首页该板块一行展示多少个，默认 3 列
					</div>
				</a-form-item>
				<a-form-item label="状态" name="status">
					<a-radio-group v-model:value="categoryForm.status">
						<a-radio :value="1">显示</a-radio>
						<a-radio :value="0">隐藏</a-radio>
					</a-radio-group>
				</a-form-item>
			</a-form>
		</a-modal>

		<!-- 删除确认弹窗 -->
		<a-modal
			v-model:open="deleteModalVisible"
			title="删除确认"
			:confirm-loading="deleteLoading"
			@ok="confirmDelete"
			@cancel="cancelDelete"
		>
			<p>确定要删除这个版块吗？</p>
			<p v-if="currentDeleteRecord" style="color: #999; font-size: 12px; margin-top: 8px">
				版块名称: {{ currentDeleteRecord.name }}
			</p>
			<p v-if="currentDeleteRecord?.item_count > 0" style="color: #ff4d4f; margin-top: 8px">
				警告：该版块下还有 {{ currentDeleteRecord.item_count }} 个{{ currentDeleteRecord.type === 'category' ? '二级分类' : '课程' }}，请谨慎删除
			</p>
		</a-modal>

		<!-- 版块内题库管理弹窗 -->
		<item-management-modal
			v-model:open="itemModalVisible"
			:category="currentCategory"
			@success="handleRefresh"
		/>
	</div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue';
import { message } from 'ant-design-vue';
import { PlusOutlined } from '@ant-design/icons-vue';
import type { FormInstance } from 'ant-design-vue';
import {
	getCategories,
	createCategory,
	updateCategory,
	deleteCategory,
} from '@/api/recommend';
import { getCourseCategoryTree } from '@/api/course-category';
import ItemManagementModal from './components/ItemManagementModal.vue';
import TableColumnSetting from '@/components/TableColumnSetting/index.vue';
import { useTableColumns } from '@/composables/useTableColumns';

const loading = ref(false);
const dataSource = ref<any[]>([]);
const courseCategoryTree = ref<any[]>([]);
const categoryModalVisible = ref(false);
const deleteModalVisible = ref(false);
const deleteLoading = ref(false);
const itemModalVisible = ref(false);
const currentCategory = ref<any>(null);
const currentDeleteRecord = ref<any>(null);
const categoryFormRef = ref<FormInstance>();

const categoryForm = ref({
	name: '',
	type: 'course' as 'course' | 'category',
	bind_category_id: null as number | null,
	sort: 0,
	columns: 3,
	status: 1,
});

const categoryFormRules = {
	name: [{ required: true, message: '请输入版块名称', trigger: 'blur' }],
	bind_category_id: [{ required: true, message: '请选择一级分类', trigger: 'change' }],
};

const baseColumns = [
	{
		title: 'ID',
		dataIndex: 'id',
		key: 'id',
		width: 80,
	},
	{
		title: '版块名称',
		dataIndex: 'name',
		key: 'name',
	},
	{
		title: '类型',
		key: 'type',
		width: 120,
	},
	{
		title: '排序权重',
		dataIndex: 'sort',
		key: 'sort',
		width: 120,
	},
	{
		title: '每行列数',
		dataIndex: 'columns',
		key: 'columns',
		width: 120,
		customRender: ({ text }: any) => `${text || 3} 列`,
	},
	{
		title: '状态',
		key: 'status',
		width: 100,
	},
	{
		title: '内容数量',
		key: 'item_count',
		width: 140,
	},
	{
		title: '操作',
		key: 'action',
		width: 150,
	},
];

const { displayColumns, settingItems, resetColumns, updatePreference } = useTableColumns('recommend-list', baseColumns, {
	lockRightKeys: ['action'],
});

const primaryCategoryOptions = computed(() =>
	courseCategoryTree.value
		.filter((item) => !item.parent_id)
		.map((item) => ({ label: item.name, value: item.id })),
);

const filterSelectOption = (input: string, option: any) =>
	String(option?.label || '').toLowerCase().includes(input.toLowerCase());

const fetchData = async () => {
	loading.value = true;
	try {
		const res = await getCategories();
		dataSource.value = res.data || [];
	} catch (error) {
		message.error('获取版块列表失败');
	} finally {
		loading.value = false;
	}
};

const fetchCourseCategories = async () => {
	try {
		const res = await getCourseCategoryTree();
		courseCategoryTree.value = Array.isArray(res.data) ? res.data : [];
	} catch (error) {
		message.error('获取课程分类失败');
	}
};

const handleAddCategory = (type: 'course' | 'category' = 'course') => {
	currentCategory.value = null;
	categoryForm.value = {
		name: '',
		type,
		bind_category_id: null,
		sort: 0,
		columns: 3,
		status: 1,
	};
	categoryModalVisible.value = true;
};

const handleEditCategory = (record: any) => {
	currentCategory.value = record;
	categoryForm.value = {
		name: record.name,
		type: record.type || 'course',
		bind_category_id: record.bind_category_id || null,
		sort: record.sort,
		columns: record.columns || 3,
		status: record.status,
	};
	categoryModalVisible.value = true;
};

const handleCategorySubmit = async () => {
	try {
		await categoryFormRef.value?.validate();
	} catch (error) {
		return;
	}

	try {
		const payload = {
			...categoryForm.value,
			bind_category_id: categoryForm.value.type === 'category' ? categoryForm.value.bind_category_id : null,
		};
		if (currentCategory.value) {
			await updateCategory(currentCategory.value.id, payload);
			message.success('更新成功');
		} else {
			await createCategory(payload);
			message.success('创建成功');
		}
		categoryModalVisible.value = false;
		categoryFormRef.value?.resetFields();
		fetchData();
	} catch (error: any) {
		const errorMsg = error?.response?.data?.msg || error?.message || (currentCategory.value ? '更新失败' : '创建失败');
		message.error(errorMsg);
	}
};

const handleCategoryCancel = () => {
	categoryModalVisible.value = false;
	currentCategory.value = null;
};

const showDeleteModal = (record: any) => {
	currentDeleteRecord.value = record;
	deleteModalVisible.value = true;
};

const cancelDelete = () => {
	deleteModalVisible.value = false;
	currentDeleteRecord.value = null;
};

const confirmDelete = async () => {
	if (!currentDeleteRecord.value) return;

	deleteLoading.value = true;
	try {
		await deleteCategory(currentDeleteRecord.value.id);
		message.success('删除成功');
		deleteModalVisible.value = false;
		currentDeleteRecord.value = null;
		fetchData();
	} catch (error: any) {
		const errorMsg = error?.response?.data?.msg || error?.message || '删除失败';
		message.error(errorMsg);
	} finally {
		deleteLoading.value = false;
	}
};

const handleManageItems = (record: any) => {
	if (record.type === 'category') {
		message.info('分类板块会自动展示二级分类，无需手动维护课程');
		return;
	}
	currentCategory.value = record;
	itemModalVisible.value = true;
};

const handleRefresh = () => {
	fetchData();
};

onMounted(() => {
	fetchData();
	fetchCourseCategories();
});
</script>

<style scoped lang="scss">
.recommend-management {
	:deep(.ant-table) {
		.ant-table-tbody > tr > td {
			padding: 12px 16px;
		}
	}
}
</style>
