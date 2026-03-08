<template>
	<div class="banner-config">
		<a-button type="primary" @click="handleAdd" style="margin-bottom: 16px">
			<template #icon><plus-outlined /></template>
			添加轮播图
		</a-button>

		<a-table :columns="columns" :data-source="banners" :loading="loading" row-key="id" :pagination="false">
			<template #bodyCell="{ column, record }">
				<template v-if="column.key === 'image'">
					<a-image
						:src="getProxiedImageUrl(record.image)"
						:width="120"
						:height="60"
						style="object-fit: cover"
						:preview="true"
						:fallback="'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwIiBoZWlnaHQ9IjYwIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxMjAiIGhlaWdodD0iNjAiIGZpbGw9IiNmNWY1ZjUiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPuaXoOazleWKoOi9veWbvueJhzwvdGV4dD48L3N2Zz4='"
					>
						<template #placeholder>
							<div
								style="
									width: 120px;
									height: 60px;
									display: flex;
									align-items: center;
									justify-content: center;
									background: #f5f5f5;
									border-radius: 4px;
								"
							>
								<a-spin size="small" />
							</div>
						</template>
					</a-image>
				</template>
				<template v-else-if="column.key === 'link'">
					<a :href="record.link" target="_blank" v-if="record.link">{{ record.link }}</a>
					<span v-else style="color: #999">-</span>
				</template>
				<template v-else-if="column.key === 'status'">
					<a-tag :color="record.status === 1 ? 'green' : 'red'">
						{{ record.status === 1 ? '启用' : '禁用' }}
					</a-tag>
				</template>
				<template v-else-if="column.key === 'action'">
					<a-space>
						<a-button type="link" size="small" @click="handleEdit(record)">编辑</a-button>
						<a-popconfirm title="确定要删除吗？" @confirm="handleDelete(record)">
							<a-button type="link" danger size="small">删除</a-button>
						</a-popconfirm>
					</a-space>
				</template>
			</template>
		</a-table>

		<a-modal
			v-model:open="modalVisible"
			:title="currentRecord ? '编辑轮播图' : '添加轮播图'"
			@ok="handleSubmit"
			@cancel="handleCancel"
			:confirmLoading="uploadLoading"
		>
			<a-form :model="formState" :label-col="{ span: 6 }" :wrapper-col="{ span: 18 }">
				<a-form-item label="图片" required>
					<a-upload
						v-model:file-list="fileList"
						:before-upload="beforeUpload"
						:customRequest="handleUpload"
						list-type="picture-card"
						:max-count="1"
						:show-upload-list="true"
						@remove="handleRemoveImage"
						:disabled="uploadLoading"
					>
						<template v-if="fileList.length < 1">
							<div v-if="!uploadLoading">
								<plus-outlined />
								<div style="margin-top: 8px">上传</div>
							</div>
							<div v-else style="display: flex; flex-direction: column; align-items: center; justify-content: center">
								<a-spin size="large" />
								<div style="margin-top: 8px; color: #1890ff">上传中...</div>
							</div>
						</template>
					</a-upload>
					<div v-if="uploadLoading" style="margin-top: 8px; color: #1890ff; font-size: 12px">
						<a-spin size="small" style="margin-right: 4px" />
						正在上传图片，请稍候...
					</div>
				</a-form-item>
				<a-form-item label="标题">
					<a-input v-model:value="formState.title" placeholder="请输入标题（可选）" />
				</a-form-item>
				<a-form-item label="跳转类型">
					<a-radio-group v-model:value="linkType" @change="handleLinkTypeChange">
						<a-radio value="page">小程序页面</a-radio>
						<a-radio value="url">外部链接</a-radio>
						<a-radio value="none">不跳转</a-radio>
					</a-radio-group>
				</a-form-item>
				<a-form-item v-if="linkType === 'page'" label="选择页面">
					<a-select
						v-model:value="formState.link"
						placeholder="请选择小程序页面"
						allow-clear
						:loading="pageRoutesLoading"
						show-search
						:filter-option="filterPageRoute"
						:options="selectOptions"
					>
					</a-select>
					<div style="margin-top: 8px">
						<a-button type="link" size="small" @click="refreshPageRoutes" :loading="pageRoutesLoading">
							刷新页面列表
						</a-button>
						<span style="margin-left: 8px; color: #999; font-size: 12px"> 共 {{ pageRoutes.length }} 个页面 </span>
					</div>
				</a-form-item>
				<a-form-item v-if="linkType === 'page' && formState.link === 'custom'" label="页面路径">
					<a-input
						v-model:value="customPagePath"
						placeholder="请输入页面路径，如：/pages/sub-pages/course-intro/index?id=123"
					/>
					<div style="margin-top: 8px; color: #999; font-size: 12px">
						支持带参数，如：/pages/sub-pages/course-intro/index?id=123
					</div>
				</a-form-item>
				<a-form-item v-if="linkType === 'url'" label="外部链接">
					<a-input v-model:value="formState.link" placeholder="请输入完整URL，如：https://example.com" />
				</a-form-item>
				<a-form-item label="排序号">
					<a-input-number v-model:value="formState.sortOrder" :min="0" placeholder="数字越小越靠前" />
				</a-form-item>
				<a-form-item label="状态">
					<a-radio-group v-model:value="formState.status">
						<a-radio :value="1">启用</a-radio>
						<a-radio :value="0">禁用</a-radio>
					</a-radio-group>
				</a-form-item>
			</a-form>
		</a-modal>
	</div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue';
