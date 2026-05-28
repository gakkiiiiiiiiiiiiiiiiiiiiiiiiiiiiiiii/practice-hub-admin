<template>
	<div class="vip-section-page">
		<a-card title="套餐管理">
			<template #extra>
				<a-button type="primary" @click="openCreate">新增套餐</a-button>
			</template>

			<a-table :columns="columns" :data-source="list" :loading="loading" row-key="id" :pagination="false">
				<template #bodyCell="{ column, record }">
					<template v-if="column.key === 'status'">
						<a-tag :color="record.status === 1 ? 'green' : 'default'">{{ record.status === 1 ? '启用' : '禁用' }}</a-tag>
					</template>
					<template v-else-if="column.key === 'scopes'">
						<a-tag v-for="scope in record.scopes" :key="scope.id" style="margin-bottom: 4px">
							{{ scopeLabel(scope) }}
						</a-tag>
					</template>
					<template v-else-if="column.key === 'plans'">
						<div v-for="plan in record.plans" :key="plan.id">{{ plan.name }}：¥{{ plan.price }}</div>
					</template>
					<template v-else-if="column.key === 'action'">
						<a-space>
							<a-button type="link" @click="openEdit(record)">编辑</a-button>
							<a-popconfirm title="确认删除该套餐？" @confirm="handleDelete(record.id)">
								<a-button type="link" danger>删除</a-button>
							</a-popconfirm>
						</a-space>
					</template>
				</template>
			</a-table>
		</a-card>

		<a-modal v-model:open="modalVisible" :title="editingId ? '编辑套餐' : '新增套餐'" width="760px" @ok="handleSubmit">
			<a-form layout="vertical">
				<a-row :gutter="16">
					<a-col :span="12">
						<a-form-item label="套餐名称" required>
							<a-input v-model:value="form.name" placeholder="如：政治套餐" />
						</a-form-item>
					</a-col>
					<a-col :span="12">
						<a-form-item label="状态">
							<a-radio-group v-model:value="form.status">
								<a-radio :value="1">启用</a-radio>
								<a-radio :value="0">禁用</a-radio>
							</a-radio-group>
						</a-form-item>
					</a-col>
				</a-row>
				<a-form-item label="套餐描述">
					<a-textarea v-model:value="form.description" :rows="2" />
				</a-form-item>
				<a-form-item label="封面图URL">
					<a-input v-model:value="form.cover_img" placeholder="可选" />
				</a-form-item>

				<a-divider>绑定范围</a-divider>
				<div v-for="(scope, index) in form.scopes" :key="index" class="scope-row">
					<a-select v-model:value="scope.scope_type" style="width: 160px" :options="scopeTypeOptions" />
					<a-input v-model:value="scope.scope_value" style="flex: 1" :placeholder="scopePlaceholder(scope.scope_type)" />
					<a-button danger @click="removeScope(index)">删除</a-button>
				</div>
				<a-button block style="margin-bottom: 16px" @click="addScope">添加绑定</a-button>

				<a-divider>套餐价格</a-divider>
				<a-table :columns="planColumns" :data-source="form.plans" row-key="plan_type" :pagination="false" size="small">
					<template #bodyCell="{ column, record }">
						<template v-if="column.key === 'price'">
							<a-input-number v-model:value="record.price" :min="0" :step="0.1" style="width: 100%" />
						</template>
						<template v-else-if="column.key === 'duration_days'">
							<a-input-number v-model:value="record.duration_days" :min="1" style="width: 100%" />
						</template>
						<template v-else-if="column.key === 'status'">
							<a-switch v-model:checked="record.enabled" />
						</template>
					</template>
				</a-table>
			</a-form>
		</a-modal>
	</div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { message } from 'ant-design-vue'
import { createPackageSection, deletePackageSection, getPackageSectionList, updatePackageSection } from '@/api/package'

const loading = ref(false)
const list = ref<any[]>([])
const modalVisible = ref(false)
const editingId = ref<number | null>(null)

const columns = [
	{ title: '名称', dataIndex: 'name', key: 'name' },
	{ title: '绑定范围', key: 'scopes' },
	{ title: '套餐', key: 'plans' },
	{ title: '状态', key: 'status', width: 90 },
	{ title: '操作', key: 'action', width: 140 },
]

