import axios, { AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { message } from 'ant-design-vue';
import { getToken, clearAuth } from './auth';
import router from '@/router';
import { useUserStore } from '@/store/user';

// 使用 Vite 的环境变量
// Vite 会将 VITE_ 开头的环境变量注入到 import.meta.env 中
// 在 vite.config.ts 中通过 define 确保环境变量被正确注入
const API_BASE_URL: string = import.meta.env.VITE_API_BASE_URL || '/api';

// 开发环境打印 API 地址，方便调试

const service: AxiosInstance = axios.create({
	baseURL: API_BASE_URL,
	timeout: 30000,
});

// 请求拦截器
service.interceptors.request.use(
	(config: InternalAxiosRequestConfig) => {
		console.log('🔗 API Base URL:', API_BASE_URL);
		console.log('📦 import.meta.env:', import.meta.env);
		const token = getToken();
		if (token && config.headers) {
			config.headers.Authorization = `Bearer ${token}`;
		}
		return config;
	},
	(error) => {
		console.error('请求错误:', error);
		return Promise.reject(error);
	},
);

// 响应拦截器
service.interceptors.response.use(
	(response: AxiosResponse) => {
		// 如果是 blob 类型响应（文件下载），直接返回 response.data
		if (response.config.responseType === 'blob' || response.data instanceof Blob) {
			return response.data;
		}

		const res = response.data;

		// 后端响应格式：{ code, msg, data }
		// 如果返回的状态码不是200，则视为错误
		if (res.code !== 200 && res.code !== 0) {
			message.error(res.msg || res.message || '请求失败');

			// 401: 未授权，清除token并跳转到登录页
			if (res.code === 401) {
				handleUnauthorized();
			}

			return Promise.reject(new Error(res.msg || res.message || '请求失败'));
		}

		return res;
	},
	(error) => {
		console.error('响应错误:', error);

		if (error.response) {
			const { status } = error.response;

			if (status === 401) {
				handleUnauthorized();
			} else if (status === 403) {
				message.error('没有权限访问');
			} else if (status === 500) {
				message.error('服务器错误');
			} else {
				const errorData = error.response.data;
				message.error(errorData?.msg || errorData?.message || '请求失败');
			}
		} else {
			message.error('网络错误，请检查网络连接');
		}

		return Promise.reject(error);
	},
);

// 处理未授权错误：清除认证信息并跳转到登录页
function handleUnauthorized() {
	const userStore = useUserStore();
	// 清除认证信息
	clearAuth();
	// 清除用户 store 状态
	userStore.logout();
	// 显示提示信息
	message.error('登录已过期，请重新登录');
	// 强制跳转到登录页，即使当前在404页面
	if (router.currentRoute.value.path !== '/login') {
		router.replace({
			path: '/login',
			query: { redirect: router.currentRoute.value.fullPath },
		});
	}
}

export default service;
