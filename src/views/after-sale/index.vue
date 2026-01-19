<template>
	<div class="after-sale-list">
		<a-card>
			<template #title>售后申请管理</template>

			<!-- 搜索栏 -->
			<a-form :model="searchForm" layout="inline" class="search-form">
				<a-form-item label="处理状态">
					<a-select v-model:value="searchForm.status" placeholder="全部" style="width: 150px" allow-clear>
						<a-select-option :value="0">待处理</a-select-option>
						<a-select-option :value="1">已处理</a-select-option>
						<a-select-option :value="2">已拒绝</a-select-option>
					</a-select>
				</a-form-item>
				<a-form-item>
					<a-button type="primary" @click="handleSearch">搜索</a-button>
					<a-button style="margin-left: 8px" @click="handleReset">重置</a-button>
				</a-form-item>
			</a-form>

			<!-- 表格 -->
			<a-table
				:columns="columns"
				:data-source="dataSource"
				:loading="loading"
				:pagination="pagination"
				@change="handleTableChange"
				row-key="id"
			>
				<template #bodyCell="{ column, record }">
					<template v-if="column.key === 'status'">
						<a-tag :color="getStatusColor(record.status)">
							{{ getStatusLabel(record.status) }}
						</a-tag>
					</template>
					<template v-else-if="column.key === 'reason'">
						<div class="reason-cell">
							{{ record.reason }}
						</div>
					</template>
					<template v-else-if="column.key === 'action'">
						<a-space>
							<a-button type="link" size="small" @click="handleViewDetail(record)"> 查看详情 </a-button>
							<a-button
								v-if="record.status === 0"
								type="link"
								size="small"
								@click="handleProcess(record, 1)"
							>
								处理
							</a-button>
							<a-button
								v-if="record.status === 0"
								type="link"
								size="small"
								danger
								@click="handleProcess(record, 2)"
							>
								拒绝
							</a-button>
						</a-space>
					</template>
				</template>
			</a-table>
		</a-card>

		<!-- 详情弹窗 -->
		<a-modal v-model:open="detailModalVisible" title="售后申请详情" width="800px" :footer="null">
			<div v-if="currentRecord" class="after-sale-detail">
				<a-descriptions :column="2" bordered>
					<a-descriptions-item label="申请ID">{{ currentRecord.id }}</a-descriptions-item>
					<a-descriptions-item label="订单号">{{ currentRecord.order_no }}</a-descriptions-item>
					<a-descriptions-item label="用户ID">{{ currentRecord.user_id }}</a-descriptions-item>
					<a-descriptions-item label="处理状态">
						<a-tag :color="getStatusColor(currentRecord.status)">
							{{ getStatusLabel(currentRecord.status) }}
						</a-tag>
					</a-descriptions-item>
					<a-descriptions-item label="申请时间">
						{{ formatDate(currentRecord.create_time) }}
					</a-descriptions-item>
					<a-descriptions-item v-if="currentRecord.process_time" label="处理时间">
						{{ formatDate(currentRecord.process_time) }}
					</a-descriptions-item>
					<a-descriptions-item label="售后原因" :span="2">
						<div class="description-text">{{ currentRecord.reason }}</div>
					</a-descriptions-item>
					<a-descriptions-item v-if="currentRecord.description" label="详细描述" :span="2">
						<div class="description-text">{{ currentRecord.description }}</div>
					</a-descriptions-item>
					<a-descriptions-item v-if="currentRecord.admin_reply" label="管理员回复" :span="2">
						<div class="reply-text">{{ currentRecord.admin_reply }}</div>
					</a-descriptions-item>
				</a-descriptions>
			</div>
		</a-modal>

		<!-- 处理弹窗 -->
		<a-modal
			v-model:open="processModalVisible"
			:title="processType === 1 ? '处理售后申请' : '拒绝售后申请'"
			@ok="handleConfirmProcess"
			:confirm-loading="processing"
		>
			<a-form :model="processForm" :label-col="{ span: 6 }" :wrapper-col="{ span: 18 }">
				<a-form-item label="管理员回复">
					<a-textarea
						v-model:value="processForm.admin_reply"
						:rows="4"
						placeholder="请输入处理意见或回复内容"
					/>
				</a-form-item>
			</a-form>
		</a-modal>
	</div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { message } from 'ant-design-vue';
