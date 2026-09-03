<template>
	<div class="payment-bills">
		<a-card>
			<template #title>支付账单</template>
			<template #extra>
				<a-button :loading="loading" @click="loadBills">刷新缓存列表</a-button>
			</template>

			<a-alert
				type="info"
				show-icon
				class="notice"
				message="账单仅在你手动获取时向支付渠道请求；刷新列表只读取已缓存账单。"
			/>
			<a-alert
				type="warning"
				show-icon
				class="notice"
				message="虚拟支付当前提供每日结算汇总，不含逐笔订单；充值与代币消费不可重复计入现金收入。"
			/>

			<a-form layout="vertical" class="filter-form" @finish="handleSearch">
				<a-row :gutter="[16, 8]">
					<a-col :xs="24" :sm="12" :lg="6">
						<a-form-item label="支付渠道">
							<a-select v-model:value="filters.channel" allow-clear placeholder="全部渠道">
								<a-select-option value="wechat">微信支付</a-select-option>
								<a-select-option value="xpay">虚拟支付</a-select-option>
							</a-select>
						</a-form-item>
					</a-col>
					<a-col :xs="24" :sm="12" :lg="8">
						<a-form-item label="账单日期范围">
							<a-range-picker
								v-model:value="filters.dateRange"
								format="YYYY-MM-DD"
								:disabled-date="isFutureDate"
								:placeholder="['开始日期', '结束日期']"
								style="width: 100%"
							/>
						</a-form-item>
					</a-col>
					<a-col :xs="24" :sm="24" :lg="10" class="filter-actions">
						<a-form-item label=" ">
							<a-space wrap>
								<a-button type="primary" html-type="submit">查询缓存</a-button>
								<a-button @click="resetFilters">重置</a-button>
							</a-space>
						</a-form-item>
					</a-col>
				</a-row>
			</a-form>

			<div class="fetch-panel">
				<div>
					<div class="fetch-panel-title">手动获取单日官方账单</div>
					<div class="sub-text">默认昨天；仅此操作会发起渠道请求，处理中请稍后手动刷新或再次查询。</div>
				</div>
				<a-space wrap>
					<a-select v-model:value="fetchForm.channel" style="width: 136px">
						<a-select-option value="wechat">微信支付</a-select-option>
						<a-select-option value="xpay">虚拟支付</a-select-option>
					</a-select>
					<a-date-picker
						v-model:value="fetchForm.billDate"
						format="YYYY-MM-DD"
						:disabled-date="isFetchDateOutOfRange"
						:allow-clear="false"
					/>
					<a-button type="primary" :loading="fetching" @click="handleFetch()">获取账单</a-button>
				</a-space>
			</div>

			<a-table
				:columns="columns"
				:data-source="bills"
				:loading="loading"
				:pagination="pagination"
				:scroll="{ x: 1320 }"
				row-key="id"
				@change="handleTableChange"
			>
				<template #bodyCell="{ column, record }">
					<template v-if="column.key === 'channel'">
						<a-tag :color="record.channel === 'wechat' ? 'green' : 'blue'">
							{{ getChannelLabel(record.channel) }}
						</a-tag>
					</template>
					<template v-else-if="column.key === 'status'">
						<a-tag :color="getStatusColor(record.status)">{{ getStatusLabel(record.status) }}</a-tag>
						<div v-if="record.retryAfter" class="sub-text">{{ getRetryText(record.retryAfter) }}</div>
					</template>
					<template v-else-if="column.key === 'summary'">
						<div>{{ formatSummary(record.summary, record.rowCount) }}</div>
						<div v-if="record.notice" class="sub-text notice-text">{{ record.notice }}</div>
					</template>
					<template v-else-if="column.key === 'size'">
						{{ formatSize(record.originalSize) }}
					</template>
					<template v-else-if="column.key === 'fetchedAt'">
						{{ formatTime(record.fetchedAt) }}
					</template>
					<template v-else-if="column.key === 'action'">
						<a-space wrap>
							<a-button
								v-if="record.previewSupported && record.status === 'ready'"
								type="link"
								size="small"
								@click="openPreview(record)"
							>
								预览
							</a-button>
							<a-button
								v-if="record.status === 'ready'"
								type="link"
								size="small"
								:loading="downloadingKey === `${record.id}-original`"
								@click="handleDownload(record, 'original')"
							>
								原始账单
							</a-button>
							<a-button
								v-if="record.previewSupported && record.status === 'ready'"
								type="link"
								size="small"
								:loading="downloadingKey === `${record.id}-xlsx`"
								@click="handleDownload(record, 'xlsx')"
							>
								导出 Excel
							</a-button>
							<a-button
								v-if="canManuallyRetry(record)"
								type="link"
								size="small"
								:disabled="isRetryBlocked(record)"
								:loading="fetchingRecordKey === `${record.channel}-${record.billDate}`"
								@click="handleFetch(record.channel, record.billDate, false)"
							>
								{{ record.status === 'pending' ? '手动查询' : '手动重试' }}
							</a-button>
						</a-space>
						<div v-if="record.status === 'failed' && record.errorMessage" class="error-text">
							{{ record.errorMessage }}
						</div>
						<div v-else-if="record.status === 'ready' && !record.previewSupported" class="sub-text">
							当前格式只支持原始下载
						</div>
					</template>
				</template>
			</a-table>
		</a-card>

		<a-drawer v-model:open="previewVisible" placement="right" width="min(1000px, 94vw)" :title="previewTitle">
			<a-spin :spinning="previewLoading">
				<a-alert
					v-if="previewNotice"
					type="info"
					show-icon
					:message="previewNotice"
					style="margin-bottom: 16px"
				/>
				<a-empty v-if="!previewLoading && !previewSupported" description="该账单格式暂不支持页面预览，请下载原始账单查看。" />
				<a-table
					v-else-if="previewSupported"
					:columns="previewColumns"
					:data-source="previewRows"
					:pagination="previewPagination"
					:scroll="{ x: 'max-content' }"
					row-key="previewRowKey"
					:size="'small'"
					@change="handlePreviewTableChange"
				>
					<template #bodyCell="{ column, record }">
						<template v-if="column.key === '__matchedOrders'">
							<a-space v-if="record.matchedOrders?.length" wrap>
								<a-tag v-for="order in record.matchedOrders" :key="`${order.id}-${order.matchType}`" color="blue">
									{{ order.orderNo }} · {{ order.matchType }}
								</a-tag>
							</a-space>
							<span v-else class="sub-text">未匹配</span>
						</template>
						<template v-else>{{ record.cells?.[column.key] || '-' }}</template>
					</template>
				</a-table>
			</a-spin>
		</a-drawer>
	</div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import dayjs, { type Dayjs } from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import { message } from 'ant-design-vue'
