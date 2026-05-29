<template>
	<a-layout class="layout">
		<!-- 移动端遮罩层 -->
		<div v-if="!collapsed && isMobile()" class="menu-mask" @click="collapsed = true"></div>
		<a-layout-sider v-model:collapsed="collapsed" :trigger="null" collapsible :width="200" class="layout-sider">
			<div class="logo">
				<h2 v-if="!collapsed">考研刷题</h2>
				<h2 v-else>考研</h2>
			</div>
			<div v-if="!menuReady" class="menu-loading">
				<a-spin size="large" />
			</div>
			<a-menu
				v-if="menuReady && menuItems.length > 0"
				:key="`menu-${menuReady}-${menuItems.length}`"
				v-model:selectedKeys="selectedKeys"
				v-model:openKeys="openKeys"
				mode="inline"
				theme="dark"
				:items="menuItems"
				:inline-collapsed="collapsed"
				@click="handleMenuClick"
				@openChange="handleOpenChange"
			/>
		</a-layout-sider>
		<a-layout>
			<a-layout-header class="layout-header" :class="{ collapsed: collapsed }">
				<div class="header-left">
					<menu-unfold-outlined v-if="collapsed" class="trigger" @click="collapsed = !collapsed" />
					<menu-fold-outlined v-else class="trigger" @click="collapsed = !collapsed" />
					<span class="header-title">管理系统</span>
				</div>
				<div class="header-right">
					<a-dropdown>
						<template #overlay>
							<a-menu>
								<a-menu-item>
									<user-outlined />
									<span>个人中心</span>
								</a-menu-item>
								<a-menu-divider />
								<a-menu-item @click="handleLogout">
									<logout-outlined />
									<span>退出登录</span>
								</a-menu-item>
							</a-menu>
						</template>
						<a-space class="user-info">
							<a-avatar :src="userStore.userInfo?.avatar" :size="32">
								{{ userStore.userInfo?.nickname?.[0] || 'U' }}
							</a-avatar>
							<span>{{ userStore.userInfo?.nickname || '用户' }}</span>
						</a-space>
					</a-dropdown>
				</div>
			</a-layout-header>
			<a-layout-content class="layout-content" :class="{ collapsed: collapsed, 'has-tabs': showTabs }">
				<TabBar v-if="showTabs" />
				<div class="content-wrapper">
					<router-view v-slot="{ Component }">
						<keep-alive :max="20">
							<component :is="Component" :key="route.fullPath" />
						</keep-alive>
					</router-view>
				</div>
			</a-layout-content>
		</a-layout>
	</a-layout>
</template>

<script setup lang="ts">
import { ref, computed, watch, h, onMounted, onUnmounted, nextTick } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import {
	MenuUnfoldOutlined,
	MenuFoldOutlined,
	UserOutlined,
	LogoutOutlined,
	DashboardOutlined,
	BookOutlined,
	GiftOutlined,
	UserSwitchOutlined,
	SettingOutlined,
} from '@ant-design/icons-vue';
import { useUserStore } from '@/store/user';
import { useTabsStore } from '@/store/tabs';
import TabBar from '@/components/TabBar/index.vue';
import type { MenuProps } from 'ant-design-vue';

const router = useRouter();
const route = useRoute();
const userStore = useUserStore();
const tabsStore = useTabsStore();

const showTabs = computed(() => {
	const r = route;
	if (!r.meta?.title || r.path === '/login' || r.path === '/403') return false;
	return true;
});

// 确保用户信息已加载
const isUserInfoReady = computed(() => {
	// 检查用户信息和角色是否都已加载
	const hasUserInfo = !!userStore.userInfo;
	const hasRoles = Array.isArray(userStore.roles) && userStore.roles.length > 0;
	const ready = hasUserInfo && hasRoles;
	return ready;
});

// 检测是否为移动端
const isMobile = (): boolean => {
	return window.innerWidth < 768;
};