import { message } from 'ant-design-vue';
import { PlusOutlined } from '@ant-design/icons-vue';
import { getBannerList, createBanner, updateBanner, deleteBanner } from '@/api/banner';
import { uploadImage } from '@/api/upload';
import { getProxiedImageUrl } from '@/utils/imageProxy';
import { getPageRoutes } from '@/api/page-route';

const loading = ref(false);
const banners = ref<any[]>([]);
const modalVisible = ref(false);
const currentRecord = ref<any | null>(null);
const fileList = ref<any[]>([]);
const uploadLoading = ref(false);
const linkType = ref<'page' | 'url' | 'none'>('none');
const customPagePath = ref('');
const pageRoutes = ref<any[]>([]);
const pageRoutesLoading = ref(false);

const columns = [
	{
		title: '图片',
		key: 'image',
		width: 150,
	},
	{
		title: '标题',
		dataIndex: 'title',
		key: 'title',
		width: 150,
	},
	{
		title: '跳转链接',
		key: 'link',
		ellipsis: true,
	},
	{
		title: '排序号',
		dataIndex: 'sortOrder',
		key: 'sortOrder',
		width: 100,
	},
	{
		title: '状态',
		key: 'status',
		width: 100,
	},
	{
		title: '操作',
		key: 'action',
		width: 150,
		fixed: 'right',
	},
];

const formState = ref({
	image: '',
	link: '',
	title: '',
	sortOrder: 0,
	status: 1,
});

const fetchBanners = async () => {
	loading.value = true;
	try {
		const res = await getBannerList({ page: 1, pageSize: 100 });
		banners.value = res.data.list || [];
	} catch (error: any) {
		message.error(error?.message || '获取轮播图列表失败');
	} finally {
		loading.value = false;
	}
};

const beforeUpload = (file: File) => {
	const isImage = file.type.startsWith('image/');
	if (!isImage) {
		message.error('只能上传图片文件!');
		return false;
	}
	const isLt5M = file.size / 1024 / 1024 < 5;
	if (!isLt5M) {
		message.error('图片大小不能超过 5MB!');
		return false;
	}
	// 返回 true 允许上传，然后在 customRequest 中处理
	return true;
};

