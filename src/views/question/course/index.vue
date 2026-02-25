<template>
	<div class="course-management">
		<a-card>
			<template #title>课程管理</template>
			<template #extra>
				<a-space>
					<a-button v-if="selectedRowKeys.length > 0" type="primary" danger @click="showBatchDeleteModal">
						<template #icon><delete-outlined /></template>
						批量删除 ({{ selectedRowKeys.length }})
					</a-button>
					<a-button v-if="selectedRowKeys.length > 0" @click="handleBatchEnable">
						<template #icon><check-outlined /></template>
						批量启用 ({{ selectedRowKeys.length }})
					</a-button>
					<a-button v-if="selectedRowKeys.length > 0" @click="handleBatchDisable">
						<template #icon><close-outlined /></template>
						批量禁用 ({{ selectedRowKeys.length }})
					</a-button>
					<a-button @click="handleGlobalRecommend">公共推荐配置</a-button>
					<a-button type="primary" @click="handleAdd">
						<template #icon><plus-outlined /></template>
						新增课程
					</a-button>
				</a-space>
			</template>

			<a-table
				:columns="columns"
				:data-source="dataSource"
				:loading="loading"
				:pagination="pagination"
				:row-selection="{ selectedRowKeys, onChange: onSelectChange }"
				@change="handleTableChange"
				row-key="id"
			>
				<template #bodyCell="{ column, record }">
					<template v-if="column.key === 'cover'">
						<a-image
							:src="record.cover_img || record.cover"
							:width="60"
							:height="60"
							:preview="false"
							style="object-fit: cover"
						/>
					</template>
					<template v-else-if="column.key === 'is_free'">
						<a-tag :color="record.is_free === 1 ? 'green' : 'default'">
							{{ record.is_free === 1 ? '免费' : '付费' }}
						</a-tag>
					</template>
					<template v-else-if="column.key === 'status'">
						<a-tag :color="record.status === 1 ? 'green' : 'red'">
							{{ record.status === 1 ? '启用' : '禁用' }}
						</a-tag>
					</template>
					<template v-else-if="column.key === 'action'">
						<a-space>
							<a-button type="link" size="small" @click="handleEdit(record)"> 编辑 </a-button>
							<a-button type="link" size="small" @click="handleExamConfig(record)"> 考试配置 </a-button>
							<a-button type="link" size="small" @click="handleRecommendConfig(record)"> 相关推荐 </a-button>
							<a-popconfirm title="确定要删除这个课程吗？" @confirm="handleDelete(record)">
								<a-button type="link" danger size="small">删除</a-button>
							</a-popconfirm>
						</a-space>
					</template>
				</template>
			</a-table>
		</a-card>

		<course-modal v-model:open="modalVisible" :record="currentRecord" @success="handleRefresh" />
		<exam-config-drawer
			:open="examDrawerVisible"
			:course-id="currentCourseId"
			:course-name="currentCourseName"
			@close="examDrawerVisible = false"
		/>
		<recommendation-drawer
			:open="recommendDrawerVisible"
			:course-id="currentCourseId"
			:course-name="currentCourseName"
			@close="recommendDrawerVisible = false"
			@success="handleRefresh"
		/>

		<!-- 批量删除确认弹窗 -->
		<a-modal
			v-model:open="batchDeleteModalVisible"
			title="批量删除确认"
			:confirm-loading="batchDeleteLoading"
			@ok="confirmBatchDelete"
			@cancel="cancelBatchDelete"
		>
			<p>确定要删除选中的 {{ selectedRowKeys.length }} 个课程吗？</p>
			<p style="color: #ff4d4f; font-size: 12px; margin-top: 8px">此操作不可恢复，请谨慎操作！</p>
		</a-modal>
	</div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { message } from 'ant-design-vue';
