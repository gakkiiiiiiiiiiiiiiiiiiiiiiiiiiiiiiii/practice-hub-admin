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
						<a-select-option value="category">分类合集</a-select-option>
					</a-select>
				</a-form-item>
				<a-form-item label="课程类型">
					<a-select v-model:value="searchForm.content_type" placeholder="全部" style="width: 140px" allow-clear>
						<a-select-option value="normal">普通题库</a-select-option>
						<a-select-option value="file">文件课程</a-select-option>
						<a-select-option value="paper_exam">纸质真题</a-select-option>
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
							<div v-if="record.afterSale.wechatContact" class="sub-text">
								微信：{{ record.afterSale.wechatContact }}
							</div>
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
					<template v-else-if="column.key === 'delivery'">
						<template v-if="isPaperShippingOrder(record)">
							<a-tag :color="getDeliveryStatusColor(record.deliveryStatus)">
								{{ getDeliveryStatusLabel(record.deliveryStatus) }}
							</a-tag>
							<div v-if="record.trackingNo" class="sub-text">{{ record.trackingNo }}</div>
							<div v-if="record.shipperName" class="sub-text">{{ record.shipperName }}</div>
						</template>
						<span v-else class="sub-text">-</span>
					</template>
					<template v-else-if="column.key === 'orderType'">
						<a-tag>{{ getOrderTypeLabel(record.orderType) }}</a-tag>
					</template>
					<template v-else-if="column.key === 'createTime'">
						{{ formatTime(record.createTime) }}
					</template>
					<template v-else-if="column.key === 'paidTime'">
						{{ record.paidTime ? formatTime(record.paidTime) : '-' }}
					</template>
					<template v-else-if="column.key === 'action'">
						<a-space wrap>
							<a-button type="link" size="small" @click="handleViewDetail(record)">查看详情</a-button>
							<a-button
								v-if="canShipOrder(record)"
								type="link"
								size="small"
								@click="openShipModal(record)"
							>
								{{ record.trackingNo ? '改运单' : '发货' }}
							</a-button>
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
								v-if="record.status === 'paid' && !record.refunded"
								type="link"
								size="small"
								danger
								@click="openRefundModal(record)"
							>
								退款
							</a-button>
							<a-button
								v-if="record.status === 'after_sale' && !record.refunded"
								type="link"
								size="small"
								@click="openCustomerServiceModal"
							>
								联系客服
							</a-button>
						</a-space>
					</template>
				</template>
			</a-table>
		</a-card>

		<a-modal v-model:open="detailVisible" title="订单详情" width="760px" :footer="null">
			<a-spin :spinning="detailLoading">
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
					<a-descriptions-item v-if="currentRecord.shippingAddress" label="收货人">
						{{ currentRecord.shippingAddress.name || '-' }}
					</a-descriptions-item>
					<a-descriptions-item v-if="currentRecord.shippingAddress" label="收货电话">
						{{ currentRecord.shippingAddress.phone || '-' }}
					</a-descriptions-item>
					<a-descriptions-item v-if="currentRecord.shippingAddress" label="收货地址" :span="2">
						{{ formatShippingAddress(currentRecord.shippingAddress) }}
					</a-descriptions-item>
					<a-descriptions-item v-if="isPaperShippingOrder(currentRecord)" label="发货状态">
						<a-tag :color="getDeliveryStatusColor(currentRecord.deliveryStatus)">
							{{ getDeliveryStatusLabel(currentRecord.deliveryStatus) }}
						</a-tag>
					</a-descriptions-item>
					<a-descriptions-item v-if="isPaperShippingOrder(currentRecord)" label="运单号">
						{{ currentRecord.trackingNo || '-' }}
					</a-descriptions-item>
					<a-descriptions-item v-if="isPaperShippingOrder(currentRecord)" label="物流公司">
						{{ currentRecord.shipperName || currentRecord.shipperCode || '-' }}
					</a-descriptions-item>
					<a-descriptions-item v-if="isPaperShippingOrder(currentRecord)" label="发货时间">
						{{ currentRecord.shippedAt ? formatTime(currentRecord.shippedAt) : '-' }}
					</a-descriptions-item>
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

				<div v-if="isPaperShippingOrder(currentRecord)" class="shipment-detail">
					<div class="section-title-row">
						<div class="cart-title">物流信息</div>
						<a-space>
							<a-button v-if="canShipOrder(currentRecord)" size="small" @click="openShipModal(currentRecord)">
								{{ currentRecord.trackingNo ? '修改运单' : '录入发货' }}
							</a-button>
							<a-button
								size="small"
								:disabled="!currentRecord.trackingNo"
								:loading="logisticsQueryingId === currentRecord.id"
								@click="handleQueryLogistics(currentRecord)"
							>
								查询物流
							</a-button>
						</a-space>
					</div>
					<a-alert
						v-if="currentRecord.logisticsSnapshot && !currentRecord.logisticsSnapshot.configured"
						type="info"
						show-icon
						:message="currentRecord.logisticsSnapshot.message || '快递鸟 API 未配置，已保存运单号'"
						class="shipment-alert"
					/>
					<a-alert
						v-else-if="currentRecord.logisticsSnapshot && !currentRecord.logisticsSnapshot.success"
						type="warning"
						show-icon
						:message="currentRecord.logisticsSnapshot.reason || currentRecord.logisticsSnapshot.message || '物流查询失败'"
						class="shipment-alert"
					/>
					<div v-if="currentRecord.logisticsSnapshot?.traces?.length" class="logistics-traces">
						<a-timeline>
							<a-timeline-item
								v-for="(trace, index) in currentRecord.logisticsSnapshot.traces"
								:key="`${trace.time}-${index}`"
							>
								<div class="trace-text">{{ trace.text || '-' }}</div>
								<div class="sub-text">{{ trace.time || '-' }}</div>
							</a-timeline-item>
						</a-timeline>
					</div>
				</div>

				<div v-if="showAfterSaleDetail(currentRecord)" class="after-sale-detail">
					<div class="cart-title">售后信息</div>
					<a-descriptions :column="1" bordered size="small">
						<a-descriptions-item label="微信联系方式">
							{{ currentRecord.afterSale?.wechatContact || '-' }}
						</a-descriptions-item>
						<a-descriptions-item label="售后原因">
							{{ currentRecord.afterSale?.reason || '-' }}
						</a-descriptions-item>
						<a-descriptions-item label="详细描述">
							<div class="after-sale-description">
								{{ currentRecord.afterSale?.description || '-' }}
							</div>
						</a-descriptions-item>
						<a-descriptions-item label="售后状态">
							<a-tag :color="getAfterSaleStatusColor(currentRecord.afterSale?.status ?? 0)">
								{{ getAfterSaleStatusLabel(currentRecord.afterSale?.status ?? 0) }}
							</a-tag>
						</a-descriptions-item>
						<a-descriptions-item label="申请时间">
							{{ currentRecord.afterSale?.createTime ? formatTime(currentRecord.afterSale.createTime) : '-' }}
						</a-descriptions-item>
						<a-descriptions-item v-if="currentRecord.afterSale?.adminReply" label="处理回复">
							{{ currentRecord.afterSale.adminReply }}
						</a-descriptions-item>
					</a-descriptions>
				</div>

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
							<template v-else-if="column.key === 'contentType'">
								<a-tag>{{ getCartItemTypeLabel(record.contentType) }}</a-tag>
							</template>
						</template>
					</a-table>
				</div>
			</div>
			</a-spin>
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

		<a-modal
			v-model:open="contactServiceVisible"
			title="联系客服"
			:footer="null"
		>
			<a-alert
				type="info"
				show-icon
				message="联系QQ:2705208065"
				style="margin-bottom: 16px"
			/>
			<div class="customer-service-qr">
				<img :src="customerServiceQr" alt="客服 QQ 二维码" />
			</div>
			<a-space>
				<a-button type="primary" @click="handleCopyCustomerServiceContact">复制QQ号</a-button>
				<a-button @click="contactServiceVisible = false">关闭</a-button>
			</a-space>
		</a-modal>

		<a-modal
			v-model:open="shipVisible"
			:title="shipTarget?.trackingNo ? '修改运单' : '录入发货'"
			ok-text="保存"
			cancel-text="取消"
			:confirm-loading="shipping"
			@ok="handleConfirmShip"
		>
			<a-form layout="vertical">
				<a-form-item label="订单号">
					<a-input :value="shipTarget?.orderNo" disabled />
				</a-form-item>
				<a-form-item label="运单号" required>
					<a-input v-model:value="shipForm.tracking_no" placeholder="请输入物流运单号" :maxlength="80" />
				</a-form-item>
				<a-form-item label="物流公司编码">
					<a-input v-model:value="shipForm.shipper_code" placeholder="可选，留空时尝试自动识别" :maxlength="40" />
				</a-form-item>
				<a-form-item label="物流公司名称">
					<a-input v-model:value="shipForm.shipper_name" placeholder="可选，例如顺丰速运" :maxlength="80" />
				</a-form-item>
				<a-form-item label="备注">
					<a-textarea v-model:value="shipForm.remark" :rows="3" placeholder="可选" :maxlength="255" />
				</a-form-item>
			</a-form>
		</a-modal>
	</div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import dayjs from 'dayjs'
