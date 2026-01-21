<template>
	<a-layout class="layout">
		<a-layout-sider v-model:collapsed="collapsed" :trigger="null" collapsible :width="200" class="layout-sider">
			<div class="logo">
				<h2 v-if="!collapsed">考研刷题</h2>
				<h2 v-else>考研</h2>
			</div>
			<a-menu
				v-model:selectedKeys="selectedKeys"
				v-model:openKeys="openKeys"
				mode="inline"
				theme="dark"
				:items="menuItems"
				@click="handleMenuClick"
			/>
		</a-layout-sider>
		<a-layout>
			<a-layout-header class="layout-header">
				<div class="header-left">
					<menu-unfold-outlined v-if="collapsed" class="trigger" @click="collapsed = !collapsed" />
					<menu-fold-outlined v-else class="trigger" @click="collapsed = !collapsed" />
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
			<a-layout-content class="layout-content">
				<div class="content-wrapper">
					<router-view />
				</div>
			</a-layout-content>
		</a-layout>
	</a-layout>
</template>

<script setup lang="ts">
import { ref, computed, watch, h } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import {
	MenuUnfoldOutlined,
	MenuFoldOutlined,
	UserOutlined,
	LogoutOutlined,
	DashboardOutlined,
	BookOutlined,
	FileTextOutlined,
	GiftOutlined,
	UserSwitchOutlined,
	SettingOutlined,
} from '@ant-design/icons-vue';
import { useUserStore } from '@/store/user';
import type { MenuProps } from 'ant-design-vue';

const router = useRouter();
const route = useRoute();
const userStore = useUserStore();

const collapsed = ref(false);
const selectedKeys = ref<string[]>([]);
const openKeys = ref<string[]>([]);

// 根据角色生成菜单
const menuItems = computed(() => {
	const role = userStore.roles[0] || '';
	const items: MenuProps['items'] = [];

	// 仪表盘
	if (role === 'super_admin') {
		items.push({
			key: '/dashboard/analysis',
			icon: h(DashboardOutlined),
			label: '全局数据看板',
		});
	} else if (role === 'agent') {
		items.push({
			key: '/dashboard/agent-workbench',
			icon: h(DashboardOutlined),
			label: '代理商工作台',
		});
	} else {
		items.push({
			key: '/dashboard',
			icon: h(DashboardOutlined),
			label: '仪表盘',
		});
	}

	// 题库管理（super_admin, content_admin）
	if (role === 'super_admin' || role === 'content_admin') {
		items.push({
			key: 'question',
			icon: h(BookOutlined),
			label: '题库管理',
			children: [
				{ key: '/question/category', label: '分类管理' },
				{ key: '/question/course', label: '课程管理' },
				{ key: '/question/chapter', label: '章节管理' },
				{ key: '/question/list', label: '试题管理' },
			],
		});
	}

	// 代理商中心（super_admin, agent）
	if (role === 'super_admin' || role === 'agent') {
		items.push({
			key: 'agent',
			icon: h(GiftOutlined),
			label: '代理商中心',
			children: [
				{ key: '/agent/activation-code', label: '激活码管理' },
				{ key: '/agent/balance', label: '资金记录' },
			],
		});
	}

	// 小程序用户（super_admin）
	if (role === 'super_admin') {
		items.push({
			key: '/user/list',
			icon: h(UserSwitchOutlined),
			label: '小程序用户',
		});
	}

	// 系统管理（super_admin）
	if (role === 'super_admin') {
		items.push({
			key: 'system',
			icon: h(SettingOutlined),
			label: '系统管理',
			children: [
				{ key: '/system/account', label: '账号管理' },
				{ key: '/system/role', label: '角色管理' },
				{ key: '/system/config', label: '运营配置' },
				{ key: '/system/recommend', label: '首页推荐管理' },
				{ key: '/system/feedback', label: '功能反馈' },
				{ key: '/system/distributor', label: '分销管理' },
			],
		});
	}

	return items;
});

// 监听路由变化，更新选中菜单
watch(
	() => route.path,
	(path) => {
		selectedKeys.value = [path];
		// 设置展开的菜单
		if (path.startsWith('/question')) {
			openKeys.value = ['question'];
		} else if (path.startsWith('/agent')) {
			openKeys.value = ['agent'];
		} else if (path.startsWith('/system')) {
			openKeys.value = ['system'];
		} else if (path.startsWith('/distributor')) {
			openKeys.value = ['system'];
		}
	},
	{ immediate: true }
);

const handleMenuClick: MenuProps['onClick'] = ({ key }) => {
	if (typeof key === 'string' && key.startsWith('/')) {
		router.push(key);
	}
};

const handleLogout = () => {
	userStore.logout();
};
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
	margin-left: 200px;
	position: fixed;
	top: 0;
	right: 0;
	left: 200px;
	z-index: 100;
}

.header-left {
	display: flex;
	align-items: center;
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
}

.content-wrapper {
	background: #fff;
	padding: 24px;
	border-radius: 4px;
	min-height: calc(100vh - 112px);
}
</style>
