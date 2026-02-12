<template>
	<div class="question-list">
		<a-card>
			<template #title>试题管理</template>
			<template #extra>
				<a-space>
					<a-button v-if="selectedRowKeys.length > 0" type="primary" danger @click="showBatchDeleteModal">
						<template #icon><delete-outlined /></template>
						批量删除 ({{ selectedRowKeys.length }})
					</a-button>
					<a-button @click="handleDownloadTemplate">
						<template #icon><download-outlined /></template>
						下载模板
					</a-button>
					<a-button @click="showImportModal">
						<template #icon><upload-outlined /></template>
						批量导入
					</a-button>
					<a-button @click="showJsonImportModal">
						<template #icon><file-text-outlined /></template>
						JSON 导入
					</a-button>
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
						<span>{{ getStemText(record.stem) }}</span>
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

		<!-- 导入题目弹窗 -->
		<a-modal
			v-model:open="importModalVisible"
			title="批量导入题目"
			:confirm-loading="importLoading"
			@ok="confirmImport"
			@cancel="cancelImport"
			:width="500"
			:ok-button-props="{ disabled: !canImport }"
		>
			<a-form :model="importForm" :label-col="{ span: 6 }" :wrapper-col="{ span: 18 }">
				<a-form-item label="课程" :required="true">
					<a-select
						v-model:value="importForm.courseId"
						placeholder="请选择课程"
						style="width: 100%"
						@change="handleImportCourseChange"
					>
						<a-select-option v-for="course in courseList" :key="course.id" :value="course.id">
							{{ course.name }}
						</a-select-option>
					</a-select>
				</a-form-item>
				<a-form-item label="章节" :required="true">
					<a-select
						v-model:value="importForm.chapterId"
						placeholder="请先选择课程"
						style="width: 100%"
						:disabled="!importForm.courseId"
					>
						<a-select-option v-for="chapter in importChapterList" :key="chapter.id" :value="chapter.id">
							{{ chapter.name }}
						</a-select-option>
					</a-select>
				</a-form-item>
				<a-form-item label="文件" :required="true">
					<a-upload
						:before-upload="handleFileSelect"
						:show-upload-list="false"
						accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
						:disabled="!importForm.courseId || !importForm.chapterId"
					>
						<a-button :disabled="!importForm.courseId || !importForm.chapterId">
							<template #icon><upload-outlined /></template>
							{{ importFile ? importFile.name : '选择文件' }}
						</a-button>
					</a-upload>
					<div v-if="importFile" style="margin-top: 8px; color: #52c41a; font-size: 12px">
						已选择：{{ importFile.name }}
					</div>
					<div v-else style="margin-top: 8px; color: #999; font-size: 12px">
						请先选择课程和章节，然后选择要导入的Excel文件（.xlsx 或 .xls 格式）
					</div>
				</a-form-item>
			</a-form>
		</a-modal>

		<!-- JSON 导入弹窗 -->
		<json-import-modal v-model:open="jsonImportModalVisible" @success="handleJsonImportSuccess" />
	</div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { message } from 'ant-design-vue';
import {
	PlusOutlined,
	DownloadOutlined,
	UploadOutlined,
	DeleteOutlined,
	FileTextOutlined,
} from '@ant-design/icons-vue';
import { stripHtmlTags } from '@/utils/sanitize';
import { getQuestionList, deleteQuestion, deleteQuestionsBatch, getChapterList, importQuestions } from '@/api/question';
import { generateQuestionTemplate } from '@/utils/excel-template';
import { getCourseList } from '@/api/course';
import JsonImportModal from './components/JsonImportModal.vue';

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
const importModalVisible = ref(false);
const importLoading = ref(false);
const importFile = ref<File | null>(null);
const importChapterList = ref<any[]>([]);
const jsonImportModalVisible = ref(false);

const searchForm = ref({
	courseId: undefined,
	chapterId: undefined,
	type: undefined,
});

const importForm = ref({
	courseId: undefined,
	chapterId: undefined,
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
		// 前端生成模板
		const blob = await generateQuestionTemplate();

		const url = window.URL.createObjectURL(blob);
		const link = document.createElement('a');
		link.href = url;
		link.download = '题目导入模板.xlsx';
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
		window.URL.revokeObjectURL(url);
		message.success('模板下载成功');
	} catch (error: any) {
		console.error('下载模板失败:', error);
		message.error(error?.message || '下载模板失败');
	}
};

// 显示导入弹窗
const showImportModal = () => {
	importModalVisible.value = true;
	importForm.value = {
		courseId: undefined,
		chapterId: undefined,
	};
	importFile.value = null;
	importChapterList.value = [];
};

// 处理文件选择
const handleFileSelect = (file: File) => {
	// 验证文件类型
	const allowedTypes = [
		'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
		'application/vnd.ms-excel', // .xls
	];
	const allowedExtensions = ['.xlsx', '.xls'];

	const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
	const isValidType = allowedTypes.includes(file.type) || allowedExtensions.includes(fileExtension);

	if (!isValidType) {
		message.error('只能选择 Excel 格式的文件（.xlsx 或 .xls）');
		return false;
	}

	importFile.value = file;
	return false; // 阻止自动上传
};

// 导入弹窗中课程变化
const handleImportCourseChange = async (courseId: number) => {
	importForm.value.chapterId = undefined;
	if (!courseId) {
		importChapterList.value = [];
		return;
	}
	try {
		const res = await getChapterList({ courseId });
		importChapterList.value = Array.isArray(res.data) ? res.data : res.data.list || [];
	} catch (error) {
		console.error('获取章节列表失败:', error);
		importChapterList.value = [];
	}
};

// 计算是否可以导入（必须选择课程、章节和文件）
const canImport = computed(() => {
	return !!importForm.value.courseId && !!importForm.value.chapterId && !!importFile.value;
});

// 确认导入
const confirmImport = async () => {
	if (!importForm.value.courseId) {
		message.warning('请选择课程');
		return;
	}
	if (!importForm.value.chapterId) {
		message.warning('请选择章节');
		return;
	}
	if (!importFile.value) {
		message.warning('请选择要导入的文件');
		return;
	}

	importLoading.value = true;
	try {
		const formData = new FormData();
		formData.append('file', importFile.value);
		formData.append('chapterId', String(importForm.value.chapterId));
		await importQuestions(formData);
		message.success('导入成功');
		importModalVisible.value = false;
		importFile.value = null;
		importForm.value = {
			courseId: undefined,
			chapterId: undefined,
		};
		importChapterList.value = [];
		fetchData();
	} catch (error: any) {
		message.error(error?.message || error?.msg || '导入失败');
	} finally {
		importLoading.value = false;
	}
};

// 取消导入
const cancelImport = () => {
	importModalVisible.value = false;
	importFile.value = null;
	importForm.value = {
		courseId: undefined,
		chapterId: undefined,
	};
	importChapterList.value = [];
};

// 显示 JSON 导入弹窗
const showJsonImportModal = () => {
	jsonImportModalVisible.value = true;
};

// JSON 导入成功
const handleJsonImportSuccess = () => {
	fetchData();
};

// 获取题干纯文本（去除HTML标签）
const getStemText = (html: string) => {
	return stripHtmlTags(html);
};

watch(
	() => searchForm.value.courseId,
	() => {
		searchForm.value.chapterId = undefined;
		fetchChapters();
	},
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