import { message } from 'ant-design-vue'
import {
	getAdminOrderDetail,
	getAdminOrderList,
	queryAdminOrderLogistics,
	refundAdminOrder,
	shipAdminOrder,
	syncAdminOrderPayment,
} from '@/api/order'
import customerServiceQr from '@/assets/customer-service-qq-qr.jpg'

const loading = ref(false)
const detailLoading = ref(false)
const syncingOrderId = ref<number | null>(null)
const refundVisible = ref(false)
const refunding = ref(false)
const refundTarget = ref<any>(null)
const refundRemark = ref('')
const contactServiceVisible = ref(false)
const customerServiceQq = '2705208065'
const shipVisible = ref(false)
const shipping = ref(false)
const shipTarget = ref<any>(null)
const logisticsQueryingId = ref<number | null>(null)
const shipForm = ref({
	tracking_no: '',
	shipper_code: '',
	shipper_name: '',
	remark: '',
})
const dataSource = ref<any[]>([])
const detailVisible = ref(false)
const currentRecord = ref<any>(null)

const searchForm = ref({
	keyword: '',
	status: undefined as string | undefined,
	order_type: undefined as string | undefined,
	content_type: undefined as string | undefined,
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
	{ title: '发货状态', key: 'delivery', width: 150 },
	{ title: '售后原因', key: 'afterSale', width: 220 },
	{ title: '下单时间', key: 'createTime', width: 170 },
	{ title: '支付时间', key: 'paidTime', width: 170 },
	{ title: '操作', key: 'action', width: 240, fixed: 'right' as const },
]

const cartColumns = [
	{ title: '课程ID', dataIndex: 'courseId', key: 'courseId', width: 100 },
	{ title: '课程名称', dataIndex: 'name', key: 'name' },
	{ title: '类型', key: 'contentType', width: 110 },
	{ title: '价格', key: 'price', width: 100 },
]

const getCartItemTypeLabel = (contentType?: string) => {
	if (contentType === 'file') return '文件课程'
	if (contentType === 'paper_exam') return '纸质真题'
	return '普通题库'
}

const formatShippingAddress = (address: any) => {
	if (!address) return '-'
	const detail = [address.province, address.city, address.district, address.detail].filter(Boolean).join('')
	return detail || address.fullAddress || '-'
}

const isPaperShippingOrder = (record: any) => {
	return Boolean(
		record?.requiresShipping ||
		record?.contentType === 'paper_exam' ||
		record?.cartItems?.some((item: any) => item.contentType === 'paper_exam')
	)
}

const canShipOrder = (record: any) => record?.status === 'paid' && isPaperShippingOrder(record)

const fetchData = async () => {
	loading.value = true
	try {
		const res = await getAdminOrderList({
			page: pagination.value.current,
			pageSize: pagination.value.pageSize,
			keyword: searchForm.value.keyword || undefined,
			status: searchForm.value.status,
			order_type: searchForm.value.order_type,
			content_type: searchForm.value.content_type,
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
		content_type: undefined,
	}
	pagination.value.current = 1
	fetchData()
}

const handleTableChange = (pager: any) => {
	pagination.value.current = pager.current
	pagination.value.pageSize = pager.pageSize
	fetchData()
}

const showAfterSaleDetail = (record: any) => {
	return record?.status === 'after_sale' || Boolean(record?.afterSale)
}

const handleViewDetail = async (record: any) => {
	currentRecord.value = record
	detailVisible.value = true
	detailLoading.value = true
	try {
		const res = await getAdminOrderDetail(record.id)
		if (res.data) {
			currentRecord.value = res.data
		}
	} catch (error: any) {
		message.error(error?.message || '获取订单详情失败')
	} finally {
		detailLoading.value = false
	}
}

const openCustomerServiceModal = () => {
	contactServiceVisible.value = true
}

const handleCopyCustomerServiceContact = async () => {
	try {
		if (navigator?.clipboard?.writeText) {
			await navigator.clipboard.writeText(customerServiceQq)
		} else {
			const textarea = document.createElement('textarea')
			textarea.value = customerServiceQq
			textarea.style.position = 'fixed'
			textarea.style.opacity = '0'
			document.body.appendChild(textarea)
			textarea.select()
			document.execCommand('copy')
			document.body.removeChild(textarea)
		}
		message.success('QQ号已复制')
	} catch (error) {
		console.warn('复制客服 QQ 失败:', error)
		message.error('复制失败，请手动复制 2705208065')
	}
}

const openRefundModal = (record: any) => {
	refundTarget.value = record
	refundRemark.value = ''
	refundVisible.value = true
}

const openShipModal = (record: any) => {
	shipTarget.value = record
	shipForm.value = {
		tracking_no: record?.trackingNo || '',
		shipper_code: record?.shipperCode || '',
		shipper_name: record?.shipperName || '',
		remark: record?.shipmentRemark || '',
	}
	shipVisible.value = true
}

const refreshRecordAfterShipment = async (orderId: number) => {
	await fetchData()
	if (currentRecord.value?.id === orderId) {
		const res = await getAdminOrderDetail(orderId)
		currentRecord.value = res.data || currentRecord.value
	}
}

const handleConfirmShip = async () => {
	if (!shipTarget.value) return
	const trackingNo = shipForm.value.tracking_no.trim()
	if (!trackingNo) {
		message.warning('请输入物流运单号')
		return
	}

	shipping.value = true
	try {
		const res = await shipAdminOrder(shipTarget.value.id, {
			tracking_no: trackingNo,
			shipper_code: shipForm.value.shipper_code.trim() || undefined,
			shipper_name: shipForm.value.shipper_name.trim() || undefined,
			remark: shipForm.value.remark.trim() || undefined,
		})
		const logistics = res.data?.logistics
		if (logistics?.configured === false) {
			message.info(logistics.message || '发货信息已保存，物流查询 API 未配置')
		} else if (logistics?.success === false) {
			message.warning(logistics.reason || logistics.message || '发货信息已保存，物流查询暂未成功')
		} else {
			message.success(res.data?.message || '发货信息已保存')
		}
		shipVisible.value = false
		await refreshRecordAfterShipment(shipTarget.value.id)
	} catch (error: any) {
		message.error(error?.message || '保存发货信息失败')
	} finally {
		shipping.value = false
	}
}

const handleQueryLogistics = async (record: any) => {
	if (!record?.id || !record.trackingNo) return
	logisticsQueryingId.value = record.id
	try {
		const res = await queryAdminOrderLogistics(record.id)
		const logistics = res.data
		if (logistics?.configured === false) {
			message.info(logistics.message || '快递鸟 API 未配置')
		} else if (logistics?.success === false) {
			message.warning(logistics.reason || logistics.message || '物流查询失败')
		} else {
			message.success('物流信息已更新')
		}
		await refreshRecordAfterShipment(record.id)
	} catch (error: any) {
		message.error(error?.message || '查询物流失败')
	} finally {
		logisticsQueryingId.value = null
	}
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
		console.warn('退款失败:', error?.message || error)
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

const getOrderTypeLabel = (type?: string) => {
	const map: Record<string, string> = {
		course: '课程',
		package: '套餐',
		category: '分类合集',
	}
	return map[type || 'course'] || type || '课程'
}

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

const getDeliveryStatusLabel = (status?: string) => {
	const map: Record<string, string> = {
		pending: '待发货',
		shipped: '已发货',
	}
	return map[status || 'pending'] || status || '待发货'
}

const getDeliveryStatusColor = (status?: string) => {
	const map: Record<string, string> = {
		pending: 'orange',
		shipped: 'green',
	}
	return map[status || 'pending'] || 'default'
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

.section-title-row {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 12px;
	margin-bottom: 12px;
}

.after-sale-detail {
	margin-top: 20px;
}

.shipment-detail {
	margin-top: 20px;
}

.shipment-alert {
	margin-bottom: 12px;
}

.logistics-traces {
	margin-top: 12px;
}

.trace-text {
	color: #111827;
	line-height: 1.6;
	word-break: break-word;
}

.after-sale-description {
	white-space: pre-wrap;
	word-break: break-word;
	line-height: 1.6;
}

.customer-service-qr {
	display: flex;
	justify-content: center;
	margin-bottom: 16px;
}

.customer-service-qr img {
	width: 220px;
	max-width: 100%;
	border-radius: 8px;
	border: 1px solid #f0f0f0;
}
</style>
