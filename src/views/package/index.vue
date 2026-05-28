<template>
	<div class="vip-section-page">
		<a-card title="套餐管理">
			<template #extra>
				<a-space>
					<a-button :loading="syncingVirtualPayGoods" @click="handleSyncAllVirtualPayGoods">同步虚拟道具价格</a-button>
					<a-button type="primary" @click="openCreate">新增套餐</a-button>
				</a-space>
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

		<a-modal
			v-model:open="modalVisible"
			:title="editingId ? '编辑套餐' : '新增套餐'"
			width="760px"
			:confirm-loading="submitLoading"
			@ok="handleSubmit"
		>
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
				<a-form-item label="封面图">
					<a-radio-group v-model:value="coverMode" style="margin-bottom: 12px">
						<a-radio value="auto">自动生成（显示绑定分类名）</a-radio>
						<a-radio value="manual">手动上传</a-radio>
					</a-radio-group>
					<div v-if="coverMode === 'auto'" class="package-auto-cover">
						<a-row :gutter="12" class="package-cover-style-row">
							<a-col :span="8">
								<div class="color-field-label">背景色</div>
								<div class="color-control">
									<input
										class="native-color-picker"
										type="color"
										:value="toColorPickerValue(form.cover_style.backgroundColor, defaultCoverStyle.backgroundColor)"
										@input="handleCoverStyleColorPick('backgroundColor', $event)"
									/>
									<a-input
										v-model:value="form.cover_style.backgroundColor"
										placeholder="#F4F7FB"
										@blur="normalizeCoverStyleField('backgroundColor')"
									/>
								</div>
							</a-col>
							<a-col :span="8">
								<div class="color-field-label">标题字体色</div>
								<div class="color-control">
									<input
										class="native-color-picker"
										type="color"
										:value="toColorPickerValue(form.cover_style.titleColor, defaultCoverStyle.titleColor)"
										@input="handleCoverStyleColorPick('titleColor', $event)"
									/>
									<a-input
										v-model:value="form.cover_style.titleColor"
										placeholder="#8A9AB3"
										@blur="normalizeCoverStyleField('titleColor')"
									/>
								</div>
							</a-col>
							<a-col :span="8">
								<div class="color-field-label">分类字体色</div>
								<div class="color-control">
									<input
										class="native-color-picker"
										type="color"
										:value="toColorPickerValue(form.cover_style.categoriesColor, defaultCoverStyle.categoriesColor)"
										@input="handleCoverStyleColorPick('categoriesColor', $event)"
									/>
									<a-input
										v-model:value="form.cover_style.categoriesColor"
										placeholder="#6F7F99"
										@blur="normalizeCoverStyleField('categoriesColor')"
									/>
								</div>
							</a-col>
						</a-row>
						<a-spin :spinning="autoCoverLoading">
							<div v-if="autoCoverPreviewSrc" class="package-auto-cover__preview">
								<img :src="autoCoverPreviewSrc" alt="自动生成封面预览" />
							</div>
							<div v-else class="package-auto-cover__hint">
								{{ autoCoverHint }}
							</div>
						</a-spin>
					</div>
					<a-upload
						v-else
						v-model:file-list="coverFileList"
						list-type="picture-card"
						:max-count="1"
						:before-upload="beforeCoverUpload"
						:custom-request="handleCoverUpload"
						:disabled="coverUploadLoading"
						@remove="handleCoverRemove"
					>
						<div v-if="coverFileList.length < 1">
							<plus-outlined />
							<div style="margin-top: 8px">上传</div>
						</div>
					</a-upload>
				</a-form-item>

				<a-divider>绑定范围</a-divider>
				<div v-for="(scope, index) in form.scopes" :key="index" class="scope-row">
					<a-select
						v-model:value="scope.scope_type"
						style="width: 140px"
						:options="scopeTypeOptions"
						@change="() => handleScopeTypeChange(scope)"
					/>
					<a-select
						v-if="scope.scope_type === 'course'"
						v-model:value="scope.scope_value"
						style="flex: 1"
						show-search
						allow-clear
						placeholder="请选择课程"
						:options="courseOptions"
						:filter-option="filterCourseOption"
					/>
					<a-select
						v-else-if="scope.scope_type === 'category'"
						v-model:value="scope.scope_value"
						style="flex: 1"
						show-search
						allow-clear
						placeholder="请选择一级分类"
						:options="categoryOptions"
						:filter-option="filterSelectOption"
					/>
					<a-cascader
						v-else
						v-model:value="scope.sub_category_path"
						style="flex: 1"
						:options="categoryCascaderOptions"
						:field-names="{ label: 'label', value: 'value', children: 'children' }"
						:show-search="{ filter: cascaderFilter }"
						placeholder="请选择二级分类"
						allow-clear
						@change="(value: string[]) => handleSubCategoryChange(scope, value)"
					/>
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
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { message } from 'ant-design-vue'
import { PlusOutlined } from '@ant-design/icons-vue'
import type { UploadFile } from 'ant-design-vue'
import { createPackageSection, deletePackageSection, getPackageSectionList, syncAllPackageVirtualPayGoods, updatePackageSection } from '@/api/package'
import { getCourseList } from '@/api/course'
import { getCourseCategoryTree } from '@/api/course-category'
import { uploadImage } from '@/api/upload'
import { getProxiedImageUrl } from '@/utils/imageProxy'
import { notifyVirtualPayGoodsPriceSync } from '@/utils/virtual-pay-goods'
import {
	collectPackageCategoryNames,
	DEFAULT_PACKAGE_COVER_STYLE,
	generateAndUploadPackageCover,
	generatePackageCoverFile,
	normalizeColorInput,
	normalizePackageCoverStyle,
	type PackageCoverStyle,
	type PackageScopeInput,
} from '@/utils/package-auto-cover'

