import { defineConfig, loadEnv } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';
import { viteMockServe } from 'vite-plugin-mock';

export default defineConfig(({ mode }) => {
	// 加载环境变量
	// loadEnv 会从 .env 文件和系统环境变量中读取
	// 在 Docker 构建时，系统环境变量会被 loadEnv 读取
	const env = loadEnv(mode, process.cwd(), '');

	// 是否启用代理（当后端服务可用时设置为 true）
	// 开发时如果后端未启动，设置为 false 以使用 Mock
	const enableProxy = env.VITE_ENABLE_PROXY === 'true';

	// 从环境变量获取 API 基础地址和代理目标
	// VITE_API_BASE_URL: 生产环境使用的 API 基础地址（如：https://api.example.com）
	// VITE_PROXY_TARGET: 开发环境代理目标（如：http://localhost:3333）
	// 优先使用系统环境变量（Docker 构建时），然后使用 .env 文件中的值
	const apiBaseUrl = process.env.VITE_API_BASE_URL || env.VITE_API_BASE_URL || '/api';
	const proxyTarget = process.env.VITE_PROXY_TARGET || env.VITE_PROXY_TARGET || 'http://localhost:3333';

	return {
		plugins: [
			vue(),
			viteMockServe({
				mockPath: 'src/mock/modules',
				enable: !enableProxy, // 当启用代理时，禁用 Mock
				watchFiles: true,
			}),
		],
		resolve: {
			alias: {
				'@': resolve(__dirname, 'src'),
			},
		},
		server: {
			port: Number(env.VITE_PORT) || 3000,
			open: true,
			// 代理配置：仅在启用时使用
			// 当后端服务启动后，设置环境变量 VITE_ENABLE_PROXY=true 来启用代理
			proxy: enableProxy
				? {
						'/api': {
							target: proxyTarget,
							changeOrigin: true,
							secure: false,
							// 后端已设置全局前缀 'api'，所以不需要 rewrite
							// rewrite: (path) => path.replace(/^\/api/, ''),
						},
				  }
				: undefined,
		},
		build: {
			outDir: 'dist',
			sourcemap: false,
			chunkSizeWarningLimit: 1500,
		},
		// 将环境变量注入到 import.meta.env 中
		// 这样在代码中可以通过 import.meta.env.VITE_API_BASE_URL 访问
		define: {
			'import.meta.env.VITE_API_BASE_URL': JSON.stringify(apiBaseUrl),
		},
	};
});
