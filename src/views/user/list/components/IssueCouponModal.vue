<template>
	<a-modal
		:open="open"
		title="发放优惠券"
		width="520px"
		:confirm-loading="loading"
		@cancel="handleCancel"
		@ok="handleSubmit"
	>
		<a-form ref="formRef" :model="formState" :rules="rules" layout="vertical">
			<a-form-item v-if="presetUser" label="目标用户">
				<a-input :value="`${presetUser.nickname || '未设置'}（ID: ${presetUser.id}）`" disabled />
			</a-form-item>
			<a-form-item v-else label="目标用户" name="user_id">
				<a-select
					v-model:value="formState.user_id"
					show-search
					placeholder="搜索昵称或 OpenID"
					:filter-option="false"
					:not-found-content="userSearching ? undefined : null"
					:options="userOptions"
					@search="handleSearchUser"
				>
					<template v-if="userSearching" #notFoundContent>
						<a-spin size="small" />
					</template>
				</a-select>
			</a-form-item>
			<a-form-item label="优惠券面额（元）" name="amount">
				<a-input-number v-model:value="formState.amount" :min="1" :step="1" :precision="0" style="width: 100%" />
			</a-form-item>
			<a-form-item label="使用门槛（元）" name="min_amount" extra="0 表示无门槛，支持小数">
				<a-input-number v-model:value="formState.min_amount" :min="0" :step="0.01" :precision="2" style="width: 100%" />
			</a-form-item>
			<a-form-item label="发放张数" name="count">
				<a-input-number v-model:value="formState.count" :min="1" :max="50" style="width: 100%" />
			</a-form-item>
			<a-form-item label="有效天数" name="valid_days" extra="留空表示长期有效">
				<a-input-number v-model:value="formState.valid_days" :min="1" style="width: 100%" placeholder="例如 365" />
			</a-form-item>
		</a-form>
	</a-modal>
</template>

<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import { message } from 'ant-design-vue'
import { getAppUserList } from '@/api/user'
import { issueCouponToUser } from '@/api/coupon'

interface PresetUser {
	id: number
	nickname?: string
	openId?: string
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
const userSearching = ref(false)
const userOptions = ref<Array<{ value: number; label: string }>>([])

const formState = reactive({
	user_id: undefined as number | undefined,
	amount: 5,
	min_amount: 0,
	count: 1,
	valid_days: 365 as number | null,
})

const rules = {
	user_id: [{ required: true, message: '请选择目标用户', trigger: 'change' }],
	amount: [{ required: true, message: '请输入优惠券面额', trigger: 'blur' }],
	count: [{ required: true, message: '请输入发放张数', trigger: 'blur' }],
}

const resetForm = () => {
	formState.user_id = props.presetUser?.id
	formState.amount = 5
	formState.min_amount = 0
	formState.count = 1
	formState.valid_days = 365
	userOptions.value = props.presetUser
		? [
				{
					value: props.presetUser.id,
					label: `${props.presetUser.nickname || '未设置'}（${props.presetUser.openId || `ID:${props.presetUser.id}`}）`,
				},
			]
		: []
}

watch(
	() => props.open,
	(value) => {
		if (value) {
			resetForm()
		}
	},
)

const handleSearchUser = async (keyword: string) => {
	if (!keyword?.trim()) {
		userOptions.value = []
		return
	}
	userSearching.value = true
	try {
		const res = await getAppUserList({ page: 1, pageSize: 20, keyword: keyword.trim() })
		userOptions.value = (res.data?.list || []).map((item: any) => ({
			value: item.id,
			label: `${item.nickname || '未设置'}（${item.openId || `ID:${item.id}`}）`,
		}))
	} catch {
		userOptions.value = []
	} finally {
		userSearching.value = false
	}
}

const handleCancel = () => {
	emit('update:open', false)
}

const handleSubmit = async () => {
	try {
		await formRef.value?.validate()
	} catch {
		return
	}

	const userId = props.presetUser?.id ?? formState.user_id
	if (!userId) {
		message.warning('请选择目标用户')
		return
	}

	loading.value = true
	try {
		await issueCouponToUser({
			user_id: userId,
			amount: formState.amount,
			min_amount: formState.min_amount ?? 0,
			count: formState.count,
			valid_days: formState.valid_days ?? null,
		})
		message.success('发放成功')
		emit('success')
		emit('update:open', false)
	} catch (error: any) {
		message.error(error?.message || '发放失败')
	} finally {
		loading.value = false
	}
}
</script>
