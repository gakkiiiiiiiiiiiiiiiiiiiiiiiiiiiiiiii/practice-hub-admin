<template>
	<div v-if="tabsStore.tabs.length > 0" class="tab-bar">
		<div class="tabs-wrap">
			<div
				v-for="tab in tabsStore.tabs"
				:key="tab.fullPath"
				:class="['tab-item', { active: tabsStore.activeKey === tab.fullPath }]"
				@click="go(tab.fullPath)"
			>
				<span class="tab-title">{{ tab.title }}</span>
				<close-outlined
					v-if="tabsStore.tabs.length > 1"
					class="tab-close"
					@click.stop="close(tab.fullPath)"
				/>
			</div>
		</div>
		<div class="tab-actions">
			<a-dropdown>
				<template #overlay>
					<a-menu @click="handleMenuClick">
						<a-menu-item key="closeOthers">关闭其他</a-menu-item>
						<a-menu-item key="closeAll">关闭全部</a-menu-item>
					</a-menu>
				</template>
				<a-button type="text" size="small" class="more-btn">
					<down-outlined />
				</a-button>
			</a-dropdown>
		</div>
	</div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import { CloseOutlined, DownOutlined } from '@ant-design/icons-vue';
import { useTabsStore } from '@/store/tabs';

const router = useRouter();
const tabsStore = useTabsStore();

function go(fullPath: string) {
	if (tabsStore.activeKey === fullPath) return;
	tabsStore.setActive(fullPath);
	router.push(fullPath);
}

function close(fullPath: string) {
	const next = tabsStore.removeTab(fullPath);
	if (next) {
		router.push(next);
	}
}

function handleMenuClick({ key }: { key: string }) {
	if (key === 'closeOthers' && tabsStore.activeKey) {
		tabsStore.clearOthers(tabsStore.activeKey);
		router.push(tabsStore.activeKey);
	} else if (key === 'closeAll') {
		tabsStore.clearAll();
		router.push('/dashboard');
	}
}
</script>

<style lang="scss" scoped>
.tab-bar {
	display: flex;
	align-items: center;
	height: 40px;
	padding: 0 16px;
	background: #fff;
	border-bottom: 1px solid #f0f0f0;
	user-select: none;
}

.tabs-wrap {
	flex: 1;
	display: flex;
	align-items: center;
	gap: 4px;
	overflow-x: auto;
	scrollbar-width: thin;

	&::-webkit-scrollbar {
		height: 4px;
	}
	&::-webkit-scrollbar-thumb {
		background: #d9d9d9;
		border-radius: 2px;
	}
}

.tab-item {
	display: inline-flex;
	align-items: center;
	gap: 6px;
	padding: 4px 12px;
	border-radius: 4px;
	font-size: 13px;
	color: #666;
	white-space: nowrap;
	cursor: pointer;
	transition: background 0.2s, color 0.2s;

	&:hover {
		background: #f5f5f5;
		color: #1890ff;
	}

	&.active {
		background: #e6f7ff;
		color: #1890ff;
	}
}

.tab-title {
	max-width: 120px;
	overflow: hidden;
	text-overflow: ellipsis;
}

.tab-close {
	font-size: 12px;
	opacity: 0.6;

	&:hover {
		opacity: 1;
		color: #ff4d4f;
	}
}

.tab-actions {
	flex-shrink: 0;
	margin-left: 8px;
}

.more-btn {
	color: #666;
}
</style>