const handleUpload = async (options: any) => {
	const { file, onSuccess, onError } = options;

	try {
		uploadLoading.value = true;

		// 先设置文件状态为 uploading，显示上传进度
		const fileIndex = fileList.value.findIndex((item: any) => item.uid === file.uid);
		if (fileIndex !== -1) {
			fileList.value[fileIndex].status = 'uploading';
			fileList.value[fileIndex].percent = 50;
		} else {
			// 添加新文件（替换旧文件）
			fileList.value = [
				{
					uid: file.uid || Date.now().toString(),
					name: file.name || 'banner.png',
					status: 'uploading',
					percent: 50,
				},
			];
		}

		const response = await uploadImage(file as File);
		const url = response.url || response.imageUrl;

		if (url) {
			formState.value.image = url;
			// 更新 fileList 显示上传的图片
			const currentFileIndex = fileList.value.findIndex((item: any) => item.uid === file.uid);
			if (currentFileIndex !== -1) {
				// 更新现有文件
				fileList.value[currentFileIndex] = {
					...fileList.value[currentFileIndex],
					status: 'done',
					url: url,
					response: response,
					percent: 100,
				};
			} else {
				// 添加新文件（替换旧文件）
				fileList.value = [
					{
						uid: file.uid || Date.now().toString(),
						name: file.name || 'banner.png',
						status: 'done',
						url: url,
						response: response,
						percent: 100,
					},
				];
			}
			onSuccess?.(response, file);
			message.success('上传成功');
		} else {
			throw new Error('上传失败：未返回图片URL');
		}
	} catch (error: any) {
		console.error('图片上传失败:', error);
		message.error(error?.message || '图片上传失败');
		// 更新文件状态为错误
		const errorFileIndex = fileList.value.findIndex((item: any) => item.uid === file.uid);
		if (errorFileIndex !== -1) {
			fileList.value[errorFileIndex].status = 'error';
			fileList.value[errorFileIndex].percent = 0;
		}
		onError?.(error);
	} finally {
		uploadLoading.value = false;
	}
};

const handleLinkTypeChange = () => {
	if (linkType.value === 'none') {
		formState.value.link = '';
		customPagePath.value = '';
	} else if (linkType.value === 'page') {
		// 如果是外部链接，清空
		if (
			formState.value.link &&
			(formState.value.link.startsWith('http://') || formState.value.link.startsWith('https://'))
		) {
			formState.value.link = '';
		}
	} else if (linkType.value === 'url') {
		// 如果是页面路径，清空
		if (formState.value.link && formState.value.link.startsWith('/pages')) {
			formState.value.link = '';
		}
		customPagePath.value = '';
	}
};

const handleAdd = () => {
	currentRecord.value = null;
	formState.value = {
		image: '',
		link: '',
		title: '',
		sortOrder: banners.value.length,
		status: 1,
	};
	fileList.value = [];
	linkType.value = 'none';
	customPagePath.value = '';
	// 打开弹窗时刷新页面列表，确保数据最新
	if (pageRoutes.value.length === 0) {
		fetchPageRoutes();
	}
	modalVisible.value = true;
};

const handleEdit = (record: any) => {
	currentRecord.value = record;
	formState.value = {
		image: record.image || '',
		link: record.link || '',
		title: record.title || '',
		sortOrder: record.sortOrder || 0,
		status: record.status !== undefined ? record.status : 1,
	};

	// 判断链接类型
	if (!record.link) {
		linkType.value = 'none';
		customPagePath.value = '';
	} else if (record.link.startsWith('http://') || record.link.startsWith('https://')) {
		linkType.value = 'url';
		customPagePath.value = '';
	} else if (record.link.startsWith('/pages')) {
		linkType.value = 'page';
		// 检查是否是数据库中的页面路径
		const linkPath = record.link.split('?')[0]; // 去掉参数部分
		const route = pageRoutes.value.find((r) => r.path === linkPath);

		if (route) {
			// 如果是数据库中的页面，检查是否有参数
			if (record.link !== linkPath) {
				// 有参数，使用自定义路径
				customPagePath.value = record.link;
				formState.value.link = 'custom';
			} else {
				// 无参数，使用预设路径
				formState.value.link = linkPath;
				customPagePath.value = '';
			}
		} else {
			// 不在数据库中的路径，使用自定义路径
			customPagePath.value = record.link;
			formState.value.link = 'custom';
		}
	} else {
		linkType.value = 'none';
		customPagePath.value = '';
	}

	if (record.image) {
		fileList.value = [
			{
				uid: '-1',
				name: 'banner.png',
				status: 'done',
				url: record.image,
			},
		];
	} else {
		fileList.value = [];
	}
	// 打开弹窗时刷新页面列表，确保数据最新
	if (pageRoutes.value.length === 0) {
		fetchPageRoutes();
	}
	modalVisible.value = true;
};