type ScopeFormItem = {
	scope_type: string
	scope_value: string
	sub_category_path?: string[]
}

const loading = ref(false)
const syncingVirtualPayGoods = ref(false)
const submitLoading = ref(false)
const coverUploadLoading = ref(false)
const autoCoverLoading = ref(false)
const coverMode = ref<'auto' | 'manual'>('auto')
const autoCoverPreviewSrc = ref('')
const list = ref<any[]>([])
const modalVisible = ref(false)
const editingId = ref<number | null>(null)
const coverFileList = ref<UploadFile[]>([])
const courseList = ref<any[]>([])
const categoryTree = ref<any[]>([])
let autoCoverTimer: ReturnType<typeof setTimeout> | null = null
let autoCoverPreviewObjectUrl = ''

const defaultCoverStyle = DEFAULT_PACKAGE_COVER_STYLE

const createDefaultCoverStyle = (): PackageCoverStyle => ({ ...DEFAULT_PACKAGE_COVER_STYLE })

const coverMeta = computed(() => ({
	courseList: courseList.value,
	categoryTree: categoryTree.value,
}))

const autoCoverHint = computed(() => {
	const names = collectPackageCategoryNames(form.scopes as PackageScopeInput[], coverMeta.value)
	if (names.length === 0) {
		return '请先添加绑定分类，保存时将自动生成分类名封面'
	}
	return `将展示：${names.join('、')}`
})

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
	cover_style: createDefaultCoverStyle(),
	status: 1,
	sort: 0,
	scopes: [] as ScopeFormItem[],
	plans: defaultPlans(),
})

const toColorPickerValue = (value?: string, fallback = '#FFFFFF') => normalizeColorInput(value, fallback)

const getEventTargetValue = (event: Event) => (event.target as HTMLInputElement | null)?.value || ''

const normalizeCoverStyleField = (field: keyof PackageCoverStyle) => {
	form.cover_style[field] = normalizeColorInput(
		form.cover_style[field],
		DEFAULT_PACKAGE_COVER_STYLE[field],
	)
	scheduleAutoCoverPreview()
}

const handleCoverStyleColorPick = (field: keyof PackageCoverStyle, event: Event) => {
	form.cover_style[field] = normalizeColorInput(getEventTargetValue(event), DEFAULT_PACKAGE_COVER_STYLE[field])
	scheduleAutoCoverPreview()
}

const courseOptions = computed(() =>
	courseList.value.map((course) => ({
		label: `${course.name}${course.status === 0 ? '（已禁用）' : ''}`,
		value: String(course.id),
	})),
)