// 从 localStorage 读取菜单折叠状态，移动端默认折叠
const getCollapsedState = (): boolean => {
	// 如果是移动端，默认折叠
	if (isMobile()) {
		return true;
	}
	const saved = localStorage.getItem('menu-collapsed');
	return saved ? JSON.parse(saved) : false;
};

// 从 localStorage 读取菜单展开状态
const getOpenKeys = (): string[] => {
	const saved = localStorage.getItem('menu-open-keys');
	return saved ? JSON.parse(saved) : [];
};

const collapsed = ref(getCollapsedState());
const selectedKeys = ref<string[]>([]);
const openKeys = ref<string[]>(getOpenKeys());
const windowWidth = ref(window.innerWidth);
const menuReady = ref(false);

// 监听窗口大小变化
const handleResize = () => {
	const newWidth = window.innerWidth;
	const wasMobile = windowWidth.value < 768;
	const isNowMobile = newWidth < 768;

	windowWidth.value = newWidth;

	// 从桌面端切换到移动端时，自动折叠菜单
	if (!wasMobile && isNowMobile) {
		collapsed.value = true;
	}
	// 从移动端切换到桌面端时，恢复之前的状态（如果之前是展开的）
	else if (wasMobile && !isNowMobile) {
		const saved = localStorage.getItem('menu-collapsed');
		if (saved !== null) {
			collapsed.value = JSON.parse(saved);
		} else {
			collapsed.value = false;
		}
	}
};

// 根据角色生成菜单
const menuItems = computed(() => {
	// 如果用户信息未准备好，返回空数组，避免菜单组件尝试渲染子菜单
	if (!isUserInfoReady.value) {
		return [];
	}

	const role = userStore.roles?.[0] || '';
	const items: MenuProps['items'] = [];
	const isSuperAdmin = role === 'super_admin';
	const hasRole = (roles: string[]) => roles.includes(role);
	const hasPermission = (permission: string) => isSuperAdmin || userStore.hasPermission(permission);

	// 如果没有角色信息，返回空数组
	if (!role) {
		return items;
	}

	// 仪表盘
	if (isSuperAdmin) {
		items.push({
			key: '/dashboard/analysis',
			icon: () => h(DashboardOutlined),
			label: '全局数据看板',
		});
	} else if (role === 'agent') {
		items.push({
			key: '/dashboard/agent-workbench',
			icon: () => h(DashboardOutlined),
			label: '代理商工作台',
		});
	}

	// 题库管理（按权限显示子菜单，兼容内置题库管理员角色）
	const questionChildren = [
		(hasRole(['super_admin', 'content_admin']) || hasPermission('question:view')) && {
			key: '/question/category',
			label: '分类管理',
		},
		(hasRole(['super_admin', 'content_admin']) || hasPermission('course:view')) && {
			key: '/question/course',
			label: '课程管理',
		},
		(hasRole(['super_admin', 'content_admin']) || hasPermission('chapter:view')) && {
			key: '/question/chapter',
			label: '章节管理',
		},
		(hasRole(['super_admin', 'content_admin']) || hasPermission('question:view')) && {
			key: '/question/list',
			label: '试题管理',
		},
	].filter(Boolean) as NonNullable<MenuProps['items']>;

	if (questionChildren.length > 0) {
		items.push({
			key: 'question',
			icon: () => h(BookOutlined),
			label: '题库管理',
			children: questionChildren,
		});
	}

	// 代理商中心（super_admin, agent）
	if (isSuperAdmin || role === 'agent') {
		items.push({
			key: 'agent',
			icon: () => h(GiftOutlined),
			label: '代理商中心',
			children: [
				{ key: '/agent/activation-code', label: '激活码管理' },
				{ key: '/agent/balance', label: '资金记录' },
			],
		});
	}

	// 小程序用户（super_admin）
	if (isSuperAdmin) {
		items.push({
			key: 'user',
			icon: () => h(UserSwitchOutlined),
			label: '小程序用户',
			children: [
				{ key: '/user/list', label: '用户列表' },
				{ key: '/user/coupons', label: '优惠券管理' },
			],
		});
	}

	// 系统管理（super_admin）
	if (isSuperAdmin) {
		items.push({
			key: 'system',
			icon: () => h(SettingOutlined),
			label: '系统管理',
			children: [
				{ key: '/system/account', label: '账号管理' },
				{ key: '/system/role', label: '角色管理' },
				{ key: '/system/config', label: '运营配置' },
				{ key: '/system/recommend', label: '首页推荐管理' },
				{ key: '/system/package', label: '套餐管理' },
				{ key: '/system/feedback', label: '功能反馈' },
				{ key: '/system/distributor', label: '分销管理' },
				{ key: '/system/log', label: '系统操作日志' },
			],
		});
	}

	return items;
});

