<template>
	<div class="points-config">
		<a-alert
			type="info"
			show-icon
			message="配置积分规则：刷题打卡成功后发放积分；用户可在积分商城用积分兑换无门槛/有门槛优惠券。"
			class="config-tip"
		/>

		<a-form layout="vertical" style="max-width: 520px; margin-top: 16px">
			<a-form-item label="启用积分系统">
				<a-switch v-model:checked="form.enabled" />
			</a-form-item>
			<a-form-item label="打卡奖励积分">
				<a-input-number v-model:value="form.checkin_reward" :min="0" :precision="0" style="width: 100%" />
			</a-form-item>
			<a-form-item label="兑换所需积分">
				<a-input-number v-model:value="form.exchange_points" :min="1" :precision="0" style="width: 100%" />
			</a-form-item>
			<a-form-item label="兑换优惠券面额（元）">
				<a-input-number v-model:value="form.exchange_coupon_amount" :min="1" :step="1" :precision="0" style="width: 100%" />
			</a-form-item>
			<a-form-item label="兑换券使用门槛（元）" extra="0 表示无门槛">
				<a-input-number v-model:value="form.exchange_coupon_min_amount" :min="0" :step="0.01" :precision="2" style="width: 100%" />
			</a-form-item>
			<a-form-item label="兑换券有效天数（留空表示永久）">
				<a-input-number v-model:value="form.coupon_valid_days" :min="1" style="width: 100%" placeholder="例如 365" />
			</a-form-item>
			<a-form-item>
				<a-button type="primary" :loading="saving" @click="save">保存配置</a-button>
			</a-form-item>
		</a-form>
	</div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { message } from 'ant-design-vue'
import { getPointsConfig, setPointsConfig } from '@/api/system'

const saving = ref(false)
const form = reactive({
	enabled: true,
	checkin_reward: 50,
	exchange_points: 500,
	exchange_coupon_amount: 5,
	exchange_coupon_min_amount: 0,
	coupon_valid_days: 365 as number | null,
})

const load = async () => {
	try {
		const res = await getPointsConfig()
		Object.assign(form, res.data || {})
	} catch {
		message.error('获取积分配置失败')
	}
}

const save = async () => {
	saving.value = true
	try {
		await setPointsConfig({ ...form })
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
</style>
