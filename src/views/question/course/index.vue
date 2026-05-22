<template>
	<div class="course-management">
		<a-card>
			<template #title>课程管理</template>
			<template #extra>
				<a-space class="course-toolbar" wrap>
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
						:disabled="selectedRowKeys.length === 0 || !canToggleCourseStatus"
						@click="handleBatchEnable"
					>
						<template #icon><check-outlined /></template>
						批量启用 ({{ selectedRowKeys.length || 0 }})
					</a-button>
					<a-button
						:disabled="selectedRowKeys.length === 0 || !canToggleCourseStatus"
						@click="handleBatchDisable"
					>
						<template #icon><close-outlined /></template>
						批量禁用 ({{ selectedRowKeys.length || 0 }})
					</a-button>
					<a-button :loading="exporting" @click="handleExportCourses">批量导出课程</a-button>
					<a-button :loading="exportingByCategory" @click="openExportByCategoryModal">按分类导出</a-button>
					<a-button
						:type="previewCacheTaskRunning ? 'primary' : 'default'"
						@click="openPreviewCacheModal"
					>
						{{ previewCacheTaskRunning ? '图片缓存生成中' : '图片缓存' }}
					</a-button>
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
				class="course-table"
				:columns="columns"
				:data-source="dataSource"
				:loading="loading"
				:pagination="pagination"
				:row-selection="{ selectedRowKeys, onChange: onSelectChange }"
				:scroll="{ x: 1780 }"
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
						<a-switch
							:checked="record.status === 1"
							:checked-children="'启用'"
							:un-checked-children="'禁用'"
							:loading="statusUpdatingId === record.id"
							:disabled="!canToggleCourseStatus"
							@change="(checked) => handleStatusChange(record, checked)"
						/>
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
					<template v-else-if="column.key === 'name'">
						<a-tooltip :title="record.name" placement="topLeft">
							<span class="course-name-text">{{ record.name }}</span>
						</a-tooltip>
					</template>
					<template v-else-if="column.key === 'action'">
						<a-space class="course-action-space" :size="4" wrap>
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

		<a-modal
			v-model:open="previewCacheProgressVisible"
			title="图片缓存生成"
			width="960px"
			:footer="null"
			@after-open-change="handlePreviewCacheModalOpenChange"
		>
			<a-tabs v-model:activeKey="previewCacheActiveTab">
				<a-tab-pane key="batch" tab="批量任务">
			<div class="preview-cache-modal-actions">
				<a-space wrap>
					<a-button
						type="primary"
						:loading="previewCacheGenerating"
						:disabled="previewCacheTaskRunning"
						@click="handleGenerateMissingPreviewCaches"
					>
						生成缺失缓存
					</a-button>
					<a-button
						:loading="previewCacheRetrying"
						:disabled="previewCacheTaskRunning || !canRetryPreviewCacheFailures"
						@click="handleRetryFailedPreviewCaches"
					>
						重新生成失败课程
					</a-button>
					<a-button
						:loading="previewCacheFixingBlank"
						:disabled="previewCacheTaskRunning"
						@click="handleFixBlankPreviewCaches"
					>
						空白图修复
					</a-button>
					<a-popconfirm
						v-if="previewCacheTaskRunning"
						title="确定要中断当前图片缓存生成任务吗？已生成的缓存会保留。"
						ok-text="确定中断"
						cancel-text="继续生成"
						@confirm="handleInterruptPreviewCacheTask"
					>
						<a-button danger :loading="previewCacheCanceling">中断生成</a-button>
					</a-popconfirm>
					<a-button :loading="previewCacheRefreshing" @click="fetchPreviewCacheProgress">刷新进度</a-button>
				</a-space>
			</div>

			<a-alert
				class="preview-cache-progress"
				:type="previewCacheProgressStatus"
				show-icon
				:message="previewCacheProgressTitle"
			>
				<template #description>
					<a-progress
						:percent="previewCachePercent"
						:status="
							previewCacheProgressStatus === 'error'
								? 'exception'
								: previewCacheTaskRunning
									? 'active'
									: previewCachePercent >= 100
										? 'success'
										: previewCacheProgressStatus === 'warning'
											? 'normal'
											: 'success'
						"
					/>
					<div class="preview-cache-progress__meta">
						已处理 {{ previewCacheProgress.processed || 0 }} / {{ previewCacheProgress.totalPages || 0 }} 页，
						新生成 {{ previewCacheProgress.generated || 0 }} 页，
						已存在 {{ previewCacheProgress.skipped || 0 }} 页，
						失败 {{ previewCacheProgress.failed || 0 }} 页
					</div>
					<div class="preview-cache-progress__meta" v-if="previewCacheProgress.currentCourseName">
						当前课程：{{ previewCacheProgress.currentCourseName }}
						<span v-if="previewCacheProgress.currentPage">，第 {{ previewCacheProgress.currentPage }} 页</span>
					</div>
					<div class="preview-cache-progress__meta" v-if="previewCacheProgress.taskNo">
						任务编号：{{ previewCacheProgress.taskNo }}，状态：{{ previewCacheStatusText(previewCacheProgress.status) }}
					</div>
					<div v-if="previewCacheBlankDetected.length" class="preview-cache-failed-list">
						<div class="preview-cache-failed-list__title">检测到空白预览图（{{ previewCacheBlankDetected.length }} 个课程）</div>
						<div
							v-for="(item, idx) in previewCacheBlankDetected"
							:key="`${item.courseId}-${item.fileId}-${idx}`"
							class="preview-cache-failed-list__item"
						>
							<span>课程ID {{ item.courseId }}（{{ item.courseName || '-' }}）</span>
							<span>文件：{{ item.fileName || item.fileId }}</span>
							<span>空白页码：第 {{ item.pageNum }} 页</span>
						</div>
					</div>
					<div v-if="previewCacheFailedDetails.length" class="preview-cache-failed-list">
						<div class="preview-cache-failed-list__title">失败明细（最近 {{ previewCacheFailedDetails.length }} 条）</div>
						<div
							v-for="(item, idx) in previewCacheFailedDetails"
							:key="`${item.courseId}-${item.pageNum}-${idx}`"
							class="preview-cache-failed-list__item"
						>
							<span>课程ID {{ item.courseId }}（{{ item.courseName || '-' }}）</span>
							<span>页码：{{ item.pageNum > 0 ? item.pageNum : '课程级失败' }}</span>
							<span>原因：{{ item.message }}</span>
						</div>
					</div>
				</template>
			</a-alert>

			<div v-if="previewCacheRecords.length" class="preview-cache-records">
				<div class="preview-cache-records__title">最近生成记录</div>
				<div
					v-for="record in previewCacheRecords"
					:key="record.id"
					class="preview-cache-records__item"
				>
					<a-tag :color="previewCacheRecordColor(record.status)">
						{{ previewCacheStatusText(record.status) }}
					</a-tag>
					<span class="preview-cache-records__no">{{ record.taskNo }}</span>
					<span>课程 {{ record.processedCourses || 0 }} / {{ record.totalCourses || 0 }}</span>
					<span>页数 {{ record.processed || 0 }} / {{ record.totalPages || 0 }}</span>
					<span>生成 {{ record.generated || 0 }}，跳过 {{ record.skipped || 0 }}，失败 {{ record.failed || 0 }}</span>
					<span class="preview-cache-records__time">{{ formatPreviewCacheTime(record.updateTime || record.createTime) }}</span>
					<div v-if="Array.isArray(record.failedDetails) && record.failedDetails.length" class="preview-cache-records__failed">
						<div
							v-for="(item, idx) in record.failedDetails.slice(0, 5)"
							:key="`${record.id}-${idx}`"
						>
							[课程 {{ item.courseId }} | 页 {{ item.pageNum > 0 ? item.pageNum : '-' }}] {{ item.message }}
						</div>
					</div>
				</div>
			</div>
			<a-empty v-else description="暂无生成记录" />
				</a-tab-pane>

				<a-tab-pane key="selected" tab="指定课程">
					<div class="preview-cache-selected-panel">
						<div class="preview-cache-selected-toolbar">
							<a-input-search
								v-model:value="previewCacheTargetKeyword"
								placeholder="搜索课程名称"
								allow-clear
								style="width: 260px"
								@search="loadPreviewCacheTargets"
							/>
							<a-button :loading="previewCacheTargetLoading" @click="loadPreviewCacheTargets">刷新列表</a-button>
							<a-popconfirm
								:title="`确定要强制重新生成已选 ${previewCacheSelectedCourseIds.length} 个课程的图片缓存吗？`"
								ok-text="确定生成"
								cancel-text="取消"
								:disabled="!previewCacheSelectedCourseIds.length || previewCacheTaskRunning"
								@confirm="handleForceSelectedPreviewCaches"
							>
								<a-button
									type="primary"
									:loading="previewCacheForceSelectedLoading"
									:disabled="!previewCacheSelectedCourseIds.length || previewCacheTaskRunning"
								>
									强制重新生成（已选 {{ previewCacheSelectedCourseIds.length }}）
								</a-button>
							</a-popconfirm>
							<span class="form-tip">仅展示支持图片缓存的文件类 PDF/Word 课程</span>
						</div>
						<a-table
							class="preview-cache-target-table"
							size="small"
							row-key="id"
							:columns="previewCacheTargetColumns"
							:data-source="previewCacheTargetList"
							:loading="previewCacheTargetLoading"
							:row-selection="previewCacheTargetRowSelection"
							:pagination="previewCacheTargetPagination"
							:scroll="{ y: 360 }"
							@change="handlePreviewCacheTargetTableChange"
						>
							<template #bodyCell="{ column, record }">
								<template v-if="column.key === 'name'">
									<a-tooltip :title="record.name" placement="topLeft">
										<span class="preview-cache-target-name">{{ record.name }}</span>
									</a-tooltip>
								</template>
							</template>
						</a-table>
					</div>
				</a-tab-pane>
			</a-tabs>
		</a-modal>

		<a-modal
			v-model:open="exportByCategoryVisible"
			title="按分类导出课程"
			:confirm-loading="exportingByCategory"
			@ok="handleExportByCategory"
			@cancel="exportCategoryValue = []"
		>
			<a-form :label-col="{ span: 5 }" :wrapper-col="{ span: 18 }">
				<a-form-item label="导出分类" required>
					<a-cascader
						v-model:value="exportCategoryValue"
						:options="categoryFilterOptions"
						:field-names="{ label: 'label', value: 'value', children: 'children' }"
						:show-search="{ filter: cascaderFilter }"
						change-on-select
						allow-clear
						placeholder="请选择一级或二级分类"
						style="width: 100%"
					/>
					<div class="form-tip">选择一级分类会导出该一级分类下所有课程；选择二级分类则只导出该二级分类课程。</div>
				</a-form-item>
			</a-form>
		</a-modal>
	</div>
