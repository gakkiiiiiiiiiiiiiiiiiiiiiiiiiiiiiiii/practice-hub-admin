<template>
	<a-modal
		:open="open"
		title="赠送积分"
		width="500px"
		:confirm-loading="loading"
		ok-text="确认赠送"
		@cancel="handleCancel"
		@ok="handleSubmit"
	>
		<a-alert
			v-if="presetUser"
			type="info"
			show-icon
			:message="`将积分赠送给 ${presetUser.nickname || '未设置'}（用户 ID：${presetUser.id}）`"
			style="margin-bottom: 20px"
		/>
		<a-form ref="formRef" :model="formState" :rules="rules" layout="vertical">
			<a-form-item label="赠送积分" name="amount">
				<a-input-number
					v-model:value="formState.amount"
					:min="1"
					:max="1000000"
					:precision="0"
					style="width: 100%"
				/>
			</a-form-item>
			<a-form-item label="备注" name="remark" extra="将记录在该用户的积分流水中">
				<a-textarea
					v-model:value="formState.remark"
					:maxlength="255"
					:auto-size="{ minRows: 2, maxRows: 4 }"
					placeholder="例如：活动奖励"
					show-count
				/>
			</a-form-item>
		</a-form>
	</a-modal>
</template>

<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import { message } from 'ant-design-vue'
import { grantAppUserPoints } from '@/api/user'

interface PresetUser {
	id: number
	nickname?: string
}

const props = defineProps<{
	open: boolean
	presetUser?: PresetUser | null
}>()

const emit = defineEmits<{
	(e: 'update:open', value: boolean): void
	(e: 'success'): void
}>()

const formRef = ref()
const loading = ref(false)
const formState = reactive({ amount: 100, remark: '' })
const rules = {
	amount: [{ required: true, message: '请输入赠送积分', trigger: 'blur' }],
}

watch(
	() => props.open,
	(value) => {
		if (value) {
			formState.amount = 100
			formState.remark = ''
		}
	},
)

const handleCancel = () => emit('update:open', false)

const handleSubmit = async () => {
	try {
		await formRef.value?.validate()
	} catch {
		return
	}
	if (!props.presetUser?.id) {
		message.warning('未找到目标用户')
		return
	}

	loading.value = true
	try {
		const res = await grantAppUserPoints(props.presetUser.id, {
			amount: formState.amount,
			remark: formState.remark.trim() || undefined,
		})
		message.success(`赠送成功，当前积分 ${res.data?.pointsBalance ?? '-'}`)
		emit('success')
		emit('update:open', false)
	} catch (error: any) {
		message.error(error?.message || '赠送失败')
	} finally {
		loading.value = false
	}
}
</script>