const planColumns = [
	{ title: '套餐', dataIndex: 'name', key: 'name' },
	{ title: '价格(元)', key: 'price', width: 140 },
	{ title: '有效天数', key: 'duration_days', width: 140 },
	{ title: '启用', key: 'status', width: 90 },
]

const scopeTypeOptions = [
	{ label: '指定课程', value: 'course' },
	{ label: '一级分类', value: 'category' },
	{ label: '二级分类', value: 'sub_category' },
]

const defaultPlans = () => [
	{ plan_type: 'monthly', name: '月卡', price: 29.9, duration_days: 30, enabled: true, sort: 1 },
	{ plan_type: 'quarterly', name: '季卡', price: 79.9, duration_days: 90, enabled: true, sort: 2 },
	{ plan_type: 'yearly', name: '年卡', price: 199.9, duration_days: 365, enabled: true, sort: 3 },
]

const form = reactive({
	name: '',
	description: '',
	cover_img: '',
	status: 1,
	sort: 0,
	scopes: [] as Array<{ scope_type: string; scope_value: string }>,
	plans: defaultPlans(),
})

const scopeLabel = (scope: any) => {
	const map: Record<string, string> = {
		course: '课程',
		category: '一级分类',
		sub_category: '二级分类',
	}
	return `${map[scope.scopeType] || scope.scope_type}:${scope.scopeValue || scope.scope_value}`
}

const scopePlaceholder = (type: string) => {
	if (type === 'course') return '课程ID，如 12'
	if (type === 'category') return '一级分类名称，如 考研政治'
	return '二级分类名称，如 真题'
}

const resetForm = () => {
	form.name = ''
	form.description = ''
	form.cover_img = ''
	form.status = 1
	form.sort = 0
	form.scopes = []
	form.plans = defaultPlans()
}

const loadList = async () => {
	loading.value = true
	try {
		const res = await getPackageSectionList()
		list.value = res.data || []
	} catch {
		message.error('加载套餐失败')
	} finally {
		loading.value = false
	}
}

const openCreate = () => {
	editingId.value = null
	resetForm()
	modalVisible.value = true
}

const openEdit = (record: any) => {
	editingId.value = record.id
	form.name = record.name
	form.description = record.description || ''
	form.cover_img = record.coverImg || ''
	form.status = record.status
	form.sort = record.sort || 0
	form.scopes = (record.scopes || []).map((item: any) => ({
		scope_type: item.scopeType,
		scope_value: item.scopeValue,
	}))
	const plans = record.plans?.length ? record.plans : defaultPlans()
	form.plans = ['monthly', 'quarterly', 'yearly'].map((type, index) => {
		const existing = plans.find((p: any) => p.planType === type)
		return existing
			? {
					plan_type: type,
					name: existing.name,
					price: existing.price,
					duration_days: existing.durationDays,
					enabled: existing.status === 1,
					sort: existing.sort || index + 1,
				}
			: defaultPlans()[index]
	})
	modalVisible.value = true
}

const addScope = () => {
	form.scopes.push({ scope_type: 'category', scope_value: '' })
}

const removeScope = (index: number) => {
	form.scopes.splice(index, 1)
}

const buildPayload = () => ({
	name: form.name.trim(),
	description: form.description,
	cover_img: form.cover_img,
	status: form.status,
	sort: form.sort,
	scopes: form.scopes.filter((item) => item.scope_value.trim()),
	plans: form.plans.map((plan, index) => ({
		plan_type: plan.plan_type,
		name: plan.name,
		price: plan.price,
		duration_days: plan.duration_days,
		status: plan.enabled ? 1 : 0,
		sort: plan.sort || index + 1,
	})),
})

const handleSubmit = async () => {
	if (!form.name.trim()) {
		message.warning('请填写套餐名称')
		return
	}
	try {
		const payload = buildPayload()
		if (editingId.value) {
			await updatePackageSection(editingId.value, payload)
		} else {
			await createPackageSection(payload)
		}
		message.success('保存成功')
		modalVisible.value = false
		loadList()
	} catch {
		message.error('保存失败')
	}
}

const handleDelete = async (id: number) => {
	try {
		await deletePackageSection(id)
		message.success('删除成功')
		loadList()
	} catch {
		message.error('删除失败')
	}
}

onMounted(loadList)
</script>

<style scoped>
.scope-row {
	display: flex;
	gap: 8px;
	margin-bottom: 8px;
}
</style>