// 监听 isUserInfoReady 变化，延迟设置 menuReady 以确保菜单上下文正确初始化
watch(
	() => isUserInfoReady.value,
	async (newVal, oldVal) => {
		if (newVal && !oldVal) {
			// 用户信息刚准备好，等待下一个 tick 确保 menuItems 已更新
			await nextTick();
			// 再等待一个 tick 确保菜单组件可以正确初始化上下文
			await nextTick();
			menuReady.value = true;
		} else if (!newVal) {
			menuReady.value = false;
		}
	},
	{ immediate: true },
);

// 监听路由变化，更新选中菜单
watch(
	[() => route.path, isUserInfoReady],
	([path, ready]) => {
		if (!ready) return;
		selectedKeys.value = [path];
		// 设置展开的菜单（如果当前菜单未展开，则自动展开）
		const currentOpenKeys = [...openKeys.value];
		if (path.startsWith('/question') && !currentOpenKeys.includes('question')) {
			currentOpenKeys.push('question');
			openKeys.value = currentOpenKeys;
		} else if (path.startsWith('/agent') && !currentOpenKeys.includes('agent')) {
			currentOpenKeys.push('agent');
			openKeys.value = currentOpenKeys;
		} else if ((path.startsWith('/system') || path.startsWith('/distributor')) && !currentOpenKeys.includes('system')) {
			currentOpenKeys.push('system');
			openKeys.value = currentOpenKeys;
		} else if (path.startsWith('/user') && !currentOpenKeys.includes('user')) {
			currentOpenKeys.push('user');
			openKeys.value = currentOpenKeys;
		}
	},
	{ immediate: true },
);

// 监听菜单折叠状态变化，保存到 localStorage（仅在非移动端保存）
watch(
	() => collapsed.value,
	(newVal) => {
		// 仅在桌面端保存状态，移动端不保存（因为移动端总是折叠）
		if (!isMobile()) {
			localStorage.setItem('menu-collapsed', JSON.stringify(newVal));
		}
		// 折叠时清空展开的菜单项
		if (newVal) {
			openKeys.value = [];
		}
	},
);

// 多标签：路由变化时加入或激活对应标签
watch(
	() => ({ path: route.path, fullPath: route.fullPath, meta: route.meta }),
	() => {
		if (showTabs.value) {
			tabsStore.addTab(route);
		}
	},
	{ immediate: true },
);

// 监听菜单展开状态变化，保存到 localStorage
watch(
	() => openKeys.value,
	(newKeys) => {
		if (!collapsed.value) {
			localStorage.setItem('menu-open-keys', JSON.stringify(newKeys));
		}
	},
	{ deep: true },
);

// 处理菜单展开/折叠事件
const handleOpenChange = (keys: string[]) => {
	openKeys.value = keys;
};

const handleMenuClick: MenuProps['onClick'] = ({ key }) => {
	if (typeof key === 'string' && key.startsWith('/')) {
		router.push(key);
	}
};

const handleLogout = () => {
	userStore.logout();
};