const categoryOptions = computed(() =>
	categoryTree.value.map((item) => ({
		label: item.status === 0 ? `${item.name}（已禁用）` : item.name,
		value: item.name,
	})),
)

const categoryCascaderOptions = computed(() =>
	categoryTree.value
		.map((parent) => ({
			label: parent.status === 0 ? `${parent.name}（已禁用）` : parent.name,
			value: parent.name,
			children: Array.isArray(parent.children)
				? parent.children.map((child: any) => ({
						label: child.status === 0 ? `${child.name}（已禁用）` : child.name,
						value: child.name,
					}))
				: [],
		}))
		.filter((item) => item.children.length > 0),
)

const courseNameMap = computed(() => {
	const map = new Map<string, string>()
	courseList.value.forEach((course) => map.set(String(course.id), course.name))
	return map
})

const scopeLabel = (scope: any) => {
	const map: Record<string, string> = {
		course: '课程',
		category: '一级分类',
		sub_category: '二级分类',
	}
	const type = scope.scopeType || scope.scope_type
	const value = scope.scopeValue || scope.scope_value
	if (type === 'course') {
		return `${map[type]}:${courseNameMap.value.get(String(value)) || value}`
	}
	return `${map[type] || type}:${value}`
}

const cascaderFilter = (inputValue: string, path: any[]) =>
	path.some((option) => String(option.label || '').toLowerCase().includes(inputValue.toLowerCase()))

const filterCourseOption = (input: string, option: any) =>
	String(option?.label || '').toLowerCase().includes(input.toLowerCase())

const filterSelectOption = (input: string, option: any) =>
	String(option?.label || '').toLowerCase().includes(input.toLowerCase())

const findSubCategoryPath = (subCategoryName: string) => {
	for (const parent of categoryTree.value) {
		for (const child of parent.children || []) {
			if (child.name === subCategoryName) {
				return [parent.name, child.name]
			}
		}
	}
	return subCategoryName ? [subCategoryName] : []
}

const normalizeScope = (item: any): ScopeFormItem => {
	const scopeType = item.scopeType || item.scope_type
	const scopeValue = item.scopeValue || item.scope_value || ''
	return {
		scope_type: scopeType,
		scope_value: scopeType === 'course' ? String(scopeValue) : String(scopeValue),
		sub_category_path: scopeType === 'sub_category' ? findSubCategoryPath(String(scopeValue)) : [],
	}
}

const handleScopeTypeChange = (scope: ScopeFormItem) => {
	scope.scope_value = ''
	scope.sub_category_path = []
	scheduleAutoCoverPreview()
}

const handleSubCategoryChange = (scope: ScopeFormItem, value: string[]) => {
	scope.sub_category_path = value || []
	scope.scope_value = value?.length ? value[value.length - 1] : ''
	scheduleAutoCoverPreview()
}

const clearAutoCoverPreview = () => {
	autoCoverPreviewSrc.value = ''
	if (autoCoverPreviewObjectUrl) {
		URL.revokeObjectURL(autoCoverPreviewObjectUrl)
		autoCoverPreviewObjectUrl = ''
	}
}

const scheduleAutoCoverPreview = (delay = 240) => {
	if (coverMode.value !== 'auto' || !modalVisible.value) return
	if (autoCoverTimer) {
		clearTimeout(autoCoverTimer)
	}
	autoCoverTimer = setTimeout(() => {
		refreshAutoCoverPreview()
	}, delay)
}

const refreshAutoCoverPreview = async () => {
	if (coverMode.value !== 'auto' || !modalVisible.value) return
	const names = collectPackageCategoryNames(form.scopes as PackageScopeInput[], coverMeta.value)
	if (names.length === 0) {
		clearAutoCoverPreview()
		return
	}
	try {
		autoCoverLoading.value = true
		const coverFile = await generatePackageCoverFile(
			form.name,
			form.scopes as PackageScopeInput[],
			coverMeta.value,
			form.cover_style,
		)
		if (!coverFile) {
			clearAutoCoverPreview()
			return
		}
		if (autoCoverPreviewObjectUrl) {
			URL.revokeObjectURL(autoCoverPreviewObjectUrl)
		}
		autoCoverPreviewObjectUrl = URL.createObjectURL(coverFile)
		autoCoverPreviewSrc.value = autoCoverPreviewObjectUrl
	} catch (error) {
		clearAutoCoverPreview()
		console.error('套餐封面预览生成失败:', error)
	} finally {
		autoCoverLoading.value = false
	}
}

