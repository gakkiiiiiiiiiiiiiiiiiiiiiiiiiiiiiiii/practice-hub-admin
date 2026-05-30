<template>
	<div class="order-list">
		<a-card>
			<template #title>订单列表</template>

			<a-form :model="searchForm" layout="inline" class="search-form">
				<a-form-item label="关键词">
					<a-input-search
						v-model:value="searchForm.keyword"
						placeholder="订单号 / 昵称 / 手机号 / 用户ID"
						style="width: 260px"
						allow-clear
						@search="handleSearch"
					/>
				</a-form-item>
				<a-form-item label="订单状态">
					<a-select v-model:value="searchForm.status" placeholder="全部" style="width: 140px" allow-clear>
						<a-select-option value="pending">待支付</a-select-option>
						<a-select-option value="paid">支付完成</a-select-option>
						<a-select-option value="cancelled">已取消</a-select-option>
						<a-select-option value="after_sale">售后</a-select-option>
					</a-select>
				</a-form-item>
				<a-form-item label="订单类型">
					<a-select v-model:value="searchForm.order_type" placeholder="全部" style="width: 120px" allow-clear>
						<a-select-option value="course">课程</a-select-option>
						<a-select-option value="package">套餐</a-select-option>
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
				row-key="id"
				:scroll="{ x: 1200 }"
				@change="handleTableChange"
			>
				<template #bodyCell="{ column, record }">
					<template v-if="column.key === 'user'">
						<a-space>
							<a-avatar :src="record.user?.avatar" :size="32">
								{{ record.user?.nickname?.[0] || 'U' }}
							</a-avatar>
							<div>
								<div>{{ record.user?.nickname || '未知用户' }}</div>
								<div class="sub-text">ID: {{ record.userId }}</div>
								<div v-if="record.user?.phone" class="sub-text">{{ record.user.phone }}</div>
							</div>
						</a-space>
					</template>
					<template v-else-if="column.key === 'product'">
						<div>{{ record.productName }}</div>
						<div v-if="record.isCart" class="sub-text">含 {{ record.cartItems?.length || 0 }} 门课程</div>
						<div v-else-if="record.orderType === 'course' && record.courseName" class="sub-text">
							课程ID: {{ record.courseId }}
						</div>
					</template>
					<template v-else-if="column.key === 'amount'">
						<div class="amount-text">¥{{ formatAmount(record.amount) }}</div>
						<div v-if="record.discountAmount > 0" class="sub-text">
							优惠 ¥{{ formatAmount(record.discountAmount) }}
						</div>
					</template>
					<template v-else-if="column.key === 'status'">
						<a-tag :color="getStatusColor(record.status)">{{ getStatusLabel(record.status) }}</a-tag>
					</template>
					<template v-else-if="column.key === 'orderType'">
						<a-tag>{{ record.orderType === 'package' ? '套餐' : '课程' }}</a-tag>
					</template>
					<template v-else-if="column.key === 'createTime'">
						{{ formatTime(record.createTime) }}
					</template>
					<template v-else-if="column.key === 'paidTime'">
						{{ record.paidTime ? formatTime(record.paidTime) : '-' }}
					</template>
					<template v-else-if="column.key === 'action'">
						<a-button type="link" size="small" @click="handleViewDetail(record)">查看详情</a-button>
					</template>
				</template>
			</a-table>
		</a-card>

		<a-modal v-model:open="detailVisible" title="订单详情" width="760px" :footer="null">
			<div v-if="currentRecord">
				<a-descriptions :column="2" bordered>
					<a-descriptions-item label="订单号" :span="2">{{ currentRecord.orderNo }}</a-descriptions-item>
					<a-descriptions-item label="用户">{{ currentRecord.user?.nickname || '未知用户' }}</a-descriptions-item>
					<a-descriptions-item label="用户ID">{{ currentRecord.userId }}</a-descriptions-item>
					<a-descriptions-item label="手机号">{{ currentRecord.user?.phone || '-' }}</a-descriptions-item>
					<a-descriptions-item label="订单状态">
						<a-tag :color="getStatusColor(currentRecord.status)">{{ getStatusLabel(currentRecord.status) }}</a-tag>
					</a-descriptions-item>
					<a-descriptions-item label="购买内容" :span="2">{{ currentRecord.productName }}</a-descriptions-item>
					<a-descriptions-item label="实付金额">¥{{ formatAmount(currentRecord.amount) }}</a-descriptions-item>
					<a-descriptions-item label="原价">
						{{ currentRecord.originalAmount != null ? `¥${formatAmount(currentRecord.originalAmount)}` : '-' }}
					</a-descriptions-item>
					<a-descriptions-item label="优惠金额">¥{{ formatAmount(currentRecord.discountAmount) }}</a-descriptions-item>
					<a-descriptions-item label="支付方式">{{ currentRecord.payProvider || '-' }}</a-descriptions-item>
					<a-descriptions-item label="下单时间">{{ formatTime(currentRecord.createTime) }}</a-descriptions-item>
					<a-descriptions-item label="支付时间">
						{{ currentRecord.paidTime ? formatTime(currentRecord.paidTime) : '-' }}
					</a-descriptions-item>
				</a-descriptions>

				<div v-if="currentRecord.cartItems?.length" class="cart-items">
					<div class="cart-title">购物车课程明细</div>
					<a-table
						:columns="cartColumns"
						:data-source="currentRecord.cartItems"
						:pagination="false"
						row-key="courseId"
						size="small"
					>
						<template #bodyCell="{ column, record }">
							<template v-if="column.key === 'price'">¥{{ formatAmount(record.price) }}</template>
						</template>
					</a-table>
				</div>
			</div>
		</a-modal>
	</div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import dayjs from 'dayjs'