// 监听窗口大小变化
onMounted(async () => {
	window.addEventListener('resize', handleResize);
	// 初始化时检查一次
	handleResize();

	// 进入布局时主动刷新用户信息，避免本地缓存里的旧角色/旧权限导致菜单显示不准
	if (userStore.token) {
		try {
			await userStore.getUserInfo();
		} catch (error) {
			console.error('加载用户信息失败:', error);
			// 如果加载失败，跳转到登录页
			router.push('/login');
		}
	}

	// 初始化 menuReady：如果用户信息已准备好，延迟设置 menuReady
	if (isUserInfoReady.value) {
		// 异步设置 menuReady，确保菜单组件在正确的时机渲染
		await nextTick();
		await nextTick();
		menuReady.value = true;
	}
});

onUnmounted(() => {
	window.removeEventListener('resize', handleResize);
});
</script>

<style scoped lang="scss">
.layout {
	min-height: 100vh;
}

.layout-sider {
	overflow: auto;
	height: 100vh;
	position: fixed;
	left: 0;
	top: 0;
	bottom: 0;
	transition: width 0.2s;
	box-shadow: 2px 0 8px rgba(0, 0, 0, 0.15);
	z-index: 1000;
}

// 移动端遮罩层
.menu-mask {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: rgba(0, 0, 0, 0.45);
	z-index: 1000;
	animation: fadeIn 0.2s;
}

@keyframes fadeIn {
	from {
		opacity: 0;
	}
	to {
		opacity: 1;
	}
}

// 移动端菜单样式优化
@media (max-width: 768px) {
	.layout-sider {
		// 移动端菜单覆盖整个屏幕
		&:not(.ant-layout-sider-collapsed) {
			z-index: 1001;
			width: 200px !important;
		}

		// 移动端折叠时隐藏菜单
		&.ant-layout-sider-collapsed {
			transform: translateX(-100%);
		}
	}

	.layout-header {
		margin-left: 0 !important;
		left: 0 !important;
	}

	.layout-content {
		margin-left: 0 !important;
	}
}

.logo {
	height: 64px;
	display: flex;
	align-items: center;
	justify-content: center;
	background: rgba(255, 255, 255, 0.1);
	margin: 16px;
	border-radius: 4px;

	h2 {
		color: #fff;
		font-size: 18px;
		font-weight: 600;
		margin: 0;
	}
}

.layout-header {
	background: #fff;
	padding: 0 24px;
	display: flex;
	align-items: center;
	justify-content: space-between;
	box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
	margin-left: 20px;
	position: fixed;
	top: 0;
	right: 24px;
	left: 200px;
	z-index: 100;
	transition:
		margin-left 0.2s,
		left 0.2s,
		right 0.2s;
}

.layout-header.collapsed {
	margin-left: 80px;
	left: 80px;
	right: 24px;
}

.header-left {
	display: flex;
	align-items: center;
	gap: 16px;
}

.header-title {
	font-size: 18px;
	font-weight: 600;
	color: #262626;
}

.trigger {
	font-size: 18px;
	cursor: pointer;
	transition: color 0.3s;
	padding: 0 12px;

	&:hover {
		color: #1890ff;
	}
}

.header-right {
	display: flex;
	align-items: center;
	gap: 8px;
}

.user-info {
	cursor: pointer;
	padding: 0 12px;
}

.layout-content {
	margin-left: 200px;
	margin-top: 64px;
	padding: 24px;
	min-height: calc(100vh - 64px);
	background: #f0f2f5;
	transition: margin-left 0.2s;
}

.layout-content.collapsed {
	margin-left: 80px;
}

.layout-content.has-tabs .content-wrapper {
	margin-top: 8px;
}

.content-wrapper {
	background: #fff;
	padding: 24px;
	border-radius: 4px;
	min-height: calc(100vh - 112px);
}

.menu-loading {
	display: flex;
	align-items: center;
	justify-content: center;
	height: 200px;
}
</style>
