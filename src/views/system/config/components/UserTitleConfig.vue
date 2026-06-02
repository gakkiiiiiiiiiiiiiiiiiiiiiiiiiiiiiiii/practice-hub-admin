<template>
	<div class="user-title-config">
		<a-alert
			type="info"
			show-icon
			message="按用户累计打卡学习天数自动发放称号。称号显示在小程序「我的」页昵称旁；VIP、超管等身份标识同排展示，套餐名称显示在第二行。"
			class="config-tip"
		/>

		<a-form layout="vertical" style="max-width: 1100px; margin-top: 16px">
			<a-form-item label="启用称号系统">
				<a-switch v-model:checked="form.enabled" />
			</a-form-item>

			<div class="tier-section">
				<div class="tier-header">
					<div>
						<div class="tier-title">称号列表</div>
						<div class="tier-desc">称号样式参考游戏排位：青铜 → 白银 → 黄金 → 铂金 → 钻石 → 王者，可自定义字体颜色</div>
					</div>
					<a-button type="dashed" @click="addTier">添加称号</a-button>
				</div>

				<a-table
					:data-source="form.tiers"
					:columns="columns"
					:pagination="false"
					row-key="id"
					size="middle"
					:scroll="{ x: 1050 }"
				>
					<template #bodyCell="{ column, record, index }">
						<template v-if="column.key === 'name'">
							<a-input v-model:value="record.name" placeholder="称号名称" />
						</template>
						<template v-else-if="column.key === 'minDays'">
							<a-input-number v-model:value="record.minDays" :min="0" :precision="0" style="width: 100%" />
						</template>
						<template v-else-if="column.key === 'tierStyle'">
							<a-select
								v-model:value="record.tierStyle"
								style="width: 100%"
								@change="() => applyStyleDefaultColor(record)"
							>
								<a-select-option v-for="item in styleOptions" :key="item.value" :value="item.value">
									{{ item.label }}
								</a-select-option>
							</a-select>
						</template>
						<template v-else-if="column.key === 'textColor'">
							<div class="color-field">
								<input
									v-model="record.textColor"
									type="color"
									class="color-input"
									@input="onColorInput(record, $event)"
								/>
								<a-input
									v-model:value="record.textColor"
									placeholder="#5c3d2e"
									:maxlength="7"
									@blur="normalizeRecordColor(record)"
								/>
							</div>
						</template>
						<template v-else-if="column.key === 'sort'">
							<a-input-number v-model:value="record.sort" :min="0" :precision="0" style="width: 100%" />
						</template>
						<template v-else-if="column.key === 'enabled'">
							<a-switch v-model:checked="record.enabled" />
						</template>
						<template v-else-if="column.key === 'preview'">
							<span
								class="title-preview"
								:class="`title-preview--${record.tierStyle}`"
								:style="{ color: record.textColor }"
							>
								{{ record.name || '预览' }}
							</span>
						</template>
						<template v-else-if="column.key === 'action'">
							<a-button type="link" danger :disabled="form.tiers.length <= 1" @click="removeTier(index)">删除</a-button>
						</template>
					</template>
				</a-table>
			</div>

			<a-form-item style="margin-top: 24px">
				<a-button type="primary" :loading="saving" @click="save">保存配置</a-button>
				<a-button style="margin-left: 12px" @click="load">恢复当前配置</a-button>
				<a-button style="margin-left: 12px" @click="resetDefaults">恢复默认称号</a-button>
			</a-form-item>
		</a-form>
	</div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { message } from 'ant-design-vue'
import { getUserTitleConfig, setUserTitleConfig } from '@/api/system'

type TitleTier = {
	id: string
	name: string
	minDays: number
	tierStyle: string
	textColor: string
	sort: number
	enabled: boolean
}

const DEFAULT_TIERS: TitleTier[] = [
	{ id: 'tier_1', name: '备考新兵', minDays: 0, tierStyle: 'bronze', textColor: '#5c3d2e', sort: 1, enabled: true },
	{ id: 'tier_2', name: '筑基学士', minDays: 7, tierStyle: 'silver', textColor: '#3d4a5c', sort: 2, enabled: true },
	{ id: 'tier_3', name: '刷题先锋', minDays: 30, tierStyle: 'gold', textColor: '#6b4e16', sort: 3, enabled: true },
	{ id: 'tier_4', name: '真题宗师', minDays: 90, tierStyle: 'platinum', textColor: '#0f4c5c', sort: 4, enabled: true },
	{ id: 'tier_5', name: '过线战神', minDays: 180, tierStyle: 'diamond', textColor: '#1e3a8a', sort: 5, enabled: true },
	{ id: 'tier_6', name: '研途王者', minDays: 365, tierStyle: 'king', textColor: '#4c1d95', sort: 6, enabled: true },
]

const STYLE_DEFAULT_COLORS: Record<string, string> = {
	bronze: '#5c3d2e',
	silver: '#3d4a5c',
	gold: '#6b4e16',
	platinum: '#0f4c5c',
	diamond: '#1e3a8a',
	king: '#4c1d95',
}

const saving = ref(false)
const form = reactive({
	enabled: true,
	tiers: [] as TitleTier[],
})

const styleOptions = [
	{ value: 'bronze', label: '青铜' },
	{ value: 'silver', label: '白银' },
	{ value: 'gold', label: '黄金' },
	{ value: 'platinum', label: '铂金' },
	{ value: 'diamond', label: '钻石' },
	{ value: 'king', label: '王者' },
]

