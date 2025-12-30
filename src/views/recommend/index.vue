<template>
	<div class="recommend-management">
		<a-card>
			<template #title>首页推荐管理</template>
			<template #extra>
				<a-button type="primary" @click="handleAddCategory">
					<template #icon><plus-outlined /></template>
					新增版块
				</a-button>
			</template>

			<a-table
				:columns="columns"
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
					<template v-else-if="column.key === 'item_count'">
						<a-button type="link" @click="handleManageItems(record)">
							{{ record.item_count || 0 }} 个题库
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
			:title="currentCategory ? '编辑版块' : '新增版块'"
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
				<a-form-item label="排序权重" name="sort">
					<a-input-number v-model:value="categoryForm.sort" :min="0" style="width: 100%" />
					<div style="color: #999; font-size: 12px; margin-top: 4px">
						数字越小，排序越靠前
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
				警告：该版块下还有 {{ currentDeleteRecord.item_count }} 个题库，删除后这些题库将从推荐中移除
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
import { ref, onMounted } from 'vue';
import { message } from 'ant-design-vue';
import { PlusOutlined } from '@ant-design/icons-vue';
import type { FormInstance } from 'ant-design-vue';
import {
	getCategories,
	createCategory,
	updateCategory,
	deleteCategory,
} from '@/api/recommend';
import ItemManagementModal from './components/ItemManagementModal.vue';

const loading = ref(false);
const dataSource = ref<any[]>([]);
const categoryModalVisible = ref(false);
const deleteModalVisible = ref(false);
const deleteLoading = ref(false);
const itemModalVisible = ref(false);
const currentCategory = ref<any>(null);
const currentDeleteRecord = ref<any>(null);
const categoryFormRef = ref<FormInstance>();

const categoryForm = ref({
	name: '',
	sort: 0,
	status: 1,
});

const categoryFormRules = {
	name: [{ required: true, message: '请输入版块名称', trigger: 'blur' }],
};

const columns = [
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
		title: '排序权重',
		dataIndex: 'sort',
		key: 'sort',
		width: 120,
	},
	{
		title: '状态',
		key: 'status',
		width: 100,
	},
	{
		title: '题库数量',
		key: 'item_count',
		width: 120,
	},
	{
		title: '操作',
		key: 'action',
		width: 150,
	},
];

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

const handleAddCategory = () => {
	currentCategory.value = null;
	categoryForm.value = {
		name: '',
		sort: 0,
		status: 1,
	};
	categoryModalVisible.value = true;
};

const handleEditCategory = (record: any) => {
	currentCategory.value = record;
	categoryForm.value = {
		name: record.name,
		sort: record.sort,
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
		if (currentCategory.value) {
			await updateCategory(currentCategory.value.id, categoryForm.value);
			message.success('更新成功');
		} else {
			await createCategory(categoryForm.value);
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
	currentCategory.value = record;
	itemModalVisible.value = true;
};

const handleRefresh = () => {
	fetchData();
};

onMounted(() => {
	fetchData();
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