import { PlusOutlined, DeleteOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons-vue';
import { getCourseList, deleteCourse, batchDeleteCourses, batchUpdateCourseStatus } from '@/api/course';
import CourseModal from './components/CourseModal.vue';
import ExamConfigDrawer from './components/ExamConfigDrawer.vue';
import RecommendationDrawer from './components/RecommendationDrawer.vue';

const loading = ref(false);
const dataSource = ref([]);
const modalVisible = ref(false);
const currentRecord = ref(null);
const examDrawerVisible = ref(false);
const recommendDrawerVisible = ref(false);
const currentCourseId = ref<number | null>(null);
const currentCourseName = ref<string>('');
const selectedRowKeys = ref<number[]>([]);
const batchDeleteModalVisible = ref(false);
const batchDeleteLoading = ref(false);

const pagination = ref({
	current: 1,
	pageSize: 10,
	total: 0,
});

const columns = [
	// {
	// 	title: '封面图',
	// 	key: 'cover',
	// 	width: 100,
	// },
	{
		title: '课程名称',
		dataIndex: 'name',
		key: 'name',
	},
	{
		title: '课程',
		dataIndex: 'subject',
		key: 'subject',
	},
	{
		title: '一级分类',
		dataIndex: 'category',
		key: 'category',
	},
	{
		title: '二级分类',
		dataIndex: 'sub_category',
		key: 'sub_category',
	},
	{
		title: '学校',
		dataIndex: 'school',
		key: 'school',
	},
	{
		title: '专业',
		dataIndex: 'major',
		key: 'major',
	},
	{
		title: '真题年份',
		dataIndex: 'exam_year',
		key: 'exam_year',
	},
	{
		title: '答案年份',
		dataIndex: 'answer_year',
		key: 'answer_year',
	},
	{
		title: '当前价格',
		dataIndex: 'price',
		key: 'price',
		customRender: ({ text }: any) => `¥${text}`,
	},
	{
		title: '代理商售价',
		dataIndex: 'agent_price',
		key: 'agent_price',
		customRender: ({ text }: any) => `¥${text || 0}`,
	},
	{
		title: '是否免费',
		key: 'is_free',
		width: 100,
	},
	{
		title: '状态',
		key: 'status',
		width: 80,
	},
	{
		title: '排序',
		dataIndex: 'sort',
		key: 'sort',
		width: 80,
	},
	{
		title: '操作',
		key: 'action',
		width: 280,
		fixed: 'right',
	},
];

const fetchData = async () => {
	loading.value = true;
	try {
		const res = await getCourseList();
		// 后端返回的是数组，不是分页对象
		dataSource.value = Array.isArray(res.data) ? res.data : res.data.list || [];
		// 如果没有分页信息，使用数组长度
		if (res.data.total !== undefined) {
			pagination.value.total = res.data.total;
		} else {
			pagination.value.total = dataSource.value.length;
		}
	} catch (error) {
		message.error('获取课程列表失败');
	} finally {
		loading.value = false;
	}
};

const handleTableChange = (pag: any) => {
	pagination.value.current = pag.current;
	pagination.value.pageSize = pag.pageSize;
	fetchData();
};

const handleAdd = () => {
	currentRecord.value = null;
	modalVisible.value = true;
};

const handleEdit = (record: any) => {
	currentRecord.value = record;
	modalVisible.value = true;
};

const handleDelete = async (record: any) => {
	try {
		await deleteCourse(record.id);
		message.success('删除成功');
		fetchData();
	} catch (error) {
		message.error('删除失败');
	}
};

const handleRefresh = () => {
	fetchData();
};

const handleExamConfig = (record: any) => {
	currentCourseId.value = record.id;
	currentCourseName.value = record.name;
	examDrawerVisible.value = true;
};

const handleRecommendConfig = (record: any) => {
	currentCourseId.value = record.id;
	currentCourseName.value = record.name;
	recommendDrawerVisible.value = true;
};

const handleGlobalRecommend = () => {
	currentCourseId.value = null;
	currentCourseName.value = '';
	recommendDrawerVisible.value = true;
};

// 选择变化
const onSelectChange = (keys: number[]) => {
	selectedRowKeys.value = keys;
};

// 显示批量删除确认弹窗
const showBatchDeleteModal = () => {
	if (selectedRowKeys.value.length === 0) {
		message.warning('请先选择要删除的课程');
		return;
	}
	batchDeleteModalVisible.value = true;
};

// 取消批量删除
const cancelBatchDelete = () => {
	batchDeleteModalVisible.value = false;
};

// 确认批量删除
const confirmBatchDelete = async () => {
	if (selectedRowKeys.value.length === 0) return;

	batchDeleteLoading.value = true;
	try {
		await batchDeleteCourses(selectedRowKeys.value);
		message.success(`成功删除 ${selectedRowKeys.value.length} 个课程`);
		batchDeleteModalVisible.value = false;
		selectedRowKeys.value = [];
		fetchData();
	} catch (error: any) {
		message.error(error?.msg || error?.message || '批量删除失败');
	} finally {
		batchDeleteLoading.value = false;
	}
};

// 批量启用
const handleBatchEnable = async () => {
	if (selectedRowKeys.value.length === 0) {
		message.warning('请先选择要启用的课程');
		return;
	}

	try {
		await batchUpdateCourseStatus(selectedRowKeys.value, 1);
		message.success(`成功启用 ${selectedRowKeys.value.length} 个课程`);
		selectedRowKeys.value = [];
		fetchData();
	} catch (error: any) {
		message.error(error?.msg || error?.message || '批量启用失败');
	}
};

// 批量禁用
const handleBatchDisable = async () => {
	if (selectedRowKeys.value.length === 0) {
		message.warning('请先选择要禁用的课程');
		return;
	}

	try {
		await batchUpdateCourseStatus(selectedRowKeys.value, 0);
		message.success(`成功禁用 ${selectedRowKeys.value.length} 个课程`);
		selectedRowKeys.value = [];
		fetchData();
	} catch (error: any) {
		message.error(error?.msg || error?.message || '批量禁用失败');
	}
};

onMounted(() => {
	fetchData();
});
</script>

<style scoped lang="scss">
.course-management {
	padding: 24px;
}
</style>
