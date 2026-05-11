<template>
	<div class="course-management">
		<a-card>
			<template #title>课程管理</template>
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
					<a-button
						:disabled="selectedRowKeys.length === 0"
						@click="handleBatchEnable"
					>
						<template #icon><check-outlined /></template>
						批量启用 ({{ selectedRowKeys.length || 0 }})
					</a-button>
					<a-button
						:disabled="selectedRowKeys.length === 0"
						@click="handleBatchDisable"
					>
						<template #icon><close-outlined /></template>
						批量禁用 ({{ selectedRowKeys.length || 0 }})
					</a-button>
					<a-button :loading="exporting" @click="handleExportCourses">批量导出课程</a-button>
					<a-button @click="handleGlobalRecommend">公共推荐配置</a-button>
					<a-button type="primary" @click="handleAdd">
						<template #icon><plus-outlined /></template>
						新增课程
					</a-button>
				</a-space>
			</template>

			<a-form layout="inline" class="course-filter-form">
				<a-form-item label="课程名称">
					<a-input
						v-model:value="searchForm.name"
						allow-clear
						placeholder="请输入课程名称"
						style="width: 180px"
						@pressEnter="handleSearch"
					/>
				</a-form-item>
				<a-form-item label="课程">
					<a-input
						v-model:value="searchForm.subject"
						allow-clear
						placeholder="请输入课程"
						style="width: 160px"
						@pressEnter="handleSearch"
					/>
				</a-form-item>
				<a-form-item label="分类">
					<a-cascader
						v-model:value="searchCategoryValue"
						:options="categoryFilterOptions"
						:field-names="{ label: 'label', value: 'value', children: 'children' }"
						:show-search="{ filter: cascaderFilter }"
						change-on-select
						allow-clear
						placeholder="请选择分类"
						style="width: 220px"
					/>
				</a-form-item>
				<a-form-item>
					<a-space>
						<a-button type="primary" @click="handleSearch">搜索</a-button>
						<a-button @click="handleResetSearch">重置</a-button>
					</a-space>
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
						<template v-else-if="column.key === 'sort'">
							<a-input-number
								:value="record.sort ?? 0"
								:min="0"
								:precision="0"
								size="small"
								class="sort-input"
								:disabled="sortUpdatingId === record.id"
								@change="(value) => handleSortChange(record, value)"
							/>
						</template>
						<template v-else-if="column.key === 'action'">
							<a-space>
								<a-button type="link" size="small" @click="handleEdit(record)"> 编辑 </a-button>
								<a-dropdown>
									<a-button type="link" size="small" @click.prevent>
										设置
										<down-outlined />
									</a-button>
									<template #overlay>
										<a-menu>
											<a-menu-item key="exam" @click="handleExamConfig(record)">考试配置</a-menu-item>
											<a-menu-item key="recommend" @click="handleRecommendConfig(record)">相关推荐</a-menu-item>
										</a-menu>
									</template>
								</a-dropdown>
								<a-popconfirm title="确定要删除这个课程吗？" @confirm="handleDelete(record)">
									<a-button type="link" danger size="small">删除</a-button>
								</a-popconfirm>
						</a-space>
					</template>
				</template>
			</a-table>
			<div class="pagination-jumper" v-if="pagination.total > 0">
				<a-space>
					<a-button size="small" :disabled="pagination.current <= 1" @click="jumpToPage(1)">第一页</a-button>
					<a-button size="small" :disabled="pagination.current >= lastPage" @click="jumpToPage(lastPage)">最后一页</a-button>
					<span>跳转到</span>
					<a-input-number v-model:value="jumpPage" size="small" :min="1" :max="lastPage" :precision="0" style="width: 90px" />
					<span>页</span>
					<a-button size="small" type="primary" @click="jumpToPage(jumpPage)">跳转</a-button>
				</a-space>
			</div>
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
	import { ref, onMounted, watch, computed } from 'vue';
	import { message } from 'ant-design-vue';
	import { PlusOutlined, DeleteOutlined, CheckOutlined, CloseOutlined, DownOutlined } from '@ant-design/icons-vue';
	import { getCourseList, deleteCourse, batchDeleteCourses, batchUpdateCourseStatus, updateCourseSort } from '@/api/course';
	import { getCourseCategoryTree } from '@/api/course-category';
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
	const sortUpdatingId = ref<number | null>(null);
	const exporting = ref(false);
	const jumpPage = ref(1);
	const searchForm = ref({
		name: '',
		subject: '',
		category: '',
		subCategory: '',
	});
	const searchCategoryValue = ref<string[]>([]);
	const categoryTree = ref<any[]>([]);

	const categoryFilterOptions = computed(() =>
		categoryTree.value.map((parent) => ({
			label: parent.status === 0 ? `${parent.name}（已禁用）` : parent.name,
			value: parent.name,
			children: Array.isArray(parent.children)
				? parent.children.map((child: any) => ({
						label: child.status === 0 ? `${child.name}（已禁用）` : child.name,
						value: child.name,
					}))
				: [],
		})),
	);

	const cascaderFilter = (inputValue: string, path: any[]) =>
		path.some((option) => String(option.label || '').toLowerCase().includes(inputValue.toLowerCase()));