</template>

	<script setup lang="ts">
	import { ref, onMounted, watch, computed, onBeforeUnmount } from 'vue';
	import { message } from 'ant-design-vue';
	import { PlusOutlined, DeleteOutlined, CheckOutlined, CloseOutlined, DownOutlined } from '@ant-design/icons-vue';
	import { getCourseList, deleteCourse, batchDeleteCourses, batchUpdateCourseStatus, updateCourseSort, generateMissingCoursePreviewCaches, retryFailedCoursePreviewCaches, getCoursePreviewCacheProgress, interruptCoursePreviewCacheTask, fixBlankCoursePreviewCaches, getPreviewCacheTargetCourses, forceSelectedCoursePreviewCaches } from '@/api/course';
	import { getCourseCategoryTree } from '@/api/course-category';
	import { getToken } from '@/utils/auth';
	import { useUserStore } from '@/store/user';
import CourseModal from './components/CourseModal.vue';
import ExamConfigDrawer from './components/ExamConfigDrawer.vue';
import RecommendationDrawer from './components/RecommendationDrawer.vue';

const loading = ref(false);
const dataSource = ref([]);
const userStore = useUserStore();
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
	const statusUpdatingId = ref<number | null>(null);
	const exporting = ref(false);
	const exportingByCategory = ref(false);
	const previewCacheGenerating = ref(false);
	const previewCacheFixingBlank = ref(false);
	const previewCacheForceSelectedLoading = ref(false);
	const previewCacheActiveTab = ref('batch');
	const previewCacheTargetKeyword = ref('');
	const previewCacheTargetLoading = ref(false);
	const previewCacheTargetList = ref<any[]>([]);
	const previewCacheSelectedCourseIds = ref<number[]>([]);
	const previewCacheTargetPagination = ref({
		current: 1,
		pageSize: 10,
		total: 0,
		showSizeChanger: true,
		pageSizeOptions: ['10', '20', '50', '100'],
		showTotal: (total: number) => `共 ${total} 条`,
	});
	const previewCacheTargetColumns = [
		{ title: 'ID', dataIndex: 'id', key: 'id', width: 72 },
		{ title: '课程名称', dataIndex: 'name', key: 'name', ellipsis: true },
		{ title: '课程', dataIndex: 'subject', key: 'subject', width: 110, ellipsis: true },
		{ title: '一级分类', dataIndex: 'category', key: 'category', width: 120, ellipsis: true },
		{ title: '二级分类', dataIndex: 'subCategory', key: 'subCategory', width: 120, ellipsis: true },
	];
	const previewCacheTargetRowSelection = computed(() => ({
		selectedRowKeys: previewCacheSelectedCourseIds.value,
		onChange: (keys: (string | number)[]) => {
			previewCacheSelectedCourseIds.value = keys.map((key) => Number(key)).filter((id) => id > 0);
		},
		preserveSelectedRowKeys: true,
	}));
	const previewCacheRetrying = ref(false);
	const previewCacheCanceling = ref(false);
	const previewCacheRefreshing = ref(false);
	const previewCacheProgressVisible = ref(false);
	const previewCacheBlankDetected = ref<any[]>([]);
	const previewCacheProgress = ref<any>({
		totalCourses: 0,
		runningCourses: 0,
		completedCourses: 0,
		failedCourses: 0,
		totalPages: 0,
		processed: 0,
		generated: 0,
	skipped: 0,
	failed: 0,
	failedDetails: [],
	courses: [],
	records: [],
	});
	let previewCachePollTimer: ReturnType<typeof setInterval> | null = null;
	const exportByCategoryVisible = ref(false);
	const exportCategoryValue = ref<string[]>([]);
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
const canToggleCourseStatus = computed(() => userStore.hasRole('super_admin') || userStore.hasPermission('course:status'));
const previewCachePercent = computed(() => {
	const totalPages = Number(previewCacheProgress.value.totalPages || 0);
	if (totalPages > 0) {
		return Math.min(100, Math.round((Number(previewCacheProgress.value.processed || 0) / totalPages) * 100));
	}
	const totalCourses = Number(previewCacheProgress.value.totalCourses || 0);
	if (totalCourses > 0) {
		return Math.min(
			100,
			Math.round((Number(previewCacheProgress.value.processedCourses || 0) / totalCourses) * 100),
		);
	}
	if (previewCacheTaskRunning.value) {
		return 0;
	}
	return 0;
});
const previewCacheTaskRunning = computed(() => {
	const status = String(previewCacheProgress.value.status || '');
	return (
		Number(previewCacheProgress.value.runningCourses || 0) > 0 ||
		status === 'pending' ||
		status === 'running'
	);
});
const previewCacheRecords = computed(() => Array.isArray(previewCacheProgress.value.records) ? previewCacheProgress.value.records : []);
const previewCacheFailedDetails = computed(() => {
	const list = previewCacheProgress.value.failedDetails;
	return Array.isArray(list) ? list.slice(0, 20) : [];
});
const canRetryPreviewCacheFailures = computed(() => previewCacheFailedDetails.value.length > 0);
const previewCacheProgressStatus = computed(() => {
	const status = String(previewCacheProgress.value.status || '');
	if (previewCacheProgress.value.failedCourses > 0 || previewCacheProgress.value.failed > 0) return 'error';
	if (status === 'interrupted') return 'warning';
	if (previewCacheTaskRunning.value) return 'info';
	return 'success';
});
const previewCacheProgressTitle = computed(() => {
	const status = String(previewCacheProgress.value.status || '');
	const message = String(previewCacheProgress.value.message || '').trim();
	if (previewCacheTaskRunning.value) {
		if (message) return message;
		return `正在生成图片缓存：${previewCacheProgress.value.runningCourses || 1} 个课程进行中`;
	}
	if (status === 'interrupted') {
		return message || '图片缓存生成已中断';
	}
	if (previewCacheProgress.value.failedCourses > 0 || previewCacheProgress.value.failed > 0) {
		return message || '图片缓存生成完成，但存在失败页面';
	}
	return message || '图片缓存生成完成';
});