import dayjs from 'dayjs';
import { getAfterSaleList, processAfterSale } from '@/api/after-sale';

const loading = ref(false);
const dataSource = ref([]);
const detailModalVisible = ref(false);
const currentRecord = ref<any>(null);
const processModalVisible = ref(false);
const processType = ref<number>(1); // 1-处理，2-拒绝
const processing = ref(false);
const currentProcessRecord = ref<any>(null);

const searchForm = ref({
	status: undefined,
});

const processForm = ref({
	admin_reply: '',
});

const pagination = ref({
	current: 1,
	pageSize: 10,
	total: 0,
});

const columns = [
	{
		title: '申请ID',
		dataIndex: 'id',
		key: 'id',
		width: 100,
	},
	{
		title: '订单号',
		dataIndex: 'order_no',
		key: 'order_no',
		width: 200,
	},
	{
		title: '用户ID',
		dataIndex: 'user_id',
		key: 'user_id',
		width: 100,
	},
	{
		title: '售后原因',
		key: 'reason',
		width: 200,
	},
	{
		title: '处理状态',
		key: 'status',
		width: 120,
	},
	{
		title: '申请时间',
		dataIndex: 'create_time',
		key: 'create_time',
		width: 180,
	},
	{
		title: '操作',
		key: 'action',
		width: 200,
	},
];

const fetchData = async () => {
	loading.value = true;
	try {
		const params: any = {
			page: pagination.value.current,
			pageSize: pagination.value.pageSize,
		};
		if (searchForm.value.status !== undefined) {
			params.status = searchForm.value.status;
		}
		const res = await getAfterSaleList(params);
		if (res && res.data) {
			dataSource.value = res.data.list || res.data;
			pagination.value.total = res.data.total || res.data.length;
		} else if (Array.isArray(res)) {
			dataSource.value = res;
			pagination.value.total = res.length;
		}
	} catch (error: any) {
		console.error('获取售后申请列表失败:', error);
		message.error(error.message || '获取售后申请列表失败');
	} finally {
		loading.value = false;
	}
};

const handleSearch = () => {
	pagination.value.current = 1;
	fetchData();
};

const handleReset = () => {
	searchForm.value.status = undefined;
	pagination.value.current = 1;
	fetchData();
};

const handleTableChange = (pag: any) => {
	pagination.value.current = pag.current;
	pagination.value.pageSize = pag.pageSize;
	fetchData();
};

const getStatusColor = (status: number) => {
	const colorMap: Record<number, string> = {
		0: 'orange',
		1: 'green',
		2: 'red',
	};
	return colorMap[status] || 'default';
};

const getStatusLabel = (status: number) => {
	const labelMap: Record<number, string> = {
		0: '待处理',
		1: '已处理',
		2: '已拒绝',
	};
	return labelMap[status] || '未知';
};

const formatDate = (date: string | Date) => {
	if (!date) return '-';
	return dayjs(date).format('YYYY-MM-DD HH:mm:ss');
};

const handleViewDetail = (record: any) => {
	currentRecord.value = record;
	detailModalVisible.value = true;
};

const handleProcess = (record: any, type: number) => {
	currentProcessRecord.value = record;
	processType.value = type;
	processForm.value.admin_reply = '';
	processModalVisible.value = true;
};

const handleConfirmProcess = async () => {
	if (!currentProcessRecord.value) return;

	processing.value = true;
	try {
		await processAfterSale(currentProcessRecord.value.id, {
			status: processType.value,
			admin_reply: processForm.value.admin_reply || '',
		});
		message.success(processType.value === 1 ? '处理成功' : '已拒绝');
		processModalVisible.value = false;
		fetchData();
	} catch (error: any) {
		console.error('处理售后申请失败:', error);
		message.error(error.message || '处理失败');
	} finally {
		processing.value = false;
	}
};

onMounted(() => {
	fetchData();
});
</script>

<style lang="scss" scoped>
.after-sale-list {
	.reason-cell {
		max-width: 200px;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.after-sale-detail {
		.description-text,
		.reply-text {
			white-space: pre-wrap;
			word-break: break-word;
		}
	}
}
</style>