import {
	downloadPaymentBill,
	fetchPaymentBill,
	getPaymentBillList,
	getPaymentBillPreview,
	type PaymentBillChannel,
	type PaymentBillPreviewColumn,
	type PaymentBillPreviewResponse,
	type PaymentBillRecord,
	type PaymentBillStatus,
} from '@/api/payment-bill'
import {
	getFetchFeedback,
	getPaymentBillDownloadFileName,
	supportsOrderMatching,
} from './payment-bill-model'

dayjs.extend(utc)
dayjs.extend(timezone)

const SHANGHAI_TIME_ZONE = 'Asia/Shanghai'
const shanghaiNow = () => dayjs().tz(SHANGHAI_TIME_ZONE)
const yesterday = () => shanghaiNow().subtract(1, 'day').startOf('day')
const maxBillHistory = () => shanghaiNow().subtract(90, 'day').startOf('day')
const toShanghaiBillDate = (value: Dayjs) => value.tz(SHANGHAI_TIME_ZONE, true).format('YYYY-MM-DD')
const parseShanghaiBillDate = (value: string) => dayjs.tz(value, 'YYYY-MM-DD', SHANGHAI_TIME_ZONE)

const loading = ref(false)
const fetching = ref(false)
const fetchingRecordKey = ref<string | null>(null)
const downloadingKey = ref<string | null>(null)
const bills = ref<PaymentBillRecord[]>([])
const filters = ref({
	channel: undefined as PaymentBillChannel | undefined,
	dateRange: [yesterday().subtract(29, 'day'), yesterday()] as [Dayjs, Dayjs],
})
const fetchForm = ref({
	channel: 'wechat' as PaymentBillChannel,
	billDate: yesterday(),
})
const pagination = ref({
	current: 1,
	pageSize: 20,
	total: 0,
	showSizeChanger: true,
	showTotal: (total: number) => `共 ${total} 条`,
})

const previewVisible = ref(false)
const previewLoading = ref(false)
const previewBill = ref<PaymentBillRecord | null>(null)
const previewColumns = ref<PaymentBillPreviewColumn[]>([])
const previewRows = ref<PaymentBillPreviewResponse['rows']>([])
const previewSupported = ref(false)
const previewNotice = ref<string | null>(null)
const previewPagination = ref({
	current: 1,
	pageSize: 50,
	total: 0,
	showSizeChanger: true,
	showTotal: (total: number) => `共 ${total} 条`,
})
let listRequestId = 0
let previewRequestId = 0

const columns = [
	{ title: '账单日期', dataIndex: 'billDate', key: 'billDate', width: 120 },
	{ title: '渠道', key: 'channel', width: 120 },
	{ title: '状态', key: 'status', width: 150 },
	{ title: '账单摘要', key: 'summary', width: 260 },
	{ title: '原始文件', key: 'size', width: 120 },
	{ title: '获取时间', key: 'fetchedAt', width: 170 },
	{ title: '操作', key: 'action', width: 310, fixed: 'right' as const },
]

