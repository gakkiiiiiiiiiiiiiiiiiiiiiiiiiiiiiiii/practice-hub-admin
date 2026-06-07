<template>
	<div class="order-list">
		<a-card>

			<a-form :model="searchForm" layout="inline" class="search-form">
				<a-form-item label="关键词">
					<a-input-search
						v-model:value="searchForm.keyword"
						placeholder="订单号 / 昵称 / 手机号 / OpenID"
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
				:scroll="{ x: 1400 }"
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
								<div class="sub-text openid-text">OpenID: {{ record.user?.openid || record.openid || '-' }}</div>
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
					<template v-else-if="column.key === 'afterSale'">
						<template v-if="record.afterSale?.reason">
							<div class="after-sale-reason">{{ record.afterSale.reason }}</div>
							<div v-if="record.afterSale.description" class="sub-text after-sale-desc">
								{{ record.afterSale.description }}
							</div>
							<a-tag size="small" :color="getAfterSaleStatusColor(record.afterSale.status)">
								{{ getAfterSaleStatusLabel(record.afterSale.status) }}
							</a-tag>
						</template>
						<span v-else class="sub-text">-</span>
					</template>
					<template v-else-if="column.key === 'status'">
						<a-tag v-if="record.refunded" color="default">已退款</a-tag>
						<a-tag v-else :color="getStatusColor(record.status)">{{ getStatusLabel(record.status) }}</a-tag>
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
						<a-space>
							<a-button type="link" size="small" @click="handleViewDetail(record)">查看详情</a-button>
							<a-button
								v-if="record.status === 'pending'"
								type="link"
								size="small"
								:loading="syncingOrderId === record.id"
								@click="handleSyncPayment(record)"
							>
								同步支付
							</a-button>
							<a-button
								v-if="record.status === 'after_sale' && !record.refunded"
								type="link"
								size="small"
								danger
								@click="openRefundModal(record)"
							>
								退款
							</a-button>
						</a-space>
					</template>
				</template>
			</a-table>
		</a-card>

		<a-modal v-model:open="detailVisible" title="订单详情" width="760px" :footer="null">
			<div v-if="currentRecord">
				<a-descriptions :column="2" bordered>
					<a-descriptions-item label="业务订单号" :span="2">{{ currentRecord.orderNo }}</a-descriptions-item>
					<a-descriptions-item v-if="currentRecord.wechatRechargeOrderNo" label="微信充值单号" :span="2">
						{{ currentRecord.wechatRechargeOrderNo }}
						<div class="sub-text">微信商户后台显示的是充值单号，与业务订单号不同属正常情况</div>
					</a-descriptions-item>
					<a-descriptions-item label="用户">{{ currentRecord.user?.nickname || '未知用户' }}</a-descriptions-item>
					<a-descriptions-item label="OpenID" :span="2">
						<span class="openid-text">{{ currentRecord.user?.openid || currentRecord.openid || '-' }}</span>
					</a-descriptions-item>
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
					<template v-if="currentRecord.afterSale">
						<a-descriptions-item label="售后原因" :span="2">
							{{ currentRecord.afterSale.reason || '-' }}
						</a-descriptions-item>
						<a-descriptions-item v-if="currentRecord.afterSale.description" label="详细描述" :span="2">
							{{ currentRecord.afterSale.description }}
						</a-descriptions-item>
						<a-descriptions-item label="售后状态">
							<a-tag :color="getAfterSaleStatusColor(currentRecord.afterSale.status)">
								{{ getAfterSaleStatusLabel(currentRecord.afterSale.status) }}
							</a-tag>
						</a-descriptions-item>
						<a-descriptions-item label="申请时间">
							{{ currentRecord.afterSale.createTime ? formatTime(currentRecord.afterSale.createTime) : '-' }}
						</a-descriptions-item>
						<a-descriptions-item v-if="currentRecord.afterSale.adminReply" label="处理回复" :span="2">
							{{ currentRecord.afterSale.adminReply }}
						</a-descriptions-item>
					</template>
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

		<a-modal
			v-model:open="refundVisible"
			title="确认退款"
			ok-text="确认退款"
			cancel-text="取消"
			:confirm-loading="refunding"
			@ok="handleConfirmRefund"
		>
			<a-alert
				type="warning"
				show-icon
				message="退款将撤销用户课程/套餐权限，并原路退回微信代币或充值金额。"
				style="margin-bottom: 16px"
			/>
			<a-form layout="vertical">
				<a-form-item label="订单号">
					<a-input :value="refundTarget?.orderNo" disabled />
				</a-form-item>
				<a-form-item label="退款金额">
					<a-input :value="refundTarget ? `¥${formatAmount(refundTarget.amount)}` : ''" disabled />
				</a-form-item>
				<a-form-item label="退款备注">
					<a-textarea v-model:value="refundRemark" :rows="3" placeholder="可选，例如：用户申请售后，同意退款" />
				</a-form-item>
			</a-form>
		</a-modal>
	</div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import dayjs from 'dayjs'