const handleCancel = () => {
	modalVisible.value = false;
	currentRecord.value = null;
	formState.value = {
		image: '',
		link: '',
		title: '',
		sortOrder: 0,
		status: 1,
	};
	fileList.value = [];
	linkType.value = 'none';
	customPagePath.value = '';
};

const handleRemoveImage = () => {
	formState.value.image = '';
	fileList.value = [];
};

const handleDelete = async (record: any) => {
	try {
		await deleteBanner(record.id);
		message.success('删除成功');
		fetchBanners();
	} catch (error: any) {
		message.error(error?.message || '删除失败');
	}
};

const handleSubmit = async () => {
	if (!formState.value.image) {
		message.error('请上传图片');
		return;
	}

	// 处理链接
	let finalLink = '';
	if (linkType.value === 'page') {
		if (formState.value.link === 'custom') {
			finalLink = customPagePath.value;
		} else {
			finalLink = formState.value.link || '';
		}
	} else if (linkType.value === 'url') {
		finalLink = formState.value.link || '';
	} else {
		finalLink = '';
	}

	try {
		if (currentRecord.value) {
			// 更新
			await updateBanner(currentRecord.value.id, {
				image: formState.value.image,
				link: finalLink,
				title: formState.value.title,
				sort_order: formState.value.sortOrder,
				status: formState.value.status,
			});
			message.success('更新成功');
		} else {
			// 创建
			await createBanner({
				image: formState.value.image,
				link: finalLink,
				title: formState.value.title,
				sort_order: formState.value.sortOrder,
				status: formState.value.status,
			});
			message.success('创建成功');
		}
		modalVisible.value = false;
		fetchBanners();
	} catch (error: any) {
		message.error(error?.message || '操作失败');
	}
};

// 监听自定义路径变化
watch(customPagePath, () => {
	if (linkType.value === 'page' && formState.value.link === 'custom') {
		// 自定义路径变化时，不需要更新 formState.link，在提交时使用 customPagePath
	}
});

// 页面路由分组
const pageRouteGroups = computed(() => {
	const groups: Record<string, { type: string; label: string; routes: any[] }> = {
		tabBar: { type: 'tabBar', label: 'TabBar 页面', routes: [] },
		main: { type: 'main', label: '主包页面', routes: [] },
		sub: { type: 'sub', label: '子包页面', routes: [] },
	};

	pageRoutes.value.forEach((route) => {
		if (route.status === 1 && groups[route.type]) {
			groups[route.type].routes.push(route);
		}
	});

	return Object.values(groups).filter((group) => group.routes.length > 0);
});

// Select 组件的 options 格式（支持分组）
const selectOptions = computed(() => {
	const options: any[] = [];

	pageRouteGroups.value.forEach((group) => {
		// 为每个分组创建选项数组
		const groupOptions = group.routes.map((route) => ({
			label: route.title,
			value: route.path,
		}));

		// 添加分组选项
		options.push({
			label: group.label,
			options: groupOptions,
		});
	});

	// 添加自定义路径选项
	options.push({
		label: '自定义路径',
		value: 'custom',
	});

	console.log('📊 selectOptions:', options);
	return options;
});