const previewTitle = computed(() => {
	if (!previewBill.value) return '账单预览'
	return `${getChannelLabel(previewBill.value.channel)} · ${previewBill.value.billDate}`
})

const previewRowKey = (record: PaymentBillPreviewResponse['rows'][number], index: number) => {
	return `${previewBill.value?.id || 'bill'}-${index}-${JSON.stringify(record.cells)}`
}

const isFutureDate = (date: Dayjs) => date.isAfter(yesterday(), 'day')
const isFetchDateOutOfRange = (date: Dayjs) => {
	const billDate = toShanghaiBillDate(date)
	return billDate > toShanghaiBillDate(yesterday()) || billDate < toShanghaiBillDate(maxBillHistory())
}

const getChannelLabel = (channel: PaymentBillChannel) => (channel === 'wechat' ? '微信支付' : '虚拟支付')

const getStatusLabel = (status: PaymentBillStatus) => ({
	fetching: '获取中',
	pending: '待生成',
	ready: '已就绪',
	empty: '暂无账单',
	failed: '获取失败',
}[status] || status)

const getStatusColor = (status: PaymentBillStatus) => ({
	fetching: 'processing',
	pending: 'warning',
	ready: 'success',
	empty: 'default',
	failed: 'error',
}[status] || 'default')

const formatTime = (value: string | null | undefined) => value ? dayjs(value).format('YYYY-MM-DD HH:mm:ss') : '-'

