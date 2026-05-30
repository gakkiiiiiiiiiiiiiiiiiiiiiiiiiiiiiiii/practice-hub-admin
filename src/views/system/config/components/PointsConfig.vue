<template>
	<div class="points-config">
		<a-alert
			type="info"
			show-icon
			message="配置积分规则：刷题打卡成功后发放积分；用户可在积分商城用积分兑换多种优惠券。"
			class="config-tip"
		/>

		<a-form layout="vertical" style="max-width: 960px; margin-top: 16px">
			<a-form-item label="启用积分系统">
				<a-switch v-model:checked="form.enabled" />
			</a-form-item>
			<a-form-item label="打卡奖励积分">
				<a-input-number v-model:value="form.checkin_reward" :min="0" :precision="0" style="width: 100%" />
			</a-form-item>
			<a-form-item label="兑换券有效天数（留空表示永久）">
				<a-input-number v-model:value="form.coupon_valid_days" :min="1" style="width: 100%" placeholder="例如 365" />
			</a-form-item>

			<div class="exchange-section">
				<div class="exchange-header">
					<div>
						<div class="exchange-title">可兑换优惠券</div>
						<div class="exchange-desc">可配置多种积分兑换方案，小程序积分商城将展示全部启用项。</div>
					</div>
					<a-button type="dashed" @click="addExchangeItem">添加优惠券</a-button>
				</div>

				<a-table
					:data-source="form.exchange_items"
					:columns="exchangeColumns"
					:pagination="false"
					row-key="id"
					size="middle"
					:scroll="{ x: 900 }"
				>
					<template #bodyCell="{ column, record, index }">
						<template v-if="column.key === 'name'">
							<a-input v-model:value="record.name" placeholder="可选，如新人专享券" />
						</template>
						<template v-else-if="column.key === 'points'">
							<a-input-number v-model:value="record.points" :min="1" :precision="0" style="width: 100%" />
						</template>
						<template v-else-if="column.key === 'coupon_amount'">
							<a-input-number v-model:value="record.coupon_amount" :min="1" :precision="0" style="width: 100%" />
						</template>
						<template v-else-if="column.key === 'coupon_min_amount'">
							<a-input-number
								v-model:value="record.coupon_min_amount"
								:min="0"
								:step="0.01"
								:precision="2"
								style="width: 100%"
							/>
						</template>
						<template v-else-if="column.key === 'sort'">
							<a-input-number v-model:value="record.sort" :min="0" :precision="0" style="width: 100%" />
						</template>
						<template v-else-if="column.key === 'enabled'">
							<a-switch v-model:checked="record.enabled" />
						</template>
						<template v-else-if="column.key === 'action'">
							<a-button type="link" danger :disabled="form.exchange_items.length <= 1" @click="removeExchangeItem(index)">
								删除
							</a-button>
						</template>
					</template>
				</a-table>
			</div>

			<a-form-item style="margin-top: 24px">
				<a-button type="primary" :loading="saving" @click="save">保存配置</a-button>
			</a-form-item>
		</a-form>
	</div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { message } from 'ant-design-vue'
import { getPointsConfig, setPointsConfig } from '@/api/system'

type ExchangeItem = {
	id: string
	name: string
	points: number
	coupon_amount: number
	coupon_min_amount: number
	enabled: boolean
	sort: number
}

const saving = ref(false)
const form = reactive({
	enabled: true,
	checkin_reward: 50,
	coupon_valid_days: 365 as number | null,
	exchange_items: [] as ExchangeItem[],
})

const exchangeColumns = [
	{ title: '名称', key: 'name', width: 180 },
	{ title: '所需积分', key: 'points', width: 120 },
	{ title: '面额（元）', key: 'coupon_amount', width: 120 },
	{ title: '门槛（元）', key: 'coupon_min_amount', width: 120 },
	{ title: '排序', key: 'sort', width: 90 },
	{ title: '启用', key: 'enabled', width: 90 },
	{ title: '操作', key: 'action', width: 90, fixed: 'right' as const },
]

const createExchangeItem = (index = 0): ExchangeItem => ({
	id: `ex_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
	name: '',
	points: 500,
	coupon_amount: 5,
	coupon_min_amount: 0,
	enabled: true,
	sort: index,
})

const normalizeExchangeItems = (items?: ExchangeItem[]) => {
	if (Array.isArray(items) && items.length > 0) {
		return items.map((item, index) => ({
			id: item.id || createExchangeItem(index).id,
			name: item.name || '',
			points: Number(item.points) || 500,
			coupon_amount: Number(item.coupon_amount) || 5,
			coupon_min_amount: Number(item.coupon_min_amount) || 0,
			enabled: item.enabled !== false,
			sort: Number.isFinite(Number(item.sort)) ? Number(item.sort) : index,
		}))
	}
	return [createExchangeItem(0)]
}

const addExchangeItem = () => {
	form.exchange_items.push(createExchangeItem(form.exchange_items.length))
}

const removeExchangeItem = (index: number) => {
	if (form.exchange_items.length <= 1) return
	form.exchange_items.splice(index, 1)
}

const load = async () => {
	try {
		const res = await getPointsConfig()
		const data = res.data || {}
		form.enabled = data.enabled !== false
		form.checkin_reward = data.checkin_reward ?? 50
		form.coupon_valid_days = data.coupon_valid_days ?? 365
		form.exchange_items = normalizeExchangeItems(data.exchange_items)
	} catch {
		message.error('获取积分配置失败')
	}
}

const save = async () => {
	if (!form.exchange_items.length) {
		message.warning('请至少添加一种可兑换优惠券')
		return
	}

	saving.value = true
	try {
		await setPointsConfig({
			enabled: form.enabled,
			checkin_reward: form.checkin_reward,
			coupon_valid_days: form.coupon_valid_days,
			exchange_items: form.exchange_items.map((item, index) => ({
				...item,
				sort: Number.isFinite(Number(item.sort)) ? Number(item.sort) : index,
			})),
		})
		message.success('保存成功')
	} catch {
		message.error('保存失败')
	} finally {
		saving.value = false
	}
}

onMounted(load)
</script>

<style scoped>
.config-tip {
	margin-bottom: 8px;
}

.exchange-section {
	margin-top: 8px;
}

.exchange-header {
	display: flex;
	align-items: flex-start;
	justify-content: space-between;
	gap: 16px;
	margin-bottom: 12px;
}

.exchange-title {
	font-size: 16px;
	font-weight: 600;
	color: rgba(0, 0, 0, 0.88);
}

.exchange-desc {
	margin-top: 4px;
	font-size: 13px;
	color: rgba(0, 0, 0, 0.45);
}
</style>
