<template>
	<div class="error-log-management">
		<a-card>
			<a-form :model="searchForm" layout="vertical" class="search-form" @finish="handleSearch">
				<a-row :gutter="[16, 16]">
					<a-col :xs="24" :sm="12" :md="8" :lg="6">
						<a-form-item label="关键词">
							<a-input v-model:value="searchForm.keyword" placeholder="URL、错误消息、SQL" allow-clear />
						</a-form-item>
					</a-col>
					<a-col :xs="24" :sm="12" :md="8" :lg="4">
						<a-form-item label="状态码">
							<a-input-number v-model:value="searchForm.status" placeholder="500" allow-clear style="width: 100%" />
						</a-form-item>
					</a-col>
					<a-col :xs="24" :sm="12" :md="8" :lg="4">
						<a-form-item label="请求方法">
							<a-select v-model:value="searchForm.method" placeholder="全部" allow-clear>
								<a-select-option value="GET">GET</a-select-option>
								<a-select-option value="POST">POST</a-select-option>
								<a-select-option value="PUT">PUT</a-select-option>
								<a-select-option value="DELETE">DELETE</a-select-option>
								<a-select-option value="PATCH">PATCH</a-select-option>
							</a-select>
						</a-form-item>
					</a-col>
					<a-col :xs="24" :sm="12" :md="8" :lg="6">
						<a-form-item label="时间范围">
							<a-range-picker
								v-model:value="dateRange"
								format="YYYY-MM-DD"
								:placeholder="['开始日期', '结束日期']"
								style="width: 100%"
							/>
						</a-form-item>
					</a-col>
					<a-col :xs="24" :sm="24" :md="8" :lg="4">
						<a-form-item label=" ">
							<a-space>
								<a-button type="primary" html-type="submit">搜索</a-button>
								<a-button @click="handleReset">重置</a-button>
							</a-space>
						</a-form-item>
					</a-col>
				</a-row>
			</a-form>

			<div class="table-toolbar">
				<TableColumnSetting :items="settingItems" @update:items="updatePreference" @reset="resetColumns" />
			</div>

			<a-table
				:columns="displayColumns"
				:data-source="dataSource"
				:loading="loading"
				:pagination="pagination"
				:scroll="{ x: 'max-content' }"
				row-key="id"
				@change="handleTableChange"
			>
				<template #bodyCell="{ column, record }">
					<template v-if="column.key === 'status'">
						<a-tag :color="record.status >= 500 ? 'red' : 'orange'">{{ record.status }}</a-tag>
					</template>
					<template v-else-if="column.key === 'method'">
						<a-tag color="blue">{{ record.method || '-' }}</a-tag>
					</template>
					<template v-else-if="column.key === 'url'">
						<a-typography-text class="url-text" :title="record.url">{{ record.url || '-' }}</a-typography-text>
					</template>
					<template v-else-if="column.key === 'message'">
						<a-typography-text class="message-text" :title="record.message">
							{{ record.message || '-' }}
						</a-typography-text>
					</template>
					<template v-else-if="column.key === 'sqlMessage'">
						<a-typography-text class="message-text" :title="record.sqlMessage">
							{{ record.sqlMessage || '-' }}
						</a-typography-text>
					</template>
					<template v-else-if="column.key === 'createTime'">
						{{ record.createTime ? dayjs(record.createTime).format('YYYY-MM-DD HH:mm:ss') : '-' }}
					</template>
					<template v-else-if="column.key === 'action'">
						<a-button type="link" size="small" @click="handleViewDetail(record)">查看详情</a-button>
					</template>
				</template>
			</a-table>
		</a-card>

		<a-modal
			v-model:open="detailVisible"
			title="错误日志详情"
			:footer="null"
			width="900px"
		>
			<a-descriptions v-if="currentRecord" :column="2" bordered>
				<a-descriptions-item label="ID">{{ currentRecord.id }}</a-descriptions-item>
				<a-descriptions-item label="时间">
					{{ currentRecord.createTime ? dayjs(currentRecord.createTime).format('YYYY-MM-DD HH:mm:ss') : '-' }}
				</a-descriptions-item>
				<a-descriptions-item label="请求方法">
					<a-tag color="blue">{{ currentRecord.method || '-' }}</a-tag>
				</a-descriptions-item>
				<a-descriptions-item label="状态码">
					<a-tag :color="currentRecord.status >= 500 ? 'red' : 'orange'">{{ currentRecord.status }}</a-tag>
				</a-descriptions-item>
				<a-descriptions-item label="URL" :span="2">{{ currentRecord.url || '-' }}</a-descriptions-item>
				<a-descriptions-item label="错误消息" :span="2">{{ currentRecord.message || '-' }}</a-descriptions-item>
				<a-descriptions-item label="SQL错误" :span="2">{{ currentRecord.sqlMessage || '-' }}</a-descriptions-item>
				<a-descriptions-item label="请求ID">{{ currentRecord.requestId || '-' }}</a-descriptions-item>
				<a-descriptions-item label="用户ID">{{ currentRecord.userId || '-' }}</a-descriptions-item>
				<a-descriptions-item label="IP">{{ currentRecord.ip || '-' }}</a-descriptions-item>
				<a-descriptions-item label="User-Agent">{{ currentRecord.userAgent || '-' }}</a-descriptions-item>
				<a-descriptions-item label="请求参数" :span="2">
					<pre>{{ formatJson({ params: currentRecord.params, query: currentRecord.query, body: currentRecord.body }) }}</pre>
				</a-descriptions-item>
				<a-descriptions-item label="SQL" :span="2">
					<pre>{{ currentRecord.queryText || '-' }}</pre>
				</a-descriptions-item>
				<a-descriptions-item label="堆栈" :span="2">
					<pre>{{ currentRecord.stack || '-' }}</pre>
				</a-descriptions-item>
			</a-descriptions>
		</a-modal>
	</div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { message } from 'ant-design-vue';