const ensureAutoCoverUploaded = async () => {
	if (coverMode.value !== 'manual') {
		const url = await generateAndUploadPackageCover(
			form.name,
			form.scopes as PackageScopeInput[],
			coverMeta.value,
			form.cover_style,
		)
		if (url) {
			form.cover_img = url
		}
	}
}

const setCoverFileList = (url?: string) => {
	if (!url) {
		coverFileList.value = []
		return
	}
	coverFileList.value = [
		{
			uid: `cover-${Date.now()}`,
			name: 'cover.png',
			status: 'done',
			url: getProxiedImageUrl(url),
		},
	]
}

const resetForm = () => {
	form.name = ''
	form.description = ''
	form.cover_img = ''
	form.cover_style = createDefaultCoverStyle()
	form.status = 1
	form.sort = 0
	form.scopes = []
	form.plans = defaultPlans()
	coverMode.value = 'auto'
	clearAutoCoverPreview()
	setCoverFileList()
}

const loadMetaOptions = async () => {
	try {
		const [courseRes, categoryRes] = await Promise.all([
			getCourseList({ page: 1, pageSize: 1000 }),
			getCourseCategoryTree(),
		])
		courseList.value = Array.isArray(courseRes.data) ? courseRes.data : courseRes.data?.list || []
		categoryTree.value = Array.isArray(categoryRes.data) ? categoryRes.data : []
	} catch {
		message.error('加载课程或分类数据失败')
	}
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
	scheduleAutoCoverPreview()
}

const openEdit = (record: any) => {
	editingId.value = record.id
	form.name = record.name
	form.description = record.description || ''
	form.cover_img = record.coverImg || record.cover_img || ''
	form.cover_style = normalizePackageCoverStyle(record.coverStyle || record.cover_style || null)
	form.status = record.status
	form.sort = record.sort || 0
	form.scopes = (record.scopes || []).map((item: any) => normalizeScope(item))
	coverMode.value = record.coverStyle || record.cover_style ? 'auto' : form.cover_img ? 'manual' : 'auto'
	const plans = record.plans?.length ? record.plans : defaultPlans()
	form.plans = ['monthly', 'quarterly', 'yearly'].map((type, index) => {
		const existing = plans.find((p: any) => p.planType === type || p.plan_type === type)
		return existing
			? {
					plan_type: type,
					name: existing.name,
					price: existing.price,
					duration_days: existing.durationDays ?? existing.duration_days,
					enabled: (existing.status ?? 1) === 1,
					sort: existing.sort || index + 1,
				}
			: defaultPlans()[index]
	})
	setCoverFileList(form.cover_img)
	modalVisible.value = true
	if (coverMode.value === 'auto') {
		scheduleAutoCoverPreview()
	} else {
		clearAutoCoverPreview()
	}
}

const addScope = () => {
	form.scopes.push({ scope_type: 'category', scope_value: '', sub_category_path: [] })
	scheduleAutoCoverPreview()
}

const removeScope = (index: number) => {
	form.scopes.splice(index, 1)
	scheduleAutoCoverPreview()
}

const beforeCoverUpload = (file: File) => {
	if (!file.type.startsWith('image/')) {
		message.error('只能上传图片文件')
		return false
	}
	return true
}

const handleCoverUpload = async (options: any) => {
	const { file, onSuccess, onError } = options
	try {
		coverUploadLoading.value = true
		const result = await uploadImage(file as File)
		const imageUrl = result.url || result.imageUrl
		if (!imageUrl) {
			throw new Error('上传失败：未返回图片地址')
		}
		form.cover_img = imageUrl
		coverMode.value = 'manual'
		clearAutoCoverPreview()
		setCoverFileList(imageUrl)
		onSuccess?.(result, file)
		message.success('封面上传成功')
	} catch (error: any) {
		message.error(error?.message || '封面上传失败')
		onError?.(error)
	} finally {
		coverUploadLoading.value = false
	}
}

