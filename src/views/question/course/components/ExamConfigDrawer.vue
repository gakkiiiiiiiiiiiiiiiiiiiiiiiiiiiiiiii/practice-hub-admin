<template>
	<a-drawer
		:open="open"
		:title="`${props.courseName} - 考试配置`"
		width="800px"
		@close="handleClose"
	>
		<div class="exam-config-drawer">
			<div class="drawer-header">
				<a-button type="primary" @click="handleAdd">
					<template #icon><plus-outlined /></template>
					新增考试配置
				</a-button>
			</div>

			<a-table
				:columns="columns"
				:data-source="dataSource"
				:loading="loading"
				:pagination="false"
				row-key="id"
			>
				<template #bodyCell="{ column, record }">
					<template v-if="column.key === 'is_enabled'">
						<a-tag :color="record.is_enabled === 1 ? 'green' : 'default'">
							{{ record.is_enabled === 1 ? '启用' : '禁用' }}
						</a-tag>
					</template>
					<template v-else-if="column.key === 'action'">
						<a-space>
							<a-button type="link" size="small" @click="handleEdit(record)">编辑</a-button>
							<a-button type="link" size="small" danger @click="handleDelete(record)">删除</a-button>
						</a-space>
					</template>
				</template>
			</a-table>
		</div>

		<exam-config-modal
			:open="modalVisible"
			:record="currentRecord"
			:course-id="props.courseId"
			:course-name="props.courseName"
			:course-list="[]"
			@update:open="(val) => (modalVisible = val)"
			@success="handleSuccess"
		/>
	</a-drawer>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { message, Modal } from 'ant-design-vue';
import { PlusOutlined } from '@ant-design/icons-vue';
import { getExamConfigList, deleteExamConfig } from '@/api/exam';
import ExamConfigModal from '@/views/exam/components/ExamConfigModal.vue';

const props = defineProps<{
	open: boolean;
	courseId: number | null;
	courseName: string;
}>();

const emit = defineEmits<{
	(e: 'close'): void;
}>();

const columns = [
	{
		title: 'ID',
		dataIndex: 'id',
		key: 'id',
		width: 80,
	},
	{
		title: '考试名称',
		dataIndex: 'name',
		key: 'name',
	},
	{
		title: '题目数量',
		dataIndex: 'question_count',
		key: 'question_count',
		width: 100,
	},
	{
		title: '考试时长',
		dataIndex: 'duration',
		key: 'duration',
		width: 100,
		customRender: ({ text }: any) => `${text} 分钟`,
	},
	{
		title: '满分',
		dataIndex: 'full_score',
		key: 'full_score',
		width: 100,
		customRender: ({ text }: any) => `${text} 分`,
	},
	{
		title: '及格分',
		dataIndex: 'pass_score',
		key: 'pass_score',
		width: 100,
		customRender: ({ text }: any) => `${text} 分`,
	},
	{
		title: '状态',
		key: 'is_enabled',
		width: 100,
	},
	{
		title: '操作',
		key: 'action',
		width: 150,
		fixed: 'right',
	},
];

const dataSource = ref([]);
const loading = ref(false);
const modalVisible = ref(false);
const currentRecord = ref<any>(null);

watch(
	() => props.open,
	(val) => {
		if (val && props.courseId) {
			loadData();
		}
	}
);

const loadData = async () => {
	if (!props.courseId) return;
	loading.value = true;
	try {
		const res = await getExamConfigList(props.courseId);
		// 后端返回格式：{ code: 200, data: [...], msg: 'success' }
		dataSource.value = Array.isArray(res.data) ? res.data : res.data?.list || res.list || [];
	} catch (error: any) {
		message.error(error.msg || error.message || '加载失败');
	} finally {
		loading.value = false;
	}
};

const handleClose = () => {
	emit('close');
};

const handleAdd = () => {
	currentRecord.value = null;
	modalVisible.value = true;
};

const handleEdit = (record: any) => {
	currentRecord.value = record;
	modalVisible.value = true;
};

const handleDelete = (record: any) => {
	Modal.confirm({
		title: '确认删除',
		content: `确定要删除考试配置"${record.name}"吗？`,
		onOk: async () => {
			try {
				await deleteExamConfig(record.id);
				message.success('删除成功');
				loadData();
			} catch (error: any) {
				message.error(error.msg || error.message || '删除失败');
			}
		},
	});
};

const handleSuccess = () => {
	modalVisible.value = false;
	loadData();
};
</script>

<style scoped lang="scss">
.exam-config-drawer {
	.drawer-header {
		margin-bottom: 16px;
	}
}
</style>
