<template>
	<div class="distributor-list">
		<div class="toolbar">
			<a-space>
				<a-select
					v-model:value="filters.status"
					placeholder="选择状态"
					style="width: 150px"
					allowClear
					@change="handleSearch"
				>
					<a-select-option :value="0">待审核</a-select-option>
					<a-select-option :value="1">已通过</a-select-option>
					<a-select-option :value="2">已拒绝</a-select-option>
					<a-select-option :value="3">已禁用</a-select-option>
				</a-select>
				<a-button type="primary" @click="handleSearch">查询</a-button>
				<a-button @click="handleReset">重置</a-button>
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
				<template v-if="column.key === 'status'">
					<a-tag :color="getStatusColor(record.status)">
						{{ getStatusText(record.status) }}
					</a-tag>
				</template>
				<template v-else-if="column.key === 'action'">
					<a-space>
						<a-button
							type="link"
							size="small"
							v-if="record.status === 0"
							@click="handleApprove(record)"
						>
							通过
						</a-button>
						<a-button
							type="link"
							size="small"
							danger
							v-if="record.status === 0"
							@click="handleReject(record)"
						>
							拒绝
						</a-button>
						<a-button
							type="link"
							size="small"
							v-if="record.status === 1"
							@click="handleDisable(record)"
						>
							禁用
						</a-button>
						<a-button
							type="link"
							size="small"
							v-if="record.status === 3"
							@click="handleEnable(record)"
						>
							启用
						</a-button>
					</a-space>
				</template>
			</template>
		</a-table>

		<a-modal
			v-model:open="rejectModalVisible"
			title="拒绝申请"
			@ok="handleRejectConfirm"
			:confirmLoading="rejectLoading"
		>
			<a-form :model="rejectForm">
				<a-form-item label="拒绝原因">
					<a-textarea
						v-model:value="rejectForm.reject_reason"
						:rows="4"
						placeholder="请输入拒绝原因"
					/>
				</a-form-item>
			</a-form>
		</a-modal>
	</div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { message, Modal } from 'ant-design-vue';
import {
	getDistributorList,
	updateDistributorStatus,
} from '@/api/distributor';

const columns = [
	{
		title: 'ID',
		dataIndex: 'id',
		key: 'id',
		width: 80,
	},
	{
		title: '用户ID',
		dataIndex: 'user_id',
		key: 'user_id',
		width: 100,
	},
	{
		title: '用户昵称',
		dataIndex: 'user_nickname',
		key: 'user_nickname',
	},
	{
		title: '分销商编号',
		dataIndex: 'distributor_code',
		key: 'distributor_code',
	},
	{
		title: '状态',
		key: 'status',
		width: 100,
	},
	{
		title: '累计收益',
		dataIndex: 'total_earnings',
		key: 'total_earnings',
		width: 120,
		customRender: ({ text }: any) => `¥${Number(text || 0).toFixed(2)}`,
	},
	{
		title: '可提现',
		dataIndex: 'withdrawable_amount',
		key: 'withdrawable_amount',
		width: 120,
		customRender: ({ text }: any) => `¥${Number(text || 0).toFixed(2)}`,
	},
	{
		title: '下级数量',
		dataIndex: 'subordinate_count',
		key: 'subordinate_count',
		width: 100,
	},
	{
		title: '推广订单',
		dataIndex: 'total_orders',
		key: 'total_orders',
		width: 100,
	},
	{
		title: '申请时间',
		dataIndex: 'create_time',
		key: 'create_time',
		width: 180,
		customRender: ({ text }: any) => {
			if (!text) return '-';
			return new Date(text).toLocaleString('zh-CN');
		},
	},
	{
		title: '操作',
		key: 'action',
		width: 200,
		fixed: 'right',
	},
];

const dataSource = ref([]);
const loading = ref(false);
const filters = ref({
	status: undefined,
});
const pagination = ref({
	current: 1,
	pageSize: 20,
	total: 0,
});

const rejectModalVisible = ref(false);
const rejectLoading = ref(false);
const currentRecord = ref<any>(null);
const rejectForm = ref({
	reject_reason: '',
});

onMounted(() => {
	loadData();
});

const loadData = async () => {
	loading.value = true;
	try {
		const params: any = {
			page: pagination.value.current,
			pageSize: pagination.value.pageSize,
		};
		if (filters.value.status !== undefined) {
			params.status = filters.value.status;
		}

		const res = await getDistributorList(params);
		dataSource.value = res.data?.list || [];
		pagination.value.total = res.data?.total || 0;
	} catch (error: any) {
		message.error(error?.message || error?.msg || '加载失败');
	} finally {
		loading.value = false;
	}
};

const handleSearch = () => {
	pagination.value.current = 1;
	loadData();
};

const handleReset = () => {
	filters.value.status = undefined;
	pagination.value.current = 1;
	loadData();
};

const handleTableChange = (pag: any) => {
	pagination.value.current = pag.current;
	pagination.value.pageSize = pag.pageSize;
	loadData();
};

const handleApprove = async (record: any) => {
	Modal.confirm({
		title: '确认通过',
		content: `确定要通过用户 ${record.user_nickname || record.user_id} 的分销申请吗？`,
		onOk: async () => {
			try {
				await updateDistributorStatus(record.id, {
					status: 1,
				});
				message.success('操作成功');
				loadData();
			} catch (error: any) {
				message.error(error?.message || error?.msg || '操作失败');
			}
		},
	});
};

const handleReject = (record: any) => {
	currentRecord.value = record;
	rejectForm.value.reject_reason = '';
	rejectModalVisible.value = true;
};

const handleRejectConfirm = async () => {
	if (!rejectForm.value.reject_reason.trim()) {
		message.warning('请输入拒绝原因');
		return;
	}

	rejectLoading.value = true;
	try {
		await updateDistributorStatus(currentRecord.value.id, {
			status: 2,
			reject_reason: rejectForm.value.reject_reason,
		});
		message.success('操作成功');
		rejectModalVisible.value = false;
		loadData();
	} catch (error: any) {
		message.error(error.msg || '操作失败');
	} finally {
		rejectLoading.value = false;
	}
};

const handleDisable = async (record: any) => {
	Modal.confirm({
		title: '确认禁用',
		content: `确定要禁用用户 ${record.user_nickname || record.user_id} 的分销资格吗？`,
		onOk: async () => {
			try {
				await updateDistributorStatus(record.id, {
					status: 3,
				});
				message.success('操作成功');
				loadData();
			} catch (error: any) {
				message.error(error?.message || error?.msg || '操作失败');
			}
		},
	});
};

const handleEnable = async (record: any) => {
	Modal.confirm({
		title: '确认启用',
		content: `确定要启用用户 ${record.user_nickname || record.user_id} 的分销资格吗？`,
		onOk: async () => {
			try {
				await updateDistributorStatus(record.id, {
					status: 1,
				});
				message.success('操作成功');
				loadData();
			} catch (error: any) {
				message.error(error?.message || error?.msg || '操作失败');
			}
		},
	});
};

const getStatusText = (status: number) => {
	const statusMap: Record<number, string> = {
		0: '待审核',
		1: '已通过',
		2: '已拒绝',
		3: '已禁用',
	};
	return statusMap[status] || '未知';
};

const getStatusColor = (status: number) => {
	const colorMap: Record<number, string> = {
		0: 'orange',
		1: 'green',
		2: 'red',
		3: 'default',
	};
	return colorMap[status] || 'default';
};
</script>

<style scoped lang="scss">
.distributor-list {
	.toolbar {
		margin-bottom: 16px;
	}
}
</style>

