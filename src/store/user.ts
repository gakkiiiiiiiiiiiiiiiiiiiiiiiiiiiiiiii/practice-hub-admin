import { defineStore } from 'pinia';
import { ref } from 'vue';
import { login, getUserInfo as fetchUserInfo } from '@/api/user';
import {
	setToken,
	getToken,
	setUserInfo,
	removeToken,
	removeUserInfo,
	getUserInfo as getStoredUserInfo,
} from '@/utils/auth';
import router from '@/router';

export interface UserInfo {
	id: number;
	username: string;
	nickname: string;
	avatar?: string;
	roles: string[];
	permissions?: string[];
}

export const useUserStore = defineStore('user', () => {
	const token = ref<string | null>(getToken());
	// 从 localStorage 恢复用户信息（如果存在）
	const savedUserInfo = getStoredUserInfo();
	const userInfo = ref<UserInfo | null>(savedUserInfo);
	const roles = ref<string[]>(savedUserInfo?.roles || []);

	// 登录
	const loginAction = async (username: string, password: string) => {
		try {
			const res = await login({ username, password });
			// 后端返回格式：{ token, admin: { id, username, role, balance } }
			const { token: newToken, admin: adminData } = res.data;

			// 将后端返回的管理员数据转换为前端需要的格式
			const info = {
				id: adminData.id,
				username: adminData.username,
				nickname: adminData.username, // 如果没有 nickname，使用 username
				avatar: '',
				roles: [adminData.role], // 后端返回的是 role，转换为数组
				permissions: [],
			};

			token.value = newToken;
			setToken(newToken);
			setUserInfo(info);
			userInfo.value = info;
			roles.value = [adminData.role];

			return res;
		} catch (error) {
			console.error('登录失败:', error);
			throw error;
		}
	};

	// 获取用户信息
	const getUserInfo = async () => {
		try {
			// #region agent log
			fetch('http://127.0.0.1:7242/ingest/edfe94a8-eb8e-4bce-92a0-b96513a794f5', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					location: 'user.ts:62',
					message: 'getUserInfo start',
					data: { hasExistingUserInfo: !!userInfo.value },
					timestamp: Date.now(),
					sessionId: 'debug-session',
					runId: 'run1',
					hypothesisId: 'C',
				}),
			}).catch(() => {});
			// #endregion
			const res = await fetchUserInfo();
			const userData = res.data;

			// 将后端返回的数据转换为前端需要的格式
			const info = {
				id: userData.id,
				username: userData.username || '',
				nickname: userData.nickname || '',
				avatar: userData.avatar || '',
				roles: userData.role ? [userData.role] : [],
				permissions: userData.permissions || [],
			};

			// #region agent log
			fetch('http://127.0.0.1:7242/ingest/edfe94a8-eb8e-4bce-92a0-b96513a794f5', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					location: 'user.ts:76',
					message: 'Setting userInfo and roles',
					data: { role: userData.role, rolesCount: info.roles.length },
					timestamp: Date.now(),
					sessionId: 'debug-session',
					runId: 'run1',
					hypothesisId: 'C',
				}),
			}).catch(() => {});
			// #endregion
			userInfo.value = info;
			roles.value = info.roles;
			setUserInfo(info);
			// #region agent log
			fetch('http://127.0.0.1:7242/ingest/edfe94a8-eb8e-4bce-92a0-b96513a794f5', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					location: 'user.ts:80',
					message: 'getUserInfo completed',
					data: { hasUserInfo: !!userInfo.value, rolesLength: roles.value.length },
					timestamp: Date.now(),
					sessionId: 'debug-session',
					runId: 'run1',
					hypothesisId: 'C',
				}),
			}).catch(() => {});
			// #endregion
			return info;
		} catch (error) {
			console.error('获取用户信息失败:', error);
			throw error;
		}
	};

	// 登出
	const logout = () => {
		token.value = null;
		userInfo.value = null;
		roles.value = [];
		removeToken();
		removeUserInfo();
		router.push('/login');
	};

	// 检查是否有权限
	const hasRole = (role: string): boolean => {
		return roles.value.includes(role);
	};

	const hasPermission = (permission: string): boolean => {
		return userInfo.value?.permissions?.includes(permission) || false;
	};

	return {
		token,
		userInfo,
		roles,
		loginAction,
		getUserInfo,
		logout,
		hasRole,
		hasPermission,
	};
});