const pagination = ref({
	current: 1,
	pageSize: 10,
	total: 0,
	showQuickJumper: true,
	showSizeChanger: true,
	showTotal: (total: number) => `共 ${total} 条`,
});

const lastPage = computed(() => Math.max(1, Math.ceil((pagination.value.total || 0) / pagination.value.pageSize)));

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
			width: 110,
		},
		{
			title: '操作',
			key: 'action',
			width: 180,
			fixed: 'right',
		},
];

const fetchData = async () => {
	loading.value = true;
	try {
		const params = {
			name: searchForm.value.name || undefined,
			subject: searchForm.value.subject || undefined,
			category: searchForm.value.category || undefined,
			subCategory: searchForm.value.subCategory || undefined,
		};
		const res = await getCourseList(params);
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

const fetchCategoryTree = async () => {
	try {
		const res = await getCourseCategoryTree();
		categoryTree.value = Array.isArray(res.data) ? res.data : [];
	} catch (error) {
		console.warn('获取课程分类筛选项失败:', error);
	}
};

watch(
	() => searchCategoryValue.value,
	(value) => {
		searchForm.value.category = Array.isArray(value) ? value[0] || '' : '';
		searchForm.value.subCategory = Array.isArray(value) ? value[1] || '' : '';
	},
);

const handleSearch = () => {
	pagination.value.current = 1;
	fetchData();
};

const handleResetSearch = () => {
	searchForm.value = {
		name: '',
		subject: '',
		category: '',
		subCategory: '',
	};
	searchCategoryValue.value = [];
	pagination.value.current = 1;
	fetchData();
};

const handleTableChange = (pag: any) => {
	pagination.value.current = pag.current;
	pagination.value.pageSize = pag.pageSize;
	jumpPage.value = pag.current;
	fetchData();
};

const jumpToPage = (page: number) => {
	const target = Math.min(lastPage.value, Math.max(1, Number(page) || 1));
	pagination.value.current = target;
	jumpPage.value = target;
};

const formatFileSize = (record: any) => {
	const size = Number(record.file_size || record.fileSize || 0);
	if (!size) return '';
	if (size >= 1024 * 1024) return `${(size / 1024 / 1024).toFixed(2)} MB`;
	if (size >= 1024) return `${(size / 1024).toFixed(2)} KB`;
	return `${size} B`;
};

const handleExportCourses = async () => {
	const rows = selectedRowKeys.value.length
		? dataSource.value.filter((item: any) => selectedRowKeys.value.includes(item.id))
		: dataSource.value;
	if (!rows.length) {
		message.warning('暂无可导出的课程');
		return;
	}
	exporting.value = true;
	try {
		const ExcelJS = await import('exceljs');
		const workbook = new ExcelJS.Workbook();
		const worksheet = workbook.addWorksheet('课程列表');
		worksheet.columns = [
			{ header: '课程名称', key: 'name', width: 28 },
			{ header: '课程', key: 'subject', width: 18 },
			{ header: '一级分类', key: 'category', width: 18 },
			{ header: '二级分类', key: 'sub_category', width: 18 },
			{ header: '价格', key: 'price', width: 12 },
			{ header: '文件类型', key: 'file_type', width: 12 },
			{ header: '文件大小', key: 'file_size', width: 14 },
		];
		rows.forEach((record: any) => {
			worksheet.addRow({
				name: record.name || '',
				subject: record.subject || '',
				category: record.category || '',
				sub_category: record.sub_category || '',
				price: Number(record.price || 0),
				file_type: record.file_type || '',
				file_size: formatFileSize(record),
			});
		});
		worksheet.getRow(1).font = { bold: true };
		const buffer = await workbook.xlsx.writeBuffer();
		const blob = new Blob([buffer], {
			type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
		});
		const url = URL.createObjectURL(blob);
		const link = document.createElement('a');
		link.href = url;
		link.download = `课程列表_${new Date().toISOString().slice(0, 10)}.xlsx`;
		link.click();
		URL.revokeObjectURL(url);
		message.success('导出成功');
	} catch (error) {
		console.error('导出课程失败:', error);
		message.error('导出失败');
	} finally {
		exporting.value = false;
	}
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

	const handleSortChange = async (record: any, value: number | string | null) => {
		const nextSort = Number(value);
		if (!Number.isInteger(nextSort) || nextSort < 0) {
			message.warning('排序号需为非负整数');
			return;
		}
		if (nextSort === Number(record.sort ?? 0)) {
			return;
		}
		const previousSort = record.sort;
		record.sort = nextSort;
		sortUpdatingId.value = record.id;
		try {
			await updateCourseSort(record.id, nextSort);
			message.success('排序已更新');
			fetchData();
		} catch (error: any) {
			record.sort = previousSort;
			message.error(error?.message || '排序更新失败');
		} finally {
			sortUpdatingId.value = null;
		}
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
	fetchCategoryTree();
	fetchData();
});
</script>

<style scoped lang="scss">
	.course-management {
		padding: 24px;
	}

	.sort-input {
		width: 82px;
	}

	.course-filter-form {
		margin-bottom: 16px;
	}

	.pagination-jumper {
		display: flex;
		justify-content: flex-end;
		margin-top: 12px;
	}
	</style>
