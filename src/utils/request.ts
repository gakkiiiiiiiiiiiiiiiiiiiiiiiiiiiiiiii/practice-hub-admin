import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { message } from 'ant-design-vue';
import { getToken, clearAuth } from './auth';
import router from '@/router';

// 解决类型“ImportMeta”上不存在属性“env”问题：
// 用全局声明文件声明 VITE_API_BASE_URL，或直接用 process.env（见 Dockerfile, vite.config）
// 这里优先从 process.env.VITE_API_BASE_URL 取，其次 '/api'
const API_BASE_URL: string =
	typeof process !== 'undefined' && process.env && process.env.VITE_API_BASE_URL
		? process.env.VITE_API_BASE_URL
		: '/api';

const service: AxiosInstance = axios.create({
	baseURL: API_BASE_URL,
	timeout: 30000,
});

// 请求拦截器
service.interceptors.request.use(
	(config: InternalAxiosRequestConfig) => {
		const token = getToken();
		if (token && config.headers) {
			config.headers.Authorization = `Bearer ${token}`;
		}
		return config;
	},
	(error) => {
		console.error('请求错误:', error);
		return Promise.reject(error);
	}
);

// 响应拦截器
service.interceptors.response.use(
	(response: AxiosResponse) => {
		const res = response.data;

		// 后端响应格式：{ code, msg, data }
		// 如果返回的状态码不是200，则视为错误
		if (res.code !== 200 && res.code !== 0) {
			message.error(res.msg || res.message || '请求失败');

			// 401: 未授权，清除token并跳转到登录页
			if (res.code === 401) {
				clearAuth();
				router.push('/login');
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
				clearAuth();
				router.push('/login');
				message.error('登录已过期，请重新登录');
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
	}
);

export default service;
