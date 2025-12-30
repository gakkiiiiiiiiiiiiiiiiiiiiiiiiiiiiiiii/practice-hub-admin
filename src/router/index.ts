import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router';
import { useUserStore } from '@/store/user';
import { getToken } from '@/utils/auth';
import NProgress from 'nprogress';
import 'nprogress/nprogress.css';

NProgress.configure({ showSpinner: false });

const routes: RouteRecordRaw[] = [
	{
		path: '/login',
		name: 'Login',
		component: () => import('@/views/login/index.vue'),
		meta: {
			title: '登录',
			requiresAuth: false,
		},
	},
	{
		path: '/',
		component: () => import('@/layouts/BasicLayout.vue'),
		redirect: '/dashboard',
		meta: {
			requiresAuth: true,
		},
		children: [
			{
				path: '/dashboard',
				name: 'Dashboard',
				component: () => import('@/views/dashboard/index.vue'),
				meta: {
					title: '仪表盘',
					roles: ['super_admin', 'content_admin', 'agent'],
				},
			},
			{
				path: '/dashboard/analysis',
				name: 'DashboardAnalysis',
				component: () => import('@/views/dashboard/analysis/index.vue'),
				meta: {
					title: '全局数据看板',
					roles: ['super_admin'],
				},
			},
			{
				path: '/dashboard/agent-workbench',
				name: 'AgentWorkbench',
				component: () => import('@/views/dashboard/agent-workbench/index.vue'),
				meta: {
					title: '代理商工作台',
					roles: ['agent'],
				},
			},
		],
	},
	{
		path: '/question',
		component: () => import('@/layouts/BasicLayout.vue'),
		meta: {
			requiresAuth: true,
			roles: ['super_admin', 'content_admin'],
		},
		children: [
			{
				path: 'subject',
				name: 'QuestionSubject',
				component: () => import('@/views/question/subject/index.vue'),
				meta: {
					title: '课程管理',
				},
			},
			{
				path: 'chapter',
				name: 'QuestionChapter',
				component: () => import('@/views/question/chapter/index.vue'),
				meta: {
					title: '章节管理',
				},
			},
			{
				path: 'list',
				name: 'QuestionList',
				component: () => import('@/views/question/list/index.vue'),
				meta: {
					title: '试题管理',
				},
			},
			{
				path: 'edit/:id?',
				name: 'QuestionEdit',
				component: () => import('@/views/question/edit/index.vue'),
				meta: {
					title: '编辑题目',
				},
			},
		],
	},
	{
		path: '/agent',
		component: () => import('@/layouts/BasicLayout.vue'),
		meta: {
			requiresAuth: true,
			roles: ['super_admin', 'agent'],
		},
		children: [
			{
				path: 'activation-code',
				name: 'ActivationCode',
				component: () => import('@/views/agent/activation-code/index.vue'),
				meta: {
					title: '激活码管理',
				},
			},
			{
				path: 'balance',
				name: 'Balance',
				component: () => import('@/views/agent/balance/index.vue'),
				meta: {
					title: '资金记录',
				},
			},
		],
	},
	{
		path: '/user',
		component: () => import('@/layouts/BasicLayout.vue'),
		meta: {
			requiresAuth: true,
			roles: ['super_admin'],
		},
		children: [
			{
				path: 'list',
				name: 'UserList',
				component: () => import('@/views/user/list/index.vue'),
				meta: {
					title: '小程序用户',
				},
			},
		],
	},
	{
		path: '/system',
		component: () => import('@/layouts/BasicLayout.vue'),
		meta: {
			requiresAuth: true,
			roles: ['super_admin'],
		},
		children: [
			{
				path: 'account',
				name: 'SystemAccount',
				component: () => import('@/views/system/account/index.vue'),
				meta: {
					title: '账号管理',
				},
			},
			{
				path: 'role',
				name: 'SystemRole',
				component: () => import('@/views/system/role/index.vue'),
				meta: {
					title: '角色管理',
				},
			},
			{
				path: 'config',
				name: 'SystemConfig',
				component: () => import('@/views/system/config/index.vue'),
				meta: {
					title: '运营配置',
				},
			},
			{
				path: 'recommend',
				name: 'SystemRecommend',
				component: () => import('@/views/recommend/index.vue'),
				meta: {
					title: '首页推荐管理',
				},
			},
		],
	},
	{
		path: '/403',
		name: 'Forbidden',
		component: () => import('@/views/error/403.vue'),
		meta: {
			title: '无权限',
			requiresAuth: false,
		},
	},
	{
		path: '/:pathMatch(.*)*',
		name: 'NotFound',
		component: () => import('@/views/error/404.vue'),
		meta: {
			title: '页面不存在',
			requiresAuth: false,
		},
	},
];

const router = createRouter({
	history: createWebHistory(),
	routes,
});

router.beforeEach(async (to, from, next) => {
	NProgress.start();

	const token = getToken();
	const userStore = useUserStore();

	// 错误页面和登录页不需要权限检查
	if (to.path === '/403' || to.path === '/login' || to.path.startsWith('/404')) {
		next();
		return;
	}

	if (to.meta.requiresAuth !== false) {
		if (!token) {
			next({
				path: '/login',
				query: { redirect: to.fullPath },
			});
			return;
		}

		// 如果用户信息未加载，先加载用户信息
		if (!userStore.userInfo) {
			try {
				await userStore.getUserInfo();
			} catch (error) {
				console.error('获取用户信息失败:', error);
				next({ path: '/login' });
				return;
			}
		}

		// 检查角色权限
		if (to.meta.roles && Array.isArray(to.meta.roles) && to.meta.roles.length > 0) {
			const userRoles: string[] = userStore.roles || [];
			const hasPermission = to.meta.roles.some((role: string) => userRoles.includes(role));

			if (!hasPermission) {
				// 避免循环重定向：如果是从403页面跳转过来的，不再重定向
				if (from.path !== '/403') {
					next({ path: '/403' });
					return;
				} else {
					// 如果已经在403页面，跳转到用户有权限的默认首页
					const defaultPath = getDefaultPathByRole(userStore.roles[0]);
					next({ path: defaultPath });
					return;
				}
			}
		}
	}

	// 已登录用户访问登录页，重定向到首页
	if (to.path === '/login' && token) {
		const defaultPath = getDefaultPathByRole(userStore.roles?.[0]);
		next({ path: defaultPath || '/' });
		return;
	}

	next();
});

// 根据角色获取默认首页路径
function getDefaultPathByRole(role?: string): string {
	switch (role) {
		case 'super_admin':
			return '/dashboard/analysis';
		case 'content_admin':
			return '/question/course';
		case 'agent':
			return '/dashboard/agent-workbench';
		default:
			return '/dashboard';
	}
}

router.afterEach(() => {
	NProgress.done();
});

export default router;
