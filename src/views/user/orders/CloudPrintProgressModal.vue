<template>
	<a-modal
		:open="open"
		:title="`云打印进度 · ${orderNo || '-'}`"
		width="820px"
		:footer="null"
		@cancel="emit('update:open', false)"
	>
		<div class="progress-modal">
			<div class="status-row">
				<a-space wrap>
					<a-tag :color="statusColor">{{ statusLabel }}</a-tag>
					<span class="sync-hint"><span class="sync-dot" />每 2 秒自动同步本地任务状态</span>
				</a-space>
				<span class="updated-at">更新于 {{ formatTime(job?.updatedAt) }}</span>
			</div>

			<a-steps :current="currentStep" :status="stepStatus" size="small" :items="stepItems" />

			<a-alert
				v-if="job?.lastError"
				:type="job?.status === 'awaiting_confirm' ? 'info' : 'error'"
				show-icon
				:message="job.lastError"
			/>

			<a-descriptions bordered size="small" :column="2">
				<a-descriptions-item label="文件批次号" :span="2">
					{{ job?.externalPackageId || '-' }}
				</a-descriptions-item>
				<a-descriptions-item label="刺猬云订单号" :span="2">
					{{ job?.externalOrderId || '-' }}
				</a-descriptions-item>
				<a-descriptions-item label="执行次数">
					{{ job ? `${job.attempts || 0} / ${job.maxAttempts || 0}` : '-' }}
				</a-descriptions-item>
				<a-descriptions-item label="触发方式">
					{{ job?.triggerType === 'automatic' ? '自动' : '手动' }}
				</a-descriptions-item>
				<a-descriptions-item v-if="job?.quote" label="打印费">
					¥{{ formatAmount(job.quote.printAmountCents) }}
				</a-descriptions-item>
				<a-descriptions-item v-if="job?.quote" label="运费">
					¥{{ formatAmount(job.quote.shippingAmountCents) }}
				</a-descriptions-item>
				<a-descriptions-item v-if="job?.quote" label="预估合计" :span="2">
					<strong>¥{{ formatAmount(job.quote.totalAmountCents) }}</strong>
				</a-descriptions-item>
			</a-descriptions>

			<div class="section-heading">
				<div>
					<div class="section-title">刺猬云接口记录</div>
					<div class="section-description">按调用顺序保存完整业务请求参数与原始响应，认证签名不会记录。</div>
				</div>
				<a-tag>{{ providerResponses.length }} 次调用</a-tag>
			</div>

			<a-empty v-if="!providerResponses.length && !providerCallbacks.length" description="暂无接口记录" />
			<a-collapse v-else class="audit-list">
				<a-collapse-panel
					v-for="(item, index) in providerResponses"
					:key="`response-${index}`"
					:header="`${index + 1}. ${item.method || '-'} ${item.path || '-'}`"
				>
					<template #extra>
						<a-tag :color="httpStatusColor(item.httpStatus)" @click.stop>
							{{ item.httpStatus || '网络错误' }}
						</a-tag>
					</template>
					<div class="audit-meta">{{ formatTime(item.respondedAt || item.requestedAt) }}</div>
					<div class="json-label">完整请求参数</div>
					<pre class="json-view">{{ formatJson(item.requestBody) }}</pre>
					<div class="json-label">完整响应参数</div>
					<pre class="json-view">{{ formatJson({ httpStatus: item.httpStatus, headers: item.headers, body: item.body, transportError: item.transportError }) }}</pre>
				</a-collapse-panel>
			</a-collapse>

			<a-collapse v-if="providerCallbacks.length" class="audit-list">
				<a-collapse-panel
					v-for="(item, index) in providerCallbacks"
					:key="`callback-${index}`"
					:header="`回调 ${index + 1} · ${formatTime(item.receivedAt)}`"
				>
					<pre class="json-view">{{ formatJson(item.body) }}</pre>
				</a-collapse-panel>
			</a-collapse>

			<div class="modal-actions">
				<a-button @click="emit('update:open', false)">关闭</a-button>
				<a-button v-if="canRetry" :loading="loading" @click="emit('retry')">继续获取报价</a-button>
				<a-button v-if="canConfirm" type="primary" danger :loading="loading" @click="emit('confirm')">
					确认金额并下单
				</a-button>
			</div>
		</div>
	</a-modal>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import dayjs from 'dayjs'