const handleCoverRemove = () => {
	form.cover_img = ''
	coverMode.value = 'auto'
	setCoverFileList()
	scheduleAutoCoverPreview()
}

const buildPayload = () => ({
	name: form.name.trim(),
	description: form.description,
	cover_img: form.cover_img,
	cover_style: coverMode.value === 'auto' ? normalizePackageCoverStyle(form.cover_style) : null,
	status: form.status,
	sort: form.sort,
	scopes: form.scopes
		.map((item) => ({
			scope_type: item.scope_type,
			scope_value: String(item.scope_value || '').trim(),
		}))
		.filter((item) => item.scope_value),
	plans: form.plans.map((plan, index) => ({
		plan_type: plan.plan_type,
		name: plan.name,
		price: plan.price,
		duration_days: plan.duration_days,
		status: plan.enabled ? 1 : 0,
		sort: plan.sort || index + 1,
	})),
})

const handleSyncAllVirtualPayGoods = async () => {
	syncingVirtualPayGoods.value = true
	try {
		const res = await syncAllPackageVirtualPayGoods()
		const result = (res as any)?.data ?? res
		const total = Number(result?.total || result?.package_total || 0)
		message.success(`已提交 ${total} 个套餐规格的虚拟道具价格同步`)
		notifyVirtualPayGoodsPriceSync(result)
	} catch (error: any) {
		message.error(error?.msg || error?.message || '同步虚拟道具价格失败')
	} finally {
		syncingVirtualPayGoods.value = false
	}
}

const handleSubmit = async () => {
	if (!form.name.trim()) {
		message.warning('请填写套餐名称')
		return
	}
	submitLoading.value = true
	try {
		await ensureAutoCoverUploaded()
		const payload = buildPayload()
		let saveResult: any
		if (editingId.value) {
			saveResult = await updatePackageSection(editingId.value, payload)
		} else {
			saveResult = await createPackageSection(payload)
		}
		const result = (saveResult as any)?.data ?? saveResult
		message.success('保存成功')
		notifyVirtualPayGoodsPriceSync(result)
		modalVisible.value = false
		loadList()
	} catch {
		message.error('保存失败')
	} finally {
		submitLoading.value = false
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

onMounted(async () => {
	await Promise.all([loadMetaOptions(), loadList()])
})

watch(
	() => form.name,
	() => scheduleAutoCoverPreview(),
)

watch(
	() => form.scopes.map((item) => `${item.scope_type}:${item.scope_value}:${(item.sub_category_path || []).join('/')}`).join('|'),
	() => scheduleAutoCoverPreview(),
)

watch(
	() =>
		`${form.cover_style.backgroundColor}|${form.cover_style.titleColor}|${form.cover_style.categoriesColor}`,
	() => scheduleAutoCoverPreview(),
)

watch(coverMode, (mode) => {
	if (mode === 'auto') {
		form.cover_img = ''
		setCoverFileList()
		scheduleAutoCoverPreview()
		return
	}
	clearAutoCoverPreview()
})
</script>

<style scoped>
.scope-row {
	display: flex;
	gap: 8px;
	margin-bottom: 8px;
	align-items: center;
}

:deep(.ant-upload-select-picture-card) {
	width: 104px;
	height: 104px;
}

.package-auto-cover__preview {
	width: 160px;
	height: 160px;
	border-radius: 8px;
	overflow: hidden;
	border: 1px solid #f0f0f0;
	background: #fafafa;
}

.package-auto-cover__preview img {
	width: 100%;
	height: 100%;
	object-fit: cover;
	display: block;
}

.package-auto-cover__hint {
	color: #6b7280;
	font-size: 13px;
	line-height: 1.6;
}

.package-cover-style-row {
	margin-bottom: 12px;
}

.color-field-label {
	margin-bottom: 6px;
	font-size: 13px;
	color: #4b5563;
}

.color-control {
	display: flex;
	align-items: center;
	gap: 8px;
}

.native-color-picker {
	width: 36px;
	height: 36px;
	padding: 0;
	border: 1px solid #d9d9d9;
	border-radius: 6px;
	background: transparent;
	cursor: pointer;
}
</style>
