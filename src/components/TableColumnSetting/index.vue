<template>
	<a-popover v-model:open="open" trigger="click" placement="bottomRight">
		<template #content>
			<div class="table-column-setting">
				<div class="table-column-setting__header">
					<span class="table-column-setting__title">列设置</span>
					<a-button type="link" size="small" @click="handleReset">重置</a-button>
				</div>
				<div v-if="localItems.length === 0" class="table-column-setting__empty">暂无可调整列</div>
				<div v-else class="table-column-setting__list">
					<div v-for="(item, index) in localItems" :key="item.key" class="table-column-setting__item">
						<a-checkbox
							:checked="item.visible"
							@change="(event) => handleVisibleChange(index, event.target.checked)"
						>
							{{ item.title }}
						</a-checkbox>
						<a-space :size="0">
							<a-button type="text" size="small" :disabled="index === 0" @click="moveItem(index, -1)">
								<UpOutlined />
							</a-button>
							<a-button
								type="text"
								size="small"
								:disabled="index === localItems.length - 1"
								@click="moveItem(index, 1)"
							>
								<DownOutlined />
							</a-button>
						</a-space>
					</div>
				</div>
			</div>
		</template>
		<a-tooltip title="列设置">
			<a-button>
				<template #icon><SettingOutlined /></template>
				列设置
			</a-button>
		</a-tooltip>
	</a-popover>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { DownOutlined, SettingOutlined, UpOutlined } from '@ant-design/icons-vue';
import type { ColumnPreferenceItem } from '@/utils/table-columns';

export interface TableColumnSettingItem extends ColumnPreferenceItem {
	title: string;
}

const props = defineProps<{
	items: TableColumnSettingItem[];
}>();

const emit = defineEmits<{
	(e: 'update:items', value: ColumnPreferenceItem[]): void;
	(e: 'reset'): void;
}>();

const open = ref(false);
const localItems = ref<TableColumnSettingItem[]>([]);

watch(
	() => props.items,
	(value) => {
		localItems.value = value.map((item) => ({ ...item }));
	},
	{ immediate: true, deep: true },
);

const emitItems = () => {
	emit(
		'update:items',
		localItems.value.map((item, index) => ({
			key: item.key,
			visible: item.visible,
			order: index,
		})),
	);
};

const handleVisibleChange = (index: number, visible: boolean) => {
	localItems.value[index] = {
		...localItems.value[index],
		visible,
	};
	emitItems();
};

const moveItem = (index: number, offset: number) => {
	const targetIndex = index + offset;
	if (targetIndex < 0 || targetIndex >= localItems.value.length) return;
	const nextItems = [...localItems.value];
	const [moved] = nextItems.splice(index, 1);
	nextItems.splice(targetIndex, 0, moved);
	localItems.value = nextItems;
	emitItems();
};

const handleReset = () => {
	emit('reset');
};
</script>

<style scoped lang="scss">
.table-column-setting {
	width: 240px;
}

.table-column-setting__header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-bottom: 8px;
}

.table-column-setting__title {
	font-weight: 600;
	color: #1f2937;
}

.table-column-setting__empty {
	padding: 12px 0;
	color: rgba(0, 0, 0, 0.45);
	font-size: 12px;
	text-align: center;
}

.table-column-setting__list {
	display: flex;
	flex-direction: column;
	gap: 4px;
	max-height: 320px;
	overflow-y: auto;
}

.table-column-setting__item {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 8px;
	padding: 4px 0;
}
</style>
