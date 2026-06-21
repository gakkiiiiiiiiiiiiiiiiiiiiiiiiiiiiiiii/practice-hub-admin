<template>
	<div class="course-type-page">
		<a-card>
			<template #extra>
				<a-button type="primary" @click="openCreate">
					<template #icon><plus-outlined /></template>
					新增课程类型
				</a-button>
			</template>

			<a-table :columns="columns" :data-source="list" :loading="loading" row-key="id" :pagination="false">
				<template #bodyCell="{ column, record }">
					<template v-if="column.key === 'status'">
						<a-tag :color="record.status === 1 ? 'green' : 'default'">
							{{ record.status === 1 ? '启用' : '禁用' }}
						</a-tag>
					</template>
					<template v-else-if="column.key === 'rule'">
						课程名称包含 <a-tag color="blue">{{ record.match_keyword }}</a-tag>
					</template>
					<template v-else-if="column.key === 'action'">
						<a-space>
							<a-button type="link" size="small" @click="openEdit(record)">编辑</a-button>
							<a-popconfirm title="确定删除该课程类型？" @confirm="handleDelete(record.id)">
								<a-button type="link" size="small" danger>删除</a-button>
							</a-popconfirm>
						</a-space>
					</template>
				</template>
			</a-table>
		</a-card>

		<a-modal
			v-model:open="modalOpen"
			:title="editingId ? '编辑课程类型' : '新增课程类型'"
			:confirm-loading="saving"
			@ok="handleSave"
			@cancel="closeModal"
		>
			<a-form ref="formRef" :model="form" :rules="rules" :label-col="{ span: 6 }" :wrapper-col="{ span: 18 }">
				<a-form-item label="类型名称" name="name">
					<a-input v-model:value="form.name" placeholder="如：笔记" />
				</a-form-item>
				<a-form-item label="归类条件" name="match_keyword">
					<a-input v-model:value="form.match_keyword" placeholder="如：笔记" />
					<div class="form-help">课程名称包含该关键字时，会归入此课程类型。</div>
				</a-form-item>
				<a-form-item label="排序" name="sort">
					<a-input-number v-model:value="form.sort" :min="0" style="width: 100%" />
				</a-form-item>
				<a-form-item label="状态" name="status">
					<a-switch v-model:checked="form.statusChecked" checked-children="启用" un-checked-children="禁用" />
				</a-form-item>
			</a-form>
		</a-modal>
	</div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { message } from 'ant-design-vue'
import { PlusOutlined } from '@ant-design/icons-vue'
import { createCourseType, deleteCourseType, getCourseTypeList, updateCourseType } from '@/api/course-type'

const loading = ref(false)
const saving = ref(false)
const list = ref<any[]>([])
const modalOpen = ref(false)
const editingId = ref<number | null>(null)
const formRef = ref()
const form = ref({
	name: '',
	match_keyword: '',
	sort: 0,
	statusChecked: true,
})

const columns = [
	{ title: '类型名称', dataIndex: 'name', key: 'name' },
	{ title: '归类规则', key: 'rule' },
	{ title: '排序', dataIndex: 'sort', key: 'sort', width: 100 },
	{ title: '状态', key: 'status', width: 100 },
	{ title: '操作', key: 'action', width: 160 },
]

const rules = {
	name: [{ required: true, message: '请输入类型名称', trigger: 'blur' }],
	match_keyword: [{ required: true, message: '请输入归类关键字', trigger: 'blur' }],
}

const fetchList = async () => {
	loading.value = true
	try {
		const res = await getCourseTypeList()
		list.value = Array.isArray(res.data) ? res.data : []
	} catch (error: any) {
		message.error(error?.message || '加载课程类型失败')
	} finally {
		loading.value = false
	}
}

const resetForm = () => {
	form.value = {
		name: '',
		match_keyword: '',
		sort: 0,
		statusChecked: true,
	}
}

const openCreate = () => {
	editingId.value = null
	resetForm()
	modalOpen.value = true
}

const openEdit = (record: any) => {
	editingId.value = record.id
	form.value = {
		name: record.name || '',
		match_keyword: record.match_keyword || '',
		sort: record.sort || 0,
		statusChecked: record.status !== 0,
	}
	modalOpen.value = true
}

const closeModal = () => {
	modalOpen.value = false
	formRef.value?.resetFields()
}

const handleSave = async () => {
	try {
		await formRef.value?.validate()
		saving.value = true
		const payload = {
			name: form.value.name,
			match_keyword: form.value.match_keyword,
			sort: form.value.sort,
			status: form.value.statusChecked ? 1 : 0,
		}
		if (editingId.value) {
			await updateCourseType(editingId.value, payload)
		} else {
			await createCourseType(payload)
		}
		message.success('保存成功')
		modalOpen.value = false
		fetchList()
	} catch (error: any) {
		if (!error?.errorFields) {
			message.error(error?.message || '保存失败')
		}
	} finally {
		saving.value = false
	}
}

const handleDelete = async (id: number) => {
	try {
		await deleteCourseType(id)
		message.success('删除成功')
		fetchList()
	} catch (error: any) {
		message.error(error?.message || '删除失败')
	}
}

onMounted(fetchList)
</script>

<style scoped>
.form-help {
	margin-top: 4px;
	color: #8c8c8c;
	font-size: 12px;
}
</style>