import { message } from 'ant-design-vue'
import { getAdminOrderList, refundAdminOrder, syncAdminOrderPayment } from '@/api/order'

const loading = ref(false)
const syncingOrderId = ref<number | null>(null)
const refundVisible = ref(false)
const refunding = ref(false)
const refundTarget = ref<any>(null)
const refundRemark = ref('')
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
	{ title: '售后原因', key: 'afterSale', width: 220 },
	{ title: '下单时间', key: 'createTime', width: 170 },
	{ title: '支付时间', key: 'paidTime', width: 170 },
	{ title: '操作', key: 'action', width: 220, fixed: 'right' as const },
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

const openRefundModal = (record: any) => {
	refundTarget.value = record
	refundRemark.value = ''
	refundVisible.value = true
}

const handleConfirmRefund = async () => {
	if (!refundTarget.value) {
		return
	}
	refunding.value = true
	try {
		const res = await refundAdminOrder(refundTarget.value.id, {
			remark: refundRemark.value.trim() || undefined,
		})
		message.success(res.data?.message || '退款成功')
		refundVisible.value = false
		await fetchData()
	} catch (error: any) {
		message.error(error?.message || '退款失败')
		throw error
	} finally {
		refunding.value = false
	}
}

const handleSyncPayment = async (record: any) => {
	syncingOrderId.value = record.id
	try {
		const res = await syncAdminOrderPayment(record.id)
		message.success(res.data?.message || '支付状态已同步')
		await fetchData()
		if (currentRecord.value?.id === record.id) {
			currentRecord.value = dataSource.value.find((item) => item.id === record.id) || currentRecord.value
		}
	} catch (error: any) {
		message.error(error?.message || '同步支付状态失败')
	} finally {
		syncingOrderId.value = null
	}
}

const formatAmount = (value: number | string) => Number(value || 0).toFixed(2)

const formatTime = (value: string) => dayjs(value).format('YYYY-MM-DD HH:mm:ss')

const getStatusLabel = (status: string) => {
	const map: Record<string, string> = {
		pending: '待支付',
		paid: '支付完成',
		cancelled: '已取消',
		after_sale: '售后',
		refunded: '已退款',
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

const getAfterSaleStatusLabel = (status: number) => {
	const map: Record<number, string> = {
		0: '待处理',
		1: '已处理',
		2: '已拒绝',
	}
	return map[status] ?? '未知'
}

const getAfterSaleStatusColor = (status: number) => {
	const map: Record<number, string> = {
		0: 'orange',
		1: 'green',
		2: 'red',
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

.openid-text {
	word-break: break-all;
}

.after-sale-reason {
	color: #111827;
	font-size: 13px;
	line-height: 1.5;
}

.after-sale-desc {
	margin-top: 4px;
	display: -webkit-box;
	-webkit-line-clamp: 2;
	-webkit-box-orient: vertical;
	overflow: hidden;
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
