<template>
	<div class="referral-coupon-config">
		<a-alert
			type="info"
			show-icon
			message="配置拉新送券规则：邀请指定数量的新用户注册后，邀请人获得优惠券；可设置使用门槛（0 表示无门槛），每人最多可获得指定张数。"
			class="config-tip"
		/>

		<a-form layout="vertical" style="max-width: 520px; margin-top: 16px">
			<a-form-item label="启用拉新送券">
				<a-switch v-model:checked="form.enabled" />
			</a-form-item>
			<a-form-item label="每邀请新用户数（张）">
				<a-input-number v-model:value="form.invite_count_per_reward" :min="1" style="width: 100%" />
			</a-form-item>
			<a-form-item label="优惠券面额（元）">
				<a-input-number v-model:value="form.coupon_amount" :min="1" :step="1" :precision="0" style="width: 100%" />
			</a-form-item>
			<a-form-item label="使用门槛（元）" extra="订单满该金额可用，0 表示无门槛，支持小数">
				<a-input-number v-model:value="form.coupon_min_amount" :min="0" :step="0.01" :precision="2" style="width: 100%" />
			</a-form-item>
			<a-form-item label="每人最多获得张数">
				<a-input-number v-model:value="form.max_coupons_per_user" :min="1" style="width: 100%" />
			</a-form-item>
			<a-form-item label="优惠券有效天数（留空表示长期有效）">
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
import { getReferralCouponConfig, setReferralCouponConfig } from '@/api/system'

const saving = ref(false)
const form = reactive({
	enabled: true,
	invite_count_per_reward: 3,
	coupon_amount: 5,
	coupon_min_amount: 0,
	max_coupons_per_user: 10,
	coupon_valid_days: 365 as number | null,
})

const load = async () => {
	try {
		const res = await getReferralCouponConfig()
		Object.assign(form, res.data || {})
	} catch {
		message.error('获取拉新配置失败')
	}
}

const save = async () => {
	saving.value = true
	try {
		await setReferralCouponConfig({ ...form })
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