const formatSize = (bytes: number | null | undefined) => {
	if (bytes == null || bytes < 0) return '-'
	if (bytes < 1024) return `${bytes} B`
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
	return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

const formatSummary = (summary: PaymentBillRecord['summary'], rowCount: number | null) => {
	if (!summary) return rowCount == null ? '-' : `共 ${rowCount} 行`
	const entries = Object.entries(summary)
		.filter(([key]) => /count|rows|scope|description|条数|口径/i.test(key))
		.filter(([, value]) => value !== null && value !== undefined && value !== '')
		.map(([key, value]) => `${key}: ${value}`)
	return entries.join('；') || (rowCount == null ? '-' : `共 ${rowCount} 行`)
}

const getRetryText = (retryAfter: string) => {
	const time = dayjs(retryAfter)
	return time.isAfter(dayjs()) ? `可重试：${time.format('MM-DD HH:mm')}` : '可手动重试'
}

const canManuallyRetry = (record: PaymentBillRecord) => ['pending', 'failed'].includes(record.status)
const isRetryBlocked = (record: PaymentBillRecord) => Boolean(record.retryAfter && dayjs(record.retryAfter).isAfter(dayjs()))

const getDateParams = () => ({
	startDate: filters.value.dateRange?.[0] ? toShanghaiBillDate(filters.value.dateRange[0]) : undefined,
	endDate: filters.value.dateRange?.[1] ? toShanghaiBillDate(filters.value.dateRange[1]) : undefined,
})

const loadBills = async () => {
	const requestId = ++listRequestId
	loading.value = true
	try {
		const res = await getPaymentBillList({
			channel: filters.value.channel,
			...getDateParams(),
			page: pagination.value.current,
			pageSize: pagination.value.pageSize,
		})
		const data = res.data || res
		if (requestId !== listRequestId) return
		bills.value = data.list || []
		pagination.value.total = data.total || 0
		pagination.value.current = data.page || pagination.value.current
		pagination.value.pageSize = data.pageSize || pagination.value.pageSize
	} catch (error) {
		if (requestId !== listRequestId) return
		console.error('获取支付账单缓存列表失败', error)
	} finally {
		if (requestId === listRequestId) loading.value = false
	}
}

const handleSearch = () => {
	pagination.value.current = 1
	loadBills()
}

const resetFilters = () => {
	filters.value = {
		channel: undefined,
		dateRange: [yesterday().subtract(29, 'day'), yesterday()],
	}
	pagination.value.current = 1
	loadBills()
}

const handleTableChange = (pager: { current?: number; pageSize?: number }) => {
	pagination.value.current = pager.current || 1
	pagination.value.pageSize = pager.pageSize || 20
	loadBills()
}

const handleFetch = async (
	channel = fetchForm.value.channel,
	billDate = toShanghaiBillDate(fetchForm.value.billDate),
	isPrimaryFetch = true,
) => {
	const date = parseShanghaiBillDate(billDate)
	if (!date.isValid() || isFetchDateOutOfRange(date)) {
		message.warning('仅支持获取昨天及此前 90 天内的单日账单')
		return
	}
	const recordKey = `${channel}-${date.format('YYYY-MM-DD')}`
	fetchingRecordKey.value = recordKey
	fetching.value = isPrimaryFetch
	try {
		const res = await fetchPaymentBill({ channel, billDate: date.format('YYYY-MM-DD') })
		const data = res.data || res
		if (isPrimaryFetch) {
			filters.value.channel = channel
			filters.value.dateRange = [date, date]
			pagination.value.current = 1
		}
		const feedback = getFetchFeedback(data)
		message[feedback.type](feedback.text)
		await loadBills()
	} catch (error) {
		message.error(await getErrorMessage(error, '获取账单失败'))
	} finally {
		fetching.value = false
		fetchingRecordKey.value = null
	}
}

const openPreview = async (record: PaymentBillRecord) => {
	previewBill.value = record
	previewVisible.value = true
	previewPagination.value.current = 1
	await loadPreview()
}

const loadPreview = async () => {
	if (!previewBill.value) return
	const billId = previewBill.value.id
	const requestId = ++previewRequestId
	previewLoading.value = true
	try {
		const res = await getPaymentBillPreview(previewBill.value.id, {
			page: previewPagination.value.current,
			pageSize: previewPagination.value.pageSize,
		})
		const data = (res.data || res) as PaymentBillPreviewResponse
		if (requestId !== previewRequestId || previewBill.value?.id !== billId) return
		previewSupported.value = data.previewSupported
		previewNotice.value = data.notice || null
		previewRows.value = data.rows || []
		previewColumns.value = [
			...(data.columns || []),
			...(supportsOrderMatching(previewBill.value.channel) ? [{ key: '__matchedOrders', title: '关联业务订单', width: 220 }] : []),
		]
		previewPagination.value.total = data.total || 0
		previewPagination.value.current = data.page || previewPagination.value.current
		previewPagination.value.pageSize = data.pageSize || previewPagination.value.pageSize
	} catch (error) {
		if (requestId !== previewRequestId || previewBill.value?.id !== billId) return
		previewRows.value = []
		previewColumns.value = []
		previewSupported.value = false
		message.error(await getErrorMessage(error, '加载账单预览失败'))
	} finally {
		if (requestId === previewRequestId && previewBill.value?.id === billId) previewLoading.value = false
	}
}

const handlePreviewTableChange = (pager: { current?: number; pageSize?: number }) => {
	previewPagination.value.current = pager.current || 1
	previewPagination.value.pageSize = pager.pageSize || 50
	loadPreview()
}

const handleDownload = async (record: PaymentBillRecord, format: 'original' | 'xlsx') => {
	const key = `${record.id}-${format}`
	downloadingKey.value = key
	try {
		const blob = await downloadPaymentBill(record.id, format)
		const blobError = await parseBlobError(blob)
		if (blobError) throw new Error(blobError)
		const url = URL.createObjectURL(blob)
		const link = document.createElement('a')
		link.href = url
		link.download = getPaymentBillDownloadFileName(record, format)
		document.body.appendChild(link)
		link.click()
		link.remove()
		URL.revokeObjectURL(url)
		message.success('账单下载已开始')
	} catch (error) {
		message.error(await getErrorMessage(error, '账单下载失败'))
	} finally {
		downloadingKey.value = null
	}
}

const parseBlobError = async (blob: Blob) => {
	if (!(blob instanceof Blob) || !blob.type.includes('json')) return null
	try {
		const result = JSON.parse(await blob.text())
		return result?.msg || result?.message || null
	} catch {
		return '下载请求失败'
	}
}

const getErrorMessage = async (error: unknown, fallback: string) => {
	const candidate = error as { message?: string; msg?: string; response?: { data?: unknown } }
	const blobMessage = candidate?.response?.data instanceof Blob
		? await parseBlobError(candidate.response.data)
		: null
	return blobMessage || candidate?.msg || candidate?.message || fallback
}

onMounted(loadBills)
</script>

<style scoped lang="scss">
.notice {
	margin-bottom: 12px;
}

.filter-form {
	margin-top: 20px;
}

.filter-actions {
	display: flex;
	align-items: flex-end;
}

.fetch-panel {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 16px;
	padding: 16px;
	margin-bottom: 16px;
	background: #fafafa;
	border: 1px solid #f0f0f0;
	border-radius: 6px;
}

.fetch-panel-title {
	font-weight: 600;
	margin-bottom: 4px;
}

.sub-text {
	color: rgba(0, 0, 0, 0.45);
	font-size: 12px;
	line-height: 1.5;
}

.notice-text {
	margin-top: 4px;
}

.error-text {
	max-width: 290px;
	margin-top: 4px;
	color: #ff4d4f;
	font-size: 12px;
	word-break: break-word;
}

@media (max-width: 768px) {
	.fetch-panel {
		align-items: flex-start;
		flex-direction: column;
	}

	.fetch-panel :deep(.ant-space) {
		width: 100%;
	}
}
</style>