import dayjs, { Dayjs } from 'dayjs';
import type { TableColumnsType } from 'ant-design-vue';
import { getErrorLogs } from '@/api/system';
import TableColumnSetting from '@/components/TableColumnSetting/index.vue';
import { useTableColumns } from '@/composables/useTableColumns';

interface ErrorLogRecord {
	id: number;
	method?: string;
	url?: string;
	status: number;
	code: number;
	message?: string;
	errorName?: string;
	stack?: string;
	queryText?: string;
	sqlMessage?: string;
	requestId?: string;
	ip?: string;
	userId?: number;
	userAgent?: string;
	params?: Record<string, unknown> | null;
	query?: Record<string, unknown> | null;
	body?: Record<string, unknown> | null;
	createTime: string;
}

const loading = ref(false);
const dataSource = ref<ErrorLogRecord[]>([]);
const detailVisible = ref(false);
const currentRecord = ref<ErrorLogRecord | null>(null);
const dateRange = ref<[Dayjs, Dayjs] | null>(null);

const searchForm = ref<{
	keyword: string;
	status?: number;
	method?: string;
}>({
	keyword: '',
	status: undefined,
	method: undefined,
});

const paginationState = ref({
	current: 1,
	pageSize: 20,
	total: 0,
});

const pagination = computed(() => ({
	current: paginationState.value.current,
	pageSize: paginationState.value.pageSize,
	total: paginationState.value.total,
	showTotal: (total: number) => `共 ${total} 条`,
	showSizeChanger: true,
	showQuickJumper: true,
	pageSizeOptions: ['10', '20', '50', '100'],
}));

const baseColumns: TableColumnsType = [
	{ title: 'ID', dataIndex: 'id', key: 'id', width: 80 },
	{ title: '状态码', dataIndex: 'status', key: 'status', width: 90 },
	{ title: '方法', dataIndex: 'method', key: 'method', width: 90 },
	{ title: 'URL', dataIndex: 'url', key: 'url', width: 320 },
	{ title: '错误消息', dataIndex: 'message', key: 'message', width: 260 },
	{ title: 'SQL错误', dataIndex: 'sqlMessage', key: 'sqlMessage', width: 260 },
	{ title: 'IP', dataIndex: 'ip', key: 'ip', width: 140 },
	{ title: '发生时间', dataIndex: 'createTime', key: 'createTime', width: 180 },
	{ title: '操作', key: 'action', width: 100, fixed: 'right' },
];

const { displayColumns, settingItems, resetColumns, updatePreference } = useTableColumns(
	'system-error-log-list',
	baseColumns as any[],
);

onMounted(() => {
	fetchData();
});

const fetchData = async () => {
	loading.value = true;
	try {
		const params: any = {
			page: paginationState.value.current,
			pageSize: paginationState.value.pageSize,
		};

		if (searchForm.value.keyword) params.keyword = searchForm.value.keyword;
		if (searchForm.value.status) params.status = searchForm.value.status;
		if (searchForm.value.method) params.method = searchForm.value.method;
		if (dateRange.value && dateRange.value[0] && dateRange.value[1]) {
			params.startTime = dateRange.value[0].format('YYYY-MM-DD') + ' 00:00:00';
			params.endTime = dateRange.value[1].format('YYYY-MM-DD') + ' 23:59:59';
		}

		const res = await getErrorLogs(params);
		if (res.code === 200 && res.data) {
			dataSource.value = res.data.list || [];
			paginationState.value.total = res.data.total || 0;
		} else {
			message.error(res.message || '获取错误日志失败');
		}
	} catch (error: any) {
		console.error('获取错误日志失败:', error);
		message.error(error.message || '获取错误日志失败');
	} finally {
		loading.value = false;
	}
};

const handleSearch = () => {
	paginationState.value.current = 1;
	fetchData();
};

const handleReset = () => {
	searchForm.value = {
		keyword: '',
		status: undefined,
		method: undefined,
	};
	dateRange.value = null;
	paginationState.value.current = 1;
	fetchData();
};

const handleTableChange = (pag: any) => {
	paginationState.value.current = pag.current;
	paginationState.value.pageSize = pag.pageSize;
	fetchData();
};

const handleViewDetail = (record: ErrorLogRecord) => {
	currentRecord.value = record;
	detailVisible.value = true;
};

const formatJson = (value: unknown) => {
	try {
		return JSON.stringify(value, null, 2);
	} catch {
		return String(value || '-');
	}
};
</script>

<style scoped lang="scss">
.error-log-management {
	.search-form {
		margin-bottom: 16px;
	}

	.table-toolbar {
		display: flex;
		justify-content: flex-end;
		margin-bottom: 12px;
	}

	.url-text,
	.message-text {
		display: inline-block;
		max-width: 300px;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		vertical-align: middle;
	}

	pre {
		max-height: 320px;
		margin: 0;
		overflow: auto;
		padding: 12px;
		border-radius: 4px;
		background: #f5f5f5;
		font-family: Monaco, Menlo, 'Ubuntu Mono', monospace;
		font-size: 12px;
		line-height: 1.5;
		white-space: pre-wrap;
		word-break: break-all;
	}
}
</style>
