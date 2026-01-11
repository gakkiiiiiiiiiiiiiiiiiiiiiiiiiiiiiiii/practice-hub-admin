<template>
	<div class="question-list">
		<a-card>
			<template #title>试题管理</template>
			<template #extra>
				<a-space>
					<a-button
						v-if="selectedRowKeys.length > 0"
						type="primary"
						danger
						@click="showBatchDeleteModal"
					>
						<template #icon><delete-outlined /></template>
						批量删除 ({{ selectedRowKeys.length }})
					</a-button>
					<a-button @click="handleDownloadTemplate">
						<template #icon><download-outlined /></template>
						下载模板
					</a-button>
					<a-upload :before-upload="handleImport" :show-upload-list="false" accept=".xlsx,.xls,.doc,.docx">
						<a-button>
							<template #icon><upload-outlined /></template>
							批量导入
						</a-button>
					</a-upload>
					<a-button type="primary" @click="handleAdd">
						<template #icon><plus-outlined /></template>
						新增题目
					</a-button>
				</a-space>
			</template>

			<a-form :model="searchForm" layout="inline" class="search-form">
				<a-form-item label="课程">
					<a-select v-model:value="searchForm.courseId" placeholder="请选择" style="width: 150px" allow-clear>
						<a-select-option v-for="course in courseList" :key="course.id" :value="course.id">
							{{ course.name }}
						</a-select-option>
					</a-select>
				</a-form-item>
				<a-form-item label="章节">
					<a-select v-model:value="searchForm.chapterId" placeholder="请选择" style="width: 150px" allow-clear>
						<a-select-option v-for="chapter in chapterList" :key="chapter.id" :value="chapter.id">
							{{ chapter.name }}
						</a-select-option>
					</a-select>
				</a-form-item>
				<a-form-item label="题型">
					<a-select v-model:value="searchForm.type" placeholder="请选择" style="width: 120px" allow-clear>
						<a-select-option :value="1">单选题</a-select-option>
						<a-select-option :value="2">多选题</a-select-option>
						<a-select-option :value="3">判断题</a-select-option>
						<a-select-option :value="4">填空题</a-select-option>
						<a-select-option :value="5">阅读理解</a-select-option>
					</a-select>
				</a-form-item>
				<a-form-item>
					<a-button type="primary" @click="handleSearch">查询</a-button>
					<a-button style="margin-left: 8px" @click="handleReset">重置</a-button>
				</a-form-item>
			</a-form>

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
					<template v-if="column.key === 'type'">
						<a-tag>
							{{
								record.type === 1
									? '单选题'
									: record.type === 2
									? '多选题'
									: record.type === 3
									? '判断题'
									: record.type === 4
									? '填空题'
									: record.type === 5
									? '阅读理解'
									: '未知'
							}}
						</a-tag>
					</template>
					<template v-else-if="column.key === 'stem'">
						<span v-html="getStemText(record.stem)"></span>
					</template>
					<template v-else-if="column.key === 'action'">
						<a-space>
							<a-button type="link" size="small" @click="handleEdit(record)"> 编辑 </a-button>
							<a-button type="link" danger size="small" @click="showDeleteModal(record)">删除</a-button>
						</a-space>
					</template>
				</template>
			</a-table>
		</a-card>

		<!-- 删除确认弹窗 -->
		<a-modal
			v-model:open="deleteModalVisible"
			title="删除确认"
			:confirm-loading="deleteLoading"
			@ok="confirmDelete"
			@cancel="cancelDelete"
		>
			<p>确定要删除这道题目吗？</p>
			<p v-if="currentDeleteRecord" style="color: #999; font-size: 12px; margin-top: 8px">
				题目ID: {{ currentDeleteRecord.id }}
			</p>
		</a-modal>

		<!-- 批量删除确认弹窗 -->
		<a-modal
			v-model:open="batchDeleteModalVisible"
			title="批量删除确认"
			:confirm-loading="batchDeleteLoading"
			@ok="confirmBatchDelete"
			@cancel="cancelBatchDelete"
		>
			<p>确定要删除选中的 {{ selectedRowKeys.length }} 道题目吗？</p>
			<p style="color: #ff4d4f; font-size: 12px; margin-top: 8px">此操作不可恢复，请谨慎操作！</p>
		</a-modal>
	</div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { message } from 'ant-design-vue';
import { PlusOutlined, DownloadOutlined, UploadOutlined, DeleteOutlined } from '@ant-design/icons-vue';
import {
	getQuestionList,
	deleteQuestion,
	deleteQuestionsBatch,
	getChapterList,
	downloadQuestionTemplate,
	importQuestions,
} from '@/api/question';
import { getCourseList } from '@/api/course';

const router = useRouter();

const loading = ref(false);
const dataSource = ref<any[]>([]);
const courseList = ref<any[]>([]);
const chapterList = ref<any[]>([]);
const deleteModalVisible = ref(false);
const deleteLoading = ref(false);
const currentDeleteRecord = ref<any>(null);
const selectedRowKeys = ref<number[]>([]);
const batchDeleteModalVisible = ref(false);
const batchDeleteLoading = ref(false);

const searchForm = ref({
	courseId: undefined,
	chapterId: undefined,
	type: undefined,
});

