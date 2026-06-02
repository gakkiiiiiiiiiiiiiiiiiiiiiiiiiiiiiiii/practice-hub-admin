<template>
	<div class="user-title-config">
		<a-alert
			type="info"
			show-icon
			message="按用户累计打卡学习天数自动发放称号。称号显示在小程序「我的」页昵称旁；VIP、超管等身份标识同排展示，套餐名称显示在第二行。"
			class="config-tip"
		/>

		<a-form layout="vertical" style="max-width: 960px; margin-top: 16px">
			<a-form-item label="启用称号系统">
				<a-switch v-model:checked="form.enabled" />
			</a-form-item>

			<div class="tier-section">
				<div class="tier-header">
					<div>
						<div class="tier-title">称号段位</div>
						<div class="tier-desc">段位样式参考游戏排位：青铜 → 白银 → 黄金 → 铂金 → 钻石 → 王者</div>
					</div>
					<a-button type="dashed" @click="addTier">添加段位</a-button>
				</div>

				<a-table
					:data-source="form.tiers"
					:columns="columns"
					:pagination="false"
					row-key="id"
					size="middle"
					:scroll="{ x: 900 }"
				>
					<template #bodyCell="{ column, record, index }">
						<template v-if="column.key === 'name'">
							<a-input v-model:value="record.name" placeholder="称号名称" />
						</template>
						<template v-else-if="column.key === 'minDays'">
							<a-input-number v-model:value="record.minDays" :min="0" :precision="0" style="width: 100%" />
						</template>
						<template v-else-if="column.key === 'tierStyle'">
							<a-select v-model:value="record.tierStyle" style="width: 100%">
								<a-select-option v-for="item in styleOptions" :key="item.value" :value="item.value">
									{{ item.label }}
								</a-select-option>
							</a-select>
						</template>
						<template v-else-if="column.key === 'sort'">
							<a-input-number v-model:value="record.sort" :min="0" :precision="0" style="width: 100%" />
						</template>
						<template v-else-if="column.key === 'enabled'">
							<a-switch v-model:checked="record.enabled" />
						</template>
						<template v-else-if="column.key === 'preview'">
							<span class="title-preview" :class="`title-preview--${record.tierStyle}`">{{ record.name || '预览' }}</span>
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
	sort: number
	enabled: boolean
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
	{ title: '称号名称', key: 'name', width: 160 },
	{ title: '达成天数', key: 'minDays', width: 120 },
	{ title: '段位样式', key: 'tierStyle', width: 140 },
	{ title: '排序', key: 'sort', width: 90 },
	{ title: '启用', key: 'enabled', width: 80 },
	{ title: '预览', key: 'preview', width: 140 },
	{ title: '操作', key: 'action', width: 90 },
]

const load = async () => {
	try {
		const res = await getUserTitleConfig()
		form.enabled = res?.enabled !== false
		form.tiers = (res?.tiers || []).map((tier: TitleTier, index: number) => ({
			id: tier.id || `tier_${index + 1}`,
			name: tier.name || '',
			minDays: Number(tier.minDays) || 0,
			tierStyle: tier.tierStyle || 'bronze',
			sort: Number(tier.sort) || index + 1,
			enabled: tier.enabled !== false,
		}))
	} catch {
		message.error('获取称号配置失败')
	}
}

const addTier = () => {
	const nextSort = form.tiers.length + 1
	form.tiers.push({
		id: `tier_${Date.now()}`,
		name: '新称号',
		minDays: 0,
		tierStyle: 'bronze',
		sort: nextSort,
		enabled: true,
	})
}

const removeTier = (index: number) => {
	form.tiers.splice(index, 1)
}

const save = async () => {
	if (!form.tiers.length) {
		message.warning('请至少配置一个称号段位')
		return
	}
	saving.value = true
	try {
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
	color: #5c3d2e;
	background: linear-gradient(135deg, #f0d0b4 0%, #c9a27b 100%);
	border-color: rgba(92, 61, 46, 0.25);
}

.title-preview--silver {
	color: #3d4a5c;
	background: linear-gradient(135deg, #f4f7fb 0%, #b8c4d4 100%);
	border-color: rgba(61, 74, 92, 0.2);
}

.title-preview--gold {
	color: #6b4e16;
	background: linear-gradient(135deg, #fff1c7 0%, #e8c468 100%);
	border-color: rgba(107, 78, 22, 0.28);
}

.title-preview--platinum {
	color: #0f4c5c;
	background: linear-gradient(135deg, #e8fbff 0%, #8ed8e8 100%);
	border-color: rgba(15, 76, 92, 0.22);
}

.title-preview--diamond {
	color: #1e3a8a;
	background: linear-gradient(135deg, #dbeafe 0%, #60a5fa 100%);
	border-color: rgba(30, 58, 138, 0.24);
}

.title-preview--king {
	color: #4c1d95;
	background: linear-gradient(135deg, #fde68a 0%, #c084fc 55%, #7c3aed 100%);
	border-color: rgba(124, 58, 237, 0.35);
	box-shadow: 0 0 10px rgba(124, 58, 237, 0.25);
}
</style>