const previewCacheStatusText = (status?: string) => {
	const map: Record<string, string> = {
		idle: '暂无任务',
		pending: '等待中',
		running: '生成中',
		completed: '已完成',
		failed: '有失败',
		interrupted: '已中断',
	};
	return map[status || ''] || status || '-';
};

const previewCacheRecordColor = (status?: string) => {
	if (status === 'completed') return 'green';
	if (status === 'failed') return 'red';
	if (status === 'interrupted') return 'orange';
	if (status === 'running' || status === 'pending') return 'blue';
	return 'default';
};

const formatPreviewCacheTime = (value?: string | Date) => {
	if (!value) return '';
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return '';
	const pad = (num: number) => String(num).padStart(2, '0');
	return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const columns = [
	// {
	// 	title: '封面图',
	// 	key: 'cover',
	// 	width: 100,
	// },
	{
		title: '排序',
		dataIndex: 'sort',
		key: 'sort',
		width: 90,
		fixed: 'left',
	},
	{
		title: '课程名称',
		dataIndex: 'name',
		key: 'name',
		width: 280,
		ellipsis: true,
		customCell: () => ({
			class: 'course-name-cell',
		}),
	},
	{
		title: '课程',
		dataIndex: 'subject',
		key: 'subject',
		width: 110,
	},
	{
		title: '一级分类',
		dataIndex: 'category',
		key: 'category',
		width: 120,
	},
	{
		title: '二级分类',
		dataIndex: 'sub_category',
		key: 'sub_category',
		width: 120,
	},
	{
		title: '学校',
		dataIndex: 'school',
		key: 'school',
		width: 150,
	},
	{
		title: '专业',
		dataIndex: 'major',
		key: 'major',
		width: 140,
	},
	{
		title: '真题年份',
		dataIndex: 'exam_year',
		key: 'exam_year',
		width: 110,
	},
	{
		title: '答案年份',
		dataIndex: 'answer_year',
		key: 'answer_year',
		width: 110,
	},
	{
		title: '当前价格',
		dataIndex: 'price',
		key: 'price',
		width: 110,
		customRender: ({ text }: any) => `¥${text}`,
	},
	{
		title: '代理商售价',
		dataIndex: 'agent_price',
		key: 'agent_price',
		width: 120,
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
		width: 110,
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

const sanitizeExportFileName = (value: string) =>
	String(value || '课程列表')
		.replace(/[\\/:*?"<>|]+/g, '-')
		.slice(0, 80);

const exportCoursesToExcel = async (rows: any[], fileNamePrefix: string) => {
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
	link.download = `${sanitizeExportFileName(fileNamePrefix)}_${new Date().toISOString().slice(0, 10)}.xlsx`;
	link.click();
	URL.revokeObjectURL(url);
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
		await exportCoursesToExcel(rows, selectedRowKeys.value.length ? '选中课程列表' : '课程列表');
		message.success('导出成功');
	} catch (error) {
		console.error('导出课程失败:', error);
		message.error('导出失败');
	} finally {
		exporting.value = false;
	}
};

const openExportByCategoryModal = () => {
	if (!categoryTree.value.length) {
		fetchCategoryTree();
	}
	exportByCategoryVisible.value = true;
};

const handleExportByCategory = async () => {
	const [category, subCategory] = exportCategoryValue.value || [];
	if (!category) {
		message.warning('请先选择要导出的分类');
		return;
	}
	exportingByCategory.value = true;
	try {
		const res = await getCourseList({
			category,
			subCategory: subCategory || undefined,
		});
		const rows = Array.isArray(res.data) ? res.data : res.data?.list || [];
		if (!rows.length) {
			message.warning('该分类下暂无可导出的课程');
			return;
		}
		await exportCoursesToExcel(rows, `课程列表_${subCategory ? `${category}-${subCategory}` : category}`);
		message.success(`已导出 ${rows.length} 个课程`);
		exportByCategoryVisible.value = false;
		exportCategoryValue.value = [];
	} catch (error) {
		console.error('按分类导出课程失败:', error);
		message.error('按分类导出失败');
	} finally {
		exportingByCategory.value = false;
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

	const handleStatusChange = async (record: any, checked: boolean | string | number) => {
		if (!canToggleCourseStatus.value) {
			message.warning('当前账号没有切换课程状态的权限');
			return;
		}
		const nextStatus = checked ? 1 : 0;
		if (nextStatus === Number(record.status)) return;
		const previousStatus = record.status;
		record.status = nextStatus;
		statusUpdatingId.value = record.id;
		try {
			await batchUpdateCourseStatus([record.id], nextStatus);
			message.success(nextStatus === 1 ? '课程已启用' : '课程已禁用');
			fetchData();
		} catch (error: any) {
			record.status = previousStatus;
		} finally {
			statusUpdatingId.value = null;
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

const openPreviewCacheModal = async () => {
	previewCacheProgressVisible.value = true;
	previewCacheActiveTab.value = 'batch';
	if (selectedRowKeys.value.length) {
		previewCacheSelectedCourseIds.value = [...selectedRowKeys.value];
	}
	await fetchPreviewCacheProgress();
	if (previewCacheTaskRunning.value) {
		startPreviewCachePolling();
	}
};

const handlePreviewCacheModalOpenChange = (open: boolean) => {
	if (open && previewCacheActiveTab.value === 'selected') {
		void loadPreviewCacheTargets();
	}
};

watch(previewCacheActiveTab, (tab) => {
	if (tab === 'selected' && previewCacheProgressVisible.value) {
		void loadPreviewCacheTargets();
	}
});

const loadPreviewCacheTargets = async () => {
	previewCacheTargetLoading.value = true;
	try {
		const res = await getPreviewCacheTargetCourses(previewCacheTargetKeyword.value.trim() || undefined);
		const data = res?.data || res || {};
		previewCacheTargetList.value = Array.isArray(data.list) ? data.list : [];
		previewCacheTargetPagination.value = {
			...previewCacheTargetPagination.value,
			total: Number(data.total || previewCacheTargetList.value.length || 0),
		};
		const availableIds = new Set(previewCacheTargetList.value.map((item) => item.id));
		previewCacheSelectedCourseIds.value = previewCacheSelectedCourseIds.value.filter((id) => availableIds.has(id));
	} catch (error: any) {
		message.error(error?.msg || error?.message || '加载可缓存课程列表失败');
	} finally {
		previewCacheTargetLoading.value = false;
	}
};

const handlePreviewCacheTargetTableChange = (pagination: any) => {
	previewCacheTargetPagination.value = {
		...previewCacheTargetPagination.value,
		current: pagination.current,
		pageSize: pagination.pageSize,
	};
};

const handleForceSelectedPreviewCaches = async () => {
	if (previewCacheForceSelectedLoading.value || previewCacheTaskRunning.value) return;
	if (!previewCacheSelectedCourseIds.value.length) {
		message.warning('请先选择要重新生成的课程');
		return;
	}
	previewCacheForceSelectedLoading.value = true;
	previewCacheActiveTab.value = 'batch';
	previewCacheProgressVisible.value = true;
	resetPreviewCacheProgressForAction(`正在创建任务，准备强制重新生成 ${previewCacheSelectedCourseIds.value.length} 个课程…`);
	startPreviewCachePolling();
	try {
		const res = await forceSelectedCoursePreviewCaches(previewCacheSelectedCourseIds.value);
		const data = res?.data || res || {};
		if (data.alreadyRunning) {
			message.info('已有图片缓存生成任务正在执行，请稍后查看进度');
		} else {
			message.success(`已开始强制重新生成 ${data.started || data.total || previewCacheSelectedCourseIds.value.length} 个课程的图片缓存`);
		}
		previewCacheProgress.value = {
			...previewCacheProgress.value,
			...data,
			runningCourses: data.runningCourses ?? (data.status === 'pending' || data.status === 'running' ? 1 : 0),
		};
		await fetchPreviewCacheProgress();
		if (!previewCacheTaskRunning.value) {
			stopPreviewCachePolling();
		}
	} catch (error: any) {
		message.error(error?.msg || error?.message || '强制重新生成失败');
		await fetchPreviewCacheProgress();
		stopPreviewCachePolling();
	} finally {
		previewCacheForceSelectedLoading.value = false;
	}
};

const handleGenerateMissingPreviewCaches = async () => {
	if (previewCacheGenerating.value || previewCacheTaskRunning.value) return;
	previewCacheGenerating.value = true;
	try {
		const res = await generateMissingCoursePreviewCaches();
		const data = res?.data || {};
		if (data.total === 0) {
			message.info('暂无需要生成图片缓存的文件类 PDF 课程');
			await fetchPreviewCacheProgress();
		} else if (data.alreadyRunning) {
			message.info('已有图片缓存生成任务正在执行，请稍后查看进度');
			previewCacheProgressVisible.value = true;
			previewCacheProgress.value = data;
			startPreviewCachePolling();
		} else if (data.started > 0) {
			message.success(`已开始为 ${data.started} 个课程生成缺失图片缓存`);
			previewCacheProgressVisible.value = true;
			previewCacheProgress.value = data;
			await fetchPreviewCacheProgress();
			startPreviewCachePolling();
		} else {
			message.info(`所有 ${data.running || 0} 个课程缓存任务已在生成中`);
			previewCacheProgressVisible.value = true;
			previewCacheProgress.value = data;
			await fetchPreviewCacheProgress();
			startPreviewCachePolling();
		}
	} catch (error: any) {
		message.error(error?.msg || error?.message || '生成图片缓存失败');
	} finally {
		previewCacheGenerating.value = false;
	}
};

const handleRetryFailedPreviewCaches = async () => {
	if (previewCacheRetrying.value || previewCacheTaskRunning.value) return;
	if (!canRetryPreviewCacheFailures.value) {
		message.warning('暂无可重试的失败课程明细');
		return;
	}
	previewCacheRetrying.value = true;
	try {
		const res = await retryFailedCoursePreviewCaches(Number(previewCacheProgress.value.taskId || 0) || undefined);
		const data = res?.data || {};
		if (data.alreadyRunning) {
			message.info('已有图片缓存生成任务正在执行，请稍后查看进度');
		} else {
			message.success(`已开始重新生成 ${data.started || data.total || 0} 个失败课程的图片缓存`);
		}
		previewCacheProgressVisible.value = true;
		previewCacheProgress.value = data;
		await fetchPreviewCacheProgress();
		startPreviewCachePolling();
	} catch (error: any) {
		message.error(error?.msg || error?.message || '重新生成失败课程缓存失败');
	} finally {
		previewCacheRetrying.value = false;
	}
};

const handleInterruptPreviewCacheTask = async () => {
	if (!previewCacheTaskRunning.value || previewCacheCanceling.value) return;
	previewCacheCanceling.value = true;
	try {
		const res = await interruptCoursePreviewCacheTask();
		const data = res?.data || {};
		previewCacheProgressVisible.value = true;
		previewCacheProgress.value = data;
		message.success(data.message || '已中断图片缓存生成任务');
		await fetchPreviewCacheProgress();
		stopPreviewCachePolling();
	} catch (error: any) {
		message.error(error?.msg || error?.message || '中断任务失败');
	} finally {
		previewCacheCanceling.value = false;
	}
};

const resetPreviewCacheProgressForAction = (actionMessage: string) => {
	previewCacheProgress.value = {
		taskId: null,
		taskNo: '',
		status: 'pending',
		message: actionMessage,
		totalCourses: 0,
		processedCourses: 0,
		runningCourses: 1,
		completedCourses: 0,
		failedCourses: 0,
		currentCourseId: null,
		currentCourseName: '',
		currentPage: 0,
		totalPages: 0,
		processed: 0,
		generated: 0,
		skipped: 0,
		failed: 0,
		failedDetails: [],
		courses: [],
		records: previewCacheRecords.value,
	};
};

const handleFixBlankPreviewCaches = async () => {
	if (previewCacheFixingBlank.value || previewCacheTaskRunning.value) return;
	previewCacheFixingBlank.value = true;
	previewCacheBlankDetected.value = [];
	previewCacheProgressVisible.value = true;
	resetPreviewCacheProgressForAction('正在检测空白预览图课程，请稍候…');
	startPreviewCachePolling();
	try {
		const res = await fixBlankCoursePreviewCaches();
		const data = res?.data || res || {};
		previewCacheBlankDetected.value = Array.isArray(data.detected) ? data.detected : [];
		if (data.alreadyRunning) {
			message.info('已有图片缓存生成任务正在执行，请稍后查看进度');
		} else if (data.started > 0) {
			message.success('已开始空白图检测与修复，请查看下方进度');
		}
		previewCacheProgress.value = {
			...previewCacheProgress.value,
			...data,
			runningCourses: data.runningCourses ?? (data.status === 'pending' || data.status === 'running' ? 1 : 0),
		};
		await fetchPreviewCacheProgress();
		if (!previewCacheTaskRunning.value) {
			const latestMessage = String(previewCacheProgress.value.message || '');
			if (latestMessage.includes('未检测到')) {
				message.info(latestMessage);
			}
			stopPreviewCachePolling();
		}
	} catch (error: any) {
		message.error(error?.msg || error?.message || '空白图修复失败');
		await fetchPreviewCacheProgress();
		stopPreviewCachePolling();
	} finally {
		previewCacheFixingBlank.value = false;
	}
};

const fetchPreviewCacheProgress = async () => {
	if (!getToken()) {
		return;
	}
	previewCacheRefreshing.value = true;
	try {
		const res = await getCoursePreviewCacheProgress();
		previewCacheProgress.value = res?.data || previewCacheProgress.value;
		const running = Number(previewCacheProgress.value.runningCourses || 0);
		// 轮询只更新进度数据，不自动打开弹窗（避免用户关闭后反复弹出）
		if (running === 0 && previewCachePollTimer) {
			stopPreviewCachePolling();
		}
	} catch (error) {
		console.warn('查询图片缓存生成进度失败:', error);
	} finally {
		previewCacheRefreshing.value = false;
	}
};

const startPreviewCachePolling = () => {
	if (!getToken()) {
		return;
	}
	stopPreviewCachePolling();
	previewCachePollTimer = setInterval(fetchPreviewCacheProgress, 2000);
};

const stopPreviewCachePolling = () => {
	if (previewCachePollTimer) {
		clearInterval(previewCachePollTimer);
		previewCachePollTimer = null;
	}
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
	if (getToken()) {
		fetchPreviewCacheProgress().then(() => {
			if (Number(previewCacheProgress.value.runningCourses || 0) > 0) {
				startPreviewCachePolling();
			}
		});
	}
});

onBeforeUnmount(() => {
	stopPreviewCachePolling();
});
</script>

<style scoped lang="scss">
	.course-management {
		padding: 24px;

		:deep(.ant-card-extra) {
			max-width: 100%;
		}
	}

	.sort-input {
		width: 82px;
	}

	.course-toolbar {
		justify-content: flex-end;
	}

	.course-filter-form {
		margin-bottom: 16px;
	}

	.course-table {
		:deep(.ant-table-container) {
			overflow-x: auto;
		}

		:deep(.ant-table-cell) {
			white-space: nowrap;
			word-break: keep-all;
			vertical-align: middle;
		}

		:deep(.ant-table-thead > tr > th) {
			text-align: center;
		}

		:deep(.ant-table-tbody > tr > td) {
			text-align: center;
		}

		:deep(.course-name-cell) {
			text-align: left !important;
			max-width: 280px;
		}
	}

	.course-name-text {
		display: block;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		line-height: 1.5;
	}

	.course-action-space {
		min-width: 160px;
		justify-content: center;
	}

	.preview-cache-progress {
		margin-bottom: 16px;
	}

	.preview-cache-modal-actions {
		margin-bottom: 16px;
	}

	.preview-cache-records {
		margin-bottom: 16px;
		padding: 12px 16px;
		border: 1px solid #f0f0f0;
		border-radius: 8px;
		background: #fafafa;
	}

	.preview-cache-records__title {
		margin-bottom: 8px;
		font-weight: 600;
		color: #1f2937;
	}

	.preview-cache-records__item {
		display: flex;
		flex-wrap: wrap;
		gap: 8px 14px;
		align-items: center;
		padding: 6px 0;
		color: #4b5563;
		font-size: 13px;
	}

	.preview-cache-records__no {
		color: #1f2937;
		font-weight: 600;
	}

	.preview-cache-records__time {
		color: #8c8c8c;
	}

	.preview-cache-records__failed {
		width: 100%;
		padding-left: 42px;
		color: #8c8c8c;
		font-size: 12px;
		line-height: 1.6;
	}

	.preview-cache-progress__meta {
		margin-top: 8px;
		color: #666;
	}

	.preview-cache-failed-list {
		margin-top: 10px;
		padding: 10px 12px;
		border-radius: 6px;
		background: #fff2f0;
		border: 1px solid #ffccc7;
	}

	.preview-cache-failed-list__title {
		font-weight: 600;
		color: #a8071a;
		margin-bottom: 6px;
	}

	.preview-cache-failed-list__item {
		display: flex;
		flex-wrap: wrap;
		gap: 8px 12px;
		color: #434343;
		font-size: 12px;
		line-height: 1.5;
	}

	.pagination-jumper {
		display: flex;
		justify-content: flex-end;
		margin-top: 12px;
	}

	.preview-cache-selected-panel {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.preview-cache-selected-toolbar {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 8px 12px;
	}

	.preview-cache-target-table {
		:deep(.preview-cache-target-name) {
			display: block;
			max-width: 100%;
			overflow: hidden;
			text-overflow: ellipsis;
			white-space: nowrap;
		}
	}
	</style>
