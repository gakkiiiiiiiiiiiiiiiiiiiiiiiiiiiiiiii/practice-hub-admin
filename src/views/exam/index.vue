<template>
	<div class="exam-management">
		<a-card>
			<template #title>考试管理</template>

			<div class="toolbar">
				<a-space>
					<a-select
						v-model:value="filters.courseId"
						placeholder="选择课程"
						style="width: 200px"
						allowClear
						@change="handleSearch"
					>
						<a-select-option v-for="course in courseList" :key="course.id" :value="course.id">
							{{ course.name }}
						</a-select-option>
					</a-select>
					<a-button type="primary" @click="handleAdd">新增考试配置</a-button>
					<a-button @click="handleSearch">查询</a-button>
				</a-space>
			</div>

			<a-table
				:columns="columns"
				:data-source="dataSource"
				:loading="loading"
				:pagination="pagination"
				@change="handleTableChange"
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
		</a-card>

		<exam-config-modal
			v-model:open="modalVisible"
			:record="currentRecord"
			:course-list="courseList"
			@success="handleSuccess"
		/>
	</div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { message, Modal } from 'ant-design-vue';
import { getExamConfigList, deleteExamConfig } from '@/api/exam';
import { getCourseList } from '@/api/course';
import ExamConfigModal from './components/ExamConfigModal.vue';

const columns = [
	{
		title: 'ID',
		dataIndex: 'id',
		key: 'id',
		width: 80,
	},
	{
		title: '课程',
		dataIndex: 'course_name',
		key: 'course_name',
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
const courseList = ref([]);
const filters = ref({
	courseId: undefined,
});
const pagination = ref({
	current: 1,
	pageSize: 20,
	total: 0,
});

const modalVisible = ref(false);
const currentRecord = ref<any>(null);

onMounted(() => {
	loadCourseList();
	loadData();
});

const loadCourseList = async () => {
	try {
		const res = await getCourseList();
		courseList.value = res.list || res || [];
	} catch (error: any) {
		console.error('加载课程列表失败:', error);
	}
};

const loadData = async () => {
	loading.value = true;
	try {
		const params: any = {
			page: pagination.value.current,
			pageSize: pagination.value.pageSize,
		};
		if (filters.value.courseId) {
			params.courseId = filters.value.courseId;
		}

		const res = await getExamConfigList(filters.value.courseId);
		dataSource.value = Array.isArray(res) ? res : res.list || [];
		pagination.value.total = Array.isArray(res) ? res.length : res.total || 0;
	} catch (error: any) {
		message.error(error.msg || '加载失败');
	} finally {
		loading.value = false;
	}
};

const handleSearch = () => {
	pagination.value.current = 1;
	loadData();
};

const handleTableChange = (pag: any) => {
	pagination.value.current = pag.current;
	pagination.value.pageSize = pag.pageSize;
	loadData();
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
				message.error(error.msg || '删除失败');
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
.exam-management {
	padding: 24px;

	.toolbar {
		margin-bottom: 16px;
	}
}
</style>