const columns = [
	{ title: '称号名称', key: 'name', width: 150 },
	{ title: '达成天数', key: 'minDays', width: 110 },
	{ title: '称号样式', key: 'tierStyle', width: 130 },
	{ title: '字体颜色', key: 'textColor', width: 180 },
	{ title: '排序', key: 'sort', width: 80 },
	{ title: '启用', key: 'enabled', width: 80 },
	{ title: '预览', key: 'preview', width: 140 },
	{ title: '操作', key: 'action', width: 80 },
]

const normalizeHexColor = (raw: string, fallbackStyle = 'bronze') => {
	const value = String(raw || '').trim()
	if (/^#[0-9a-fA-F]{6}$/.test(value)) {
		return value.toLowerCase()
	}
	if (/^#[0-9a-fA-F]{3}$/.test(value)) {
		const hex = value.slice(1)
		return `#${hex[0]}${hex[0]}${hex[1]}${hex[1]}${hex[2]}${hex[2]}`.toLowerCase()
	}
	return STYLE_DEFAULT_COLORS[fallbackStyle] || '#5c3d2e'
}

const mapTier = (tier: Partial<TitleTier>, index: number): TitleTier => {
	const tierStyle = tier.tierStyle || 'bronze'
	return {
		id: tier.id || `tier_${index + 1}`,
		name: tier.name || '',
		minDays: Number(tier.minDays) || 0,
		tierStyle,
		textColor: normalizeHexColor(tier.textColor || '', tierStyle),
		sort: Number(tier.sort) || index + 1,
		enabled: tier.enabled !== false,
	}
}

const applyTiers = (tiers: Partial<TitleTier>[]) => {
	const source = Array.isArray(tiers) && tiers.length > 0 ? tiers : DEFAULT_TIERS
	form.tiers = source.map((tier, index) => mapTier(tier, index))
}

const applyStyleDefaultColor = (record: TitleTier) => {
	record.textColor = STYLE_DEFAULT_COLORS[record.tierStyle] || '#5c3d2e'
}

const normalizeRecordColor = (record: TitleTier) => {
	record.textColor = normalizeHexColor(record.textColor, record.tierStyle)
}

const onColorInput = (record: TitleTier, event: Event) => {
	const target = event.target as HTMLInputElement
	record.textColor = normalizeHexColor(target?.value || record.textColor, record.tierStyle)
}

const load = async () => {
	try {
		const res = await getUserTitleConfig()
		const data = (res as { data?: { enabled?: boolean; tiers?: Partial<TitleTier>[] } })?.data ?? res ?? {}
		form.enabled = data.enabled !== false
		applyTiers(data.tiers || [])
	} catch {
		message.error('获取称号配置失败')
		applyTiers(DEFAULT_TIERS)
	}
}

const resetDefaults = () => {
	applyTiers(DEFAULT_TIERS)
	message.info('已载入默认称号，请点击保存配置写入服务器')
}

const addTier = () => {
	const nextSort = form.tiers.length + 1
	const tierStyle = 'bronze'
	form.tiers.push({
		id: `tier_${Date.now()}`,
		name: '新称号',
		minDays: 0,
		tierStyle,
		textColor: STYLE_DEFAULT_COLORS[tierStyle],
		sort: nextSort,
		enabled: true,
	})
}

const removeTier = (index: number) => {
	form.tiers.splice(index, 1)
}

const save = async () => {
	if (!form.tiers.length) {
		message.warning('请至少配置一个称号')
		return
	}
	saving.value = true
	try {
		form.tiers.forEach((tier) => normalizeRecordColor(tier))
		await setUserTitleConfig({
			enabled: form.enabled,
			tiers: form.tiers.map((tier, index) => ({
				...tier,
				sort: tier.sort || index + 1,
			})),
		})
		message.success('称号配置已保存')
		await load()
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

.tier-section {
	margin-top: 8px;
}

.tier-header {
	display: flex;
	align-items: flex-start;
	justify-content: space-between;
	margin-bottom: 12px;
}

.tier-title {
	font-size: 15px;
	font-weight: 600;
	color: #1f2937;
}

.tier-desc {
	margin-top: 4px;
	font-size: 12px;
	color: #6b7280;
}

.color-field {
	display: flex;
	align-items: center;
	gap: 8px;
}

.color-input {
	width: 36px;
	height: 32px;
	padding: 0;
	border: 1px solid #d9d9d9;
	border-radius: 6px;
	cursor: pointer;
	background: #fff;
}

.title-preview {
	display: inline-flex;
	align-items: center;
	padding: 2px 10px;
	border-radius: 999px;
	font-size: 12px;
	font-weight: 700;
	border: 1px solid transparent;
}

.title-preview--bronze {
	background: linear-gradient(135deg, #f0d0b4 0%, #c9a27b 100%);
	border-color: rgba(92, 61, 46, 0.25);
}

.title-preview--silver {
	background: linear-gradient(135deg, #f4f7fb 0%, #b8c4d4 100%);
	border-color: rgba(61, 74, 92, 0.2);
}

.title-preview--gold {
	background: linear-gradient(135deg, #fff1c7 0%, #e8c468 100%);
	border-color: rgba(107, 78, 22, 0.28);
}

.title-preview--platinum {
	background: linear-gradient(135deg, #e8fbff 0%, #8ed8e8 100%);
	border-color: rgba(15, 76, 92, 0.22);
}

.title-preview--diamond {
	background: linear-gradient(135deg, #dbeafe 0%, #60a5fa 100%);
	border-color: rgba(30, 58, 138, 0.24);
}

.title-preview--king {
	background: linear-gradient(135deg, #fde68a 0%, #c084fc 55%, #7c3aed 100%);
	border-color: rgba(124, 58, 237, 0.35);
	box-shadow: 0 0 10px rgba(124, 58, 237, 0.25);
}
</style>