const pagination = ref({
	current: 1,
	pageSize: 10,
	total: 0,
});

const columns = [
	{
		title: 'ID',
		dataIndex: 'id',
		key: 'id',
		width: 80,
	},
	{
		title: '课程',
		dataIndex: 'courseName',
		key: 'courseName',
	},
	{
		title: '章节',
		dataIndex: 'chapterName',
		key: 'chapterName',
	},
	{
		title: '题型',
		key: 'type',
		width: 100,
	},
	{
		title: '题干',
		key: 'stem',
		ellipsis: true,
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
		console.error('获取课程列表失败:', error);
	}
};

const fetchChapters = async () => {
	if (!searchForm.value.courseId) {
		chapterList.value = [];
		return;
	}
	try {
		const res = await getChapterList({
			courseId: searchForm.value.courseId,
		});
		// 后端返回的是数组，不是分页对象
		chapterList.value = Array.isArray(res.data) ? res.data : res.data.list || [];
	} catch (error) {
		console.error('获取章节列表失败:', error);
		chapterList.value = [];
	}
};

const fetchData = async () => {
	loading.value = true;
	try {
		// 后端查询参数是 course_id 和 chapter_id
		const params: any = {};
		if (searchForm.value.courseId) {
			params.course_id = searchForm.value.courseId;
		}
		if (searchForm.value.chapterId) {
			params.chapter_id = searchForm.value.chapterId;
		}
		if (searchForm.value.type) {
			params.type = searchForm.value.type;
		}

		const res = await getQuestionList(params);
		// 后端返回的是数组，不是分页对象
		const questions = Array.isArray(res.data) ? res.data : res.data.list || [];
		dataSource.value = questions;
		pagination.value.total = questions.length;
	} catch (error) {
		message.error('获取题目列表失败');
	} finally {
		loading.value = false;
	}
};

const handleTableChange = (pag: any) => {
	pagination.value.current = pag.current;
	pagination.value.pageSize = pag.pageSize;
	fetchData();
};

const handleSearch = () => {
	pagination.value.current = 1;
	fetchData();
};

const handleReset = () => {
	searchForm.value = {
		courseId: undefined,
		chapterId: undefined,
		type: undefined,
	};
	handleSearch();
};

const handleAdd = () => {
	router.push('/question/edit');
};

const handleEdit = (record: any) => {
	router.push(`/question/edit/${record.id}`);
};

// 显示删除确认弹窗
const showDeleteModal = (record: any) => {
	currentDeleteRecord.value = record;
	deleteModalVisible.value = true;
};

// 取消删除
const cancelDelete = () => {
	deleteModalVisible.value = false;
	currentDeleteRecord.value = null;
};

// 确认删除
const confirmDelete = async () => {
	if (!currentDeleteRecord.value) return;

	deleteLoading.value = true;
	try {
		await deleteQuestion(currentDeleteRecord.value.id);
		message.success('删除成功');
		deleteModalVisible.value = false;
		currentDeleteRecord.value = null;
		selectedRowKeys.value = [];
		fetchData();
	} catch (error) {
		message.error('删除失败');
	} finally {
		deleteLoading.value = false;
	}
};

// 选择变化
const onSelectChange = (keys: number[]) => {
	selectedRowKeys.value = keys;
};

// 显示批量删除确认弹窗
const showBatchDeleteModal = () => {
	if (selectedRowKeys.value.length === 0) {
		message.warning('请先选择要删除的题目');
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
		await deleteQuestionsBatch(selectedRowKeys.value);
		message.success(`成功删除 ${selectedRowKeys.value.length} 道题目`);
		batchDeleteModalVisible.value = false;
		selectedRowKeys.value = [];
		fetchData();
	} catch (error: any) {
		message.error(error.msg || '批量删除失败');
	} finally {
		batchDeleteLoading.value = false;
	}
};

const handleDownloadTemplate = async () => {
	try {
		const res = await downloadQuestionTemplate();
		// 从响应中获取 blob
		const blob = res instanceof Blob ? res : new Blob([res.data || res]);
		const url = window.URL.createObjectURL(blob);
		const link = document.createElement('a');
		link.href = url;
		link.download = '题目导入模板.xlsx';
		link.click();
		window.URL.revokeObjectURL(url);
	} catch (error) {
		message.error('下载模板失败');
	}
};

const handleImport = async (file: File) => {
	try {
		const formData = new FormData();
		formData.append('file', file);
		await importQuestions(formData);
		message.success('导入成功');
		fetchData();
	} catch (error) {
		message.error('导入失败');
	}
	return false;
};

// 获取题干纯文本（去除HTML标签）
const getStemText = (html: string) => {
	if (!html) return '';
	const div = document.createElement('div');
	div.innerHTML = html;
	const text = div.textContent || div.innerText || '';
	// 限制显示长度
	return text.length > 50 ? text.substring(0, 50) + '...' : text;
};

watch(
	() => searchForm.value.courseId,
	() => {
		searchForm.value.chapterId = undefined;
		fetchChapters();
	}
);

onMounted(() => {
	fetchCourses();
	fetchData();
});
</script>

<style scoped lang="scss">
.question-list {
	.search-form {
		margin-bottom: 16px;
	}
}
</style>
