<template>
	<div class="chapter-management">
		<a-card>
			<template #title>章节管理</template>
			<template #extra>
				<a-space>
					<a-select
						v-model:value="selectedCourseId"
						placeholder="选择课程"
						style="width: 200px"
						@change="handleCourseChange"
					>
						<a-select-option v-for="course in courseList" :key="course.id" :value="course.id">
							{{ course.name }}
						</a-select-option>
					</a-select>
					<a-button @click="fetchCourses" title="刷新课程列表">
						<template #icon><reload-outlined /></template>
					</a-button>
					<a-button type="primary" :disabled="!selectedCourseId" @click="handleAdd">
						<template #icon><plus-outlined /></template>
						新增章节
					</a-button>
				</a-space>
			</template>

			<a-table
				:columns="columns"
				:data-source="dataSource"
				:loading="loading"
				:pagination="pagination"
				@change="handleTableChange"
				row-key="id"
			>
				<template #bodyCell="{ column, record }">
					<template v-if="column.key === 'is_free'">
						<a-tag :color="record.is_free === 1 ? 'green' : 'default'">
							{{ record.is_free === 1 ? '试读' : 'VIP' }}
						</a-tag>
					</template>
					<template v-else-if="column.key === 'action'">
						<a-space>
							<a-button type="link" size="small" @click="handleEdit(record)"> 编辑 </a-button>
							<a-popconfirm title="确定要删除这个章节吗？" @confirm="handleDelete(record)">
								<a-button type="link" danger size="small">删除</a-button>
							</a-popconfirm>
						</a-space>
					</template>
				</template>
			</a-table>
		</a-card>

		<chapter-modal
			v-model:open="modalVisible"
			:record="currentRecord"
			:course-id="selectedCourseId"
			@success="handleRefresh"
		/>
	</div>
</template>

<script setup lang="ts">
import { ref, onMounted, onActivated } from 'vue';
import { message } from 'ant-design-vue';
import { PlusOutlined, ReloadOutlined } from '@ant-design/icons-vue';
import { getChapterList, deleteChapter } from '@/api/question';
import { getCourseList } from '@/api/course';
import ChapterModal from './components/ChapterModal.vue';

const loading = ref(false);
const dataSource = ref([]);
const courseList = ref([]);
const selectedCourseId = ref<number | null>(null);
const modalVisible = ref(false);
const currentRecord = ref(null);

const pagination = ref({
	current: 1,
	pageSize: 10,
	total: 0,
});

const columns = [
	{
		title: '章节名称',
		dataIndex: 'name',
		key: 'name',
	},
	{
		title: '排序',
		dataIndex: 'sort',
		key: 'sort',
		width: 100,
	},
	{
		title: '试读/VIP',
		key: 'is_free',
		width: 120,
	},
	{
		title: '操作',
		key: 'action',
		width: 150,
	},
];

const fetchCourses = async () => {
	try {
		const res = await getCourseList();
		// 后端返回的是数组，不是分页对象
		courseList.value = Array.isArray(res.data) ? res.data : res.data.list || [];
	} catch (error) {
		message.error('获取课程列表失败');
	}
};

const fetchData = async () => {
	if (!selectedCourseId.value) {
		dataSource.value = [];
		return;
	}

	loading.value = true;
	try {
		const res = await getChapterList({
			courseId: selectedCourseId.value,
		});
		// 后端返回的是数组，不是分页对象
		const chapters = Array.isArray(res.data) ? res.data : res.data.list || [];
		dataSource.value = chapters;
		pagination.value.total = chapters.length;
	} catch (error) {
		message.error('获取章节列表失败');
	} finally {
		loading.value = false;
	}
};

const handleCourseChange = () => {
	pagination.value.current = 1;
	fetchData();
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
		await deleteChapter(record.id);
		message.success('删除成功');
		fetchData();
	} catch (error) {
		message.error('删除失败');
	}
};

const handleRefresh = () => {
	fetchData();
};

onMounted(() => {
	fetchCourses();
});

// 当页面激活时（从其他页面返回时）刷新课程列表
onActivated(() => {
	fetchCourses();
});
</script>

<style scoped lang="scss">
.chapter-management {
	// 样式
}
</style>