const props = defineProps<{
	open: boolean
	orderNo?: string
	job?: any
	loading?: boolean
}>()

const emit = defineEmits<{
	'update:open': [value: boolean]
	retry: []
	confirm: []
}>()

const statusLabels: Record<string, string> = {
	pending: '待处理', processing: '处理中', submitting: '提交中·待核对', waiting_files: '文件处理中',
	awaiting_confirm: '待确认金额', retryable_failed: '可重试', review_required: '待人工核对',
	submitted: '已提交', refund_reserved: '退款已预留', cancelled: '已取消',
}

const statusColors: Record<string, string> = {
	pending: 'orange', processing: 'blue', submitting: 'red', waiting_files: 'cyan', awaiting_confirm: 'gold',
	retryable_failed: 'orange', review_required: 'red', submitted: 'green', refund_reserved: 'default', cancelled: 'default',
}

const providerResponses = computed<any[]>(() => props.job?.providerResponses || [])
const providerCallbacks = computed<any[]>(() => props.job?.providerCallbacks || [])
const statusLabel = computed(() => statusLabels[props.job?.status] || (props.job ? props.job.status : '准备创建'))
const statusColor = computed(() => statusColors[props.job?.status] || 'default')
const canRetry = computed(() => ['pending', 'waiting_files', 'retryable_failed', 'cancelled'].includes(props.job?.status || 'pending'))
const canConfirm = computed(() => props.job?.status === 'awaiting_confirm' && Boolean(props.job?.quote))

const currentStep = computed(() => {
	const status = props.job?.status
	if (status === 'submitted') return 3
	if (['submitting', 'review_required'].includes(status)) return 3
	if (['awaiting_confirm', 'retryable_failed'].includes(status)) return 2
	if (status === 'waiting_files') return 1
	return 0
})

const stepStatus = computed(() => ['retryable_failed', 'review_required'].includes(props.job?.status) ? 'error' : 'process')
const stepItems = [
	{ title: '创建任务', description: '锁定订单与文件' },
	{ title: '处理文件', description: '上传并等待解析' },
	{ title: '获取报价', description: '打印费与运费' },
	{ title: '提交生产', description: '需人工确认金额' },
]

const formatAmount = (value: number | string) => (Number(value || 0) / 100).toFixed(2)
const formatTime = (value?: string) => value ? dayjs(value).format('YYYY-MM-DD HH:mm:ss') : '-'
const formatJson = (value: unknown) => JSON.stringify(value ?? null, null, 2)
const httpStatusColor = (status?: number) => !status ? 'red' : status >= 400 ? 'red' : 'green'
</script>

<style scoped>
.progress-modal { display: grid; gap: 20px; }
.status-row, .section-heading, .modal-actions { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.sync-hint, .updated-at, .section-description, .audit-meta { color: rgba(0, 0, 0, 0.45); font-size: 12px; }
.sync-dot { display: inline-block; width: 7px; height: 7px; margin-right: 6px; border-radius: 50%; background: #52c41a; box-shadow: 0 0 0 3px rgba(82, 196, 26, 0.16); }
.section-title { font-weight: 600; }
.section-description { margin-top: 3px; }
.audit-list + .audit-list { margin-top: -12px; }
.audit-meta { margin-bottom: 12px; }
.json-label { margin: 12px 0 6px; font-size: 12px; font-weight: 600; }
.json-view { max-height: 300px; margin: 0; padding: 12px; overflow: auto; border-radius: 6px; background: #f6f8fa; color: #24292f; font: 12px/1.55 ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; white-space: pre-wrap; word-break: break-all; }
.modal-actions { justify-content: flex-end; padding-top: 4px; }
@media (max-width: 720px) { .status-row, .section-heading { align-items: flex-start; flex-direction: column; } }
</style>