import { getAdminOrderList } from '@/api/order'

const loading = ref(false)
const dataSource = ref<any[]>([])
const detailVisible = ref(false)
const currentRecord = ref<any>(null)

const searchForm = ref({
	keyword: '',
	status: undefined as string | undefined,
	order_type: undefined as string | undefined,
})

const pagination = ref({
	current: 1,
	pageSize: 10,
	total: 0,
	showSizeChanger: true,
	showTotal: (total: number) => `共 ${total} 条`,
})

const columns = [
	{ title: '订单号', dataIndex: 'orderNo', key: 'orderNo', width: 190 },
	{ title: '用户', key: 'user', width: 180 },
	{ title: '购买内容', key: 'product', width: 220 },
	{ title: '金额', key: 'amount', width: 120 },
	{ title: '类型', key: 'orderType', width: 90 },
	{ title: '状态', key: 'status', width: 110 },
	{ title: '下单时间', key: 'createTime', width: 170 },
	{ title: '支付时间', key: 'paidTime', width: 170 },
	{ title: '操作', key: 'action', width: 100, fixed: 'right' as const },
]

const cartColumns = [
	{ title: '课程ID', dataIndex: 'courseId', key: 'courseId', width: 100 },
	{ title: '课程名称', dataIndex: 'name', key: 'name' },
	{ title: '价格', key: 'price', width: 100 },
]

const fetchData = async () => {
	loading.value = true
	try {
		const res = await getAdminOrderList({
			page: pagination.value.current,
			pageSize: pagination.value.pageSize,
			keyword: searchForm.value.keyword || undefined,
			status: searchForm.value.status,
			order_type: searchForm.value.order_type,
		})
		dataSource.value = res.data?.list || []
		pagination.value.total = res.data?.total || 0
	} catch (error: any) {
		console.error(error)
	} finally {
		loading.value = false
	}
}

const handleSearch = () => {
	pagination.value.current = 1
	fetchData()
}

const handleReset = () => {
	searchForm.value = {
		keyword: '',
		status: undefined,
		order_type: undefined,
	}
	pagination.value.current = 1
	fetchData()
}

const handleTableChange = (pager: any) => {
	pagination.value.current = pager.current
	pagination.value.pageSize = pager.pageSize
	fetchData()
}

const handleViewDetail = (record: any) => {
	currentRecord.value = record
	detailVisible.value = true
}

const formatAmount = (value: number | string) => Number(value || 0).toFixed(2)

const formatTime = (value: string) => dayjs(value).format('YYYY-MM-DD HH:mm:ss')

const getStatusLabel = (status: string) => {
	const map: Record<string, string> = {
		pending: '待支付',
		paid: '支付完成',
		cancelled: '已取消',
		after_sale: '售后',
	}
	return map[status] || status
}

const getStatusColor = (status: string) => {
	const map: Record<string, string> = {
		pending: 'orange',
		paid: 'green',
		cancelled: 'default',
		after_sale: 'red',
	}
	return map[status] || 'default'
}

onMounted(fetchData)
</script>

<style scoped>
.search-form {
	margin-bottom: 16px;
}

.sub-text {
	color: #999;
	font-size: 12px;
	line-height: 1.5;
}

.amount-text {
	font-weight: 600;
	color: #111827;
}

.cart-items {
	margin-top: 20px;
}

.cart-title {
	margin-bottom: 12px;
	font-weight: 600;
}
</style>