// 过滤页面路由
const filterPageRoute = (input: string, option: any) => {
	// 如果是分组标题，不参与过滤
	if (option.options) {
		return true;
	}

	// 自定义路径始终显示
	if (option.value === 'custom') {
		return true;
	}

	const route = pageRoutes.value.find((r) => r.path === option.value);
	if (!route) return false;
	return (
		route.title.toLowerCase().includes(input.toLowerCase()) || route.path.toLowerCase().includes(input.toLowerCase())
	);
};

// 获取页面路由列表
const fetchPageRoutes = async () => {
	pageRoutesLoading.value = true;
	try {
		const res = await getPageRoutes({ status: 1 });
		console.log('📋 获取页面路由列表响应:', res);
		// 响应拦截器返回的是 { code, msg, data } 格式
		const routes = Array.isArray(res?.data) ? res.data : [];
		console.log('📋 解析后的页面路由列表:', routes);
		console.log('📋 路由数量:', routes.length);
		pageRoutes.value = routes;
		if (routes.length === 0) {
			console.warn('⚠️ 页面路由列表为空，请先同步页面路由');
			message.warning('页面路由列表为空，请先在小程序端同步页面路由');
		}
	} catch (error: any) {
		console.error('获取页面路由列表失败:', error);
		message.error('获取页面路由列表失败: ' + (error?.message || '未知错误'));
		// 如果接口失败，使用默认的硬编码列表作为后备
		pageRoutes.value = [
			{ path: '/pages/index/index', title: '首页', type: 'tabBar', status: 1 },
			{ path: '/pages/bank/index', title: '题库', type: 'tabBar', status: 1 },
			{ path: '/pages/user/index', title: '我的', type: 'tabBar', status: 1 },
			{ path: '/pages/answer/index', title: '答题', type: 'main', status: 1 },
			{ path: '/pages/distributor/index', title: '分销中心', type: 'main', status: 1 },
			{ path: '/pages/exam/info', title: '模拟考试', type: 'main', status: 1 },
			{ path: '/pages/exam/records', title: '考试记录', type: 'main', status: 1 },
			{ path: '/pages/sub-pages/activation/index', title: '激活码兑换', type: 'sub', status: 1 },
			{ path: '/pages/sub-pages/order/index', title: '订单列表', type: 'sub', status: 1 },
			{ path: '/pages/sub-pages/wrong/index', title: '错题集', type: 'sub', status: 1 },
			{ path: '/pages/sub-pages/collection/index', title: '我的收藏', type: 'sub', status: 1 },
			{ path: '/pages/sub-pages/rank/index', title: '排行榜', type: 'sub', status: 1 },
			{ path: '/pages/sub-pages/trajectory/index', title: '学习轨迹', type: 'sub', status: 1 },
			{ path: '/pages/sub-pages/feedback/index', title: '功能反馈', type: 'sub', status: 1 },
			{ path: '/pages/sub-pages/course-intro/index', title: '课程介绍', type: 'sub', status: 1 },
			{ path: '/pages/sub-pages/bank-settings/index', title: '题库设置', type: 'sub', status: 1 },
			{ path: '/pages/sub-pages/settings/index', title: '设置', type: 'sub', status: 1 },
			{ path: '/pages/sub-pages/profile/index', title: '个人资料', type: 'sub', status: 1 },
		];
	} finally {
		pageRoutesLoading.value = false;
	}
};

const refreshPageRoutes = () => {
	fetchPageRoutes();
};

// 监听页面选择变化
watch(
	() => formState.value.link,
	(newVal) => {
		if (linkType.value === 'page' && newVal !== 'custom') {
			// 选择了预设页面，清空自定义路径
			customPagePath.value = '';
		}
	}
);

onMounted(() => {
	fetchBanners();
	fetchPageRoutes();
});
</script>
