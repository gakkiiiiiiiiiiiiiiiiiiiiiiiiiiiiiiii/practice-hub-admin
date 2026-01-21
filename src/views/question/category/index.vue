<template>
	<div class="course-category-management">
		<a-card>
			<template #title>题库分类管理</template>
			<template #extra>
				<a-button type="primary" @click="handleAdd(null)">
					<template #icon><plus-outlined /></template>
					新增一级分类
				</a-button>
			</template>

			<a-table
				:columns="columns"
				:data-source="tableData"
				:loading="loading"
				row-key="id"
				:pagination="false"
			>
				<template #bodyCell="{ column, record }">
					<template v-if="column.key === 'status'">
						<a-tag :color="record.status === 1 ? 'green' : 'default'">
							{{ record.status === 1 ? '启用' : '禁用' }}
						</a-tag>
					</template>
					<template v-else-if="column.key === 'action'">
						<a-space>
							<a-button type="link" size="small" @click="handleAdd(record)">新增子分类</a-button>
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
						allow-clear
						placeholder="不选择则为一级分类"
						:options="parentOptions"
					/>
				</a-form-item>
				<a-form-item label="排序" name="sort">
					<a-input-number v-model:value="formState.sort" :min="0" style="width: 100%" />
				</a-form-item>
				<a-form-item label="状态" name="status">
					<a-radio-group v-model:value="formState.status">
						<a-radio :value="1">启用</a-radio>
						<a-radio :value="0">禁用</a-radio>
					</a-radio-group>
				</a-form-item>
			</a-form>
		</a-modal>
	</div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { message } from 'ant-design-vue';
import { PlusOutlined } from '@ant-design/icons-vue';
import {
	getCourseCategoryTree,
	createCourseCategory,
	updateCourseCategory,
	deleteCourseCategory,
} from '@/api/course-category';

const loading = ref(false);
const modalVisible = ref(false);
const modalLoading = ref(false);
const currentRecord = ref<any>(null);
const categoryTree = ref<any[]>([]);
const formRef = ref();

const formState = ref({
	name: '',
	parent_id: null as number | null,
	sort: 0,
	status: 1,
});

const rules = {
	name: [{ required: true, message: '请输入分类名称', trigger: 'blur' }],
};

const columns = [
	{ title: '分类名称', dataIndex: 'name', key: 'name' },
	{ title: '排序', dataIndex: 'sort', key: 'sort', width: 120 },
	{ title: '状态', key: 'status', width: 120 },
	{ title: '操作', key: 'action', width: 220 },
];

const tableData = computed(() => categoryTree.value);

const parentOptions = computed(() =>
	categoryTree.value.map((item) => ({ label: item.name, value: item.id })),
);

const fetchCategories = async () => {
	loading.value = true;
	try {
		const res = await getCourseCategoryTree();
		categoryTree.value = Array.isArray(res.data) ? res.data : [];
	} catch (error) {
		message.error('获取分类列表失败');
	} finally {
		loading.value = false;
	}
};

const handleAdd = (record: any | null) => {
	currentRecord.value = null;
	formState.value = {
		name: '',
		parent_id: record?.id ?? null,
		sort: 0,
		status: 1,
	};
	modalVisible.value = true;
};

const handleEdit = (record: any) => {
	currentRecord.value = record;
	formState.value = {
		name: record.name || '',
		parent_id: record.parent_id ?? null,
		sort: record.sort ?? 0,
		status: record.status ?? 1,
	};
	modalVisible.value = true;
};

const handleCancel = () => {
	modalVisible.value = false;
	formRef.value?.resetFields();
};

const handleSubmit = async () => {
	try {
		await formRef.value?.validate();
		modalLoading.value = true;
		if (currentRecord.value) {
			await updateCourseCategory(currentRecord.value.id, formState.value);
			message.success('更新成功');
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

onMounted(() => {
	fetchCategories();
});
</script>
