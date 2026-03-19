import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { RouteLocationNormalizedLoaded } from 'vue-router';

export interface TabItem {
	path: string;
	fullPath: string;
	title: string;
	/** 用于 keep-alive 的 key，避免同一 path 不同 query 被当作同一缓存 */
	name?: string;
}

const TABS_STORAGE_KEY = 'admin-tabs';
const MAX_TABS = 20;

export const useTabsStore = defineStore('tabs', () => {
	const tabs = ref<TabItem[]>([]);
	const activeKey = ref('');

	const activeTab = computed(() => tabs.value.find((t) => t.fullPath === activeKey.value));

	function addTab(route: RouteLocationNormalizedLoaded) {
		const title = (route.meta?.title as string) || route.name?.toString() || '未命名';
		const path = route.path;
		const fullPath = route.fullPath;
		const name = route.name?.toString();
		const existing = tabs.value.find((t) => t.fullPath === fullPath);
		if (existing) {
			activeKey.value = fullPath;
			return;
		}
		const newTab: TabItem = { path, fullPath, title, name };
		const idx = tabs.value.findIndex((t) => t.path === path && t.fullPath !== fullPath);
		if (idx >= 0) {
			tabs.value.splice(idx, 1, newTab);
		} else {
			tabs.value.push(newTab);
		}
		if (tabs.value.length > MAX_TABS) {
			tabs.value.shift();
		}
		activeKey.value = fullPath;
		persist();
	}

	function removeTab(fullPath: string) {
		const idx = tabs.value.findIndex((t) => t.fullPath === fullPath);
		if (idx < 0) return;
		tabs.value.splice(idx, 1);
		if (activeKey.value === fullPath && tabs.value.length > 0) {
			const next = tabs.value[Math.min(idx, tabs.value.length - 1)];
			activeKey.value = next.fullPath;
			persist();
			return next.fullPath;
		}
		persist();
		return null;
	}

	function setActive(fullPath: string) {
		if (tabs.value.some((t) => t.fullPath === fullPath)) {
			activeKey.value = fullPath;
		}
	}

	function clearOthers(fullPath: string) {
		tabs.value = tabs.value.filter((t) => t.fullPath === fullPath);
		activeKey.value = fullPath;
		persist();
	}

	function clearAll() {
		tabs.value = [];
		activeKey.value = '';
		persist();
	}

	function persist() {
		try {
			sessionStorage.setItem(
				TABS_STORAGE_KEY,
				JSON.stringify({ tabs: tabs.value, activeKey: activeKey.value }),
			);
		} catch (_) {}
	}

	function restore() {
		try {
			const raw = sessionStorage.getItem(TABS_STORAGE_KEY);
			if (!raw) return;
			const { tabs: saved, activeKey: savedKey } = JSON.parse(raw);
			if (Array.isArray(saved) && saved.length > 0) {
				tabs.value = saved;
				if (savedKey && saved.some((t: TabItem) => t.fullPath === savedKey)) {
					activeKey.value = savedKey;
				} else {
					activeKey.value = saved[0]?.fullPath ?? '';
				}
			}
		} catch (_) {}
	}

	return {
		tabs,
		activeKey,
		activeTab,
		addTab,
		removeTab,
		setActive,
		clearOthers,
		clearAll,
		persist,
		restore,
	};
});
