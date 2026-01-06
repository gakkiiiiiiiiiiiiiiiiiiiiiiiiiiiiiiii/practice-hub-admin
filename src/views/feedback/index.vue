<template>
	<div class="feedback-list">
		<a-card>
			<template #title>功能反馈管理</template>
			<template #extra>
				<a-button type="primary" @click="handleOpenSubmitModal">
					<template #icon>
						<PlusOutlined />
					</template>
					提交反馈
				</a-button>
			</template>

			<!-- 搜索栏 -->
			<a-form :model="searchForm" layout="inline" class="search-form">
				<a-form-item label="反馈类型">
					<a-select v-model:value="searchForm.type" placeholder="全部" style="width: 150px" allow-clear>
						<a-select-option value="bug">缺陷</a-select-option>
						<a-select-option value="style">样式优化</a-select-option>
						<a-select-option value="feature">功能需求</a-select-option>
					</a-select>
				</a-form-item>
				<a-form-item label="处理状态">
					<a-select v-model:value="searchForm.status" placeholder="全部" style="width: 150px" allow-clear>
						<a-select-option value="pending">待处理</a-select-option>
						<a-select-option value="processing">处理中</a-select-option>
						<a-select-option value="resolved">已解决</a-select-option>
						<a-select-option value="rejected">已拒绝</a-select-option>
					</a-select>
				</a-form-item>
				<a-form-item>
					<a-button type="primary" @click="handleSearch">搜索</a-button>
					<a-button style="margin-left: 8px" @click="handleReset">重置</a-button>
				</a-form-item>
			</a-form>

			<!-- 表格 -->
			<a-table
				:columns="columns"
				:data-source="dataSource"
				:loading="loading"
				:pagination="pagination"
				@change="handleTableChange"
				row-key="id"
			>
				<template #bodyCell="{ column, record }">
					<template v-if="column.key === 'user'">
						<a-space>
							<a-avatar :src="record.user?.avatar" :size="32">
								{{ record.user?.nickname?.[0] || 'U' }}
							</a-avatar>
							<span>{{ record.user?.nickname || '未知用户' }}</span>
						</a-space>
					</template>
					<template v-else-if="column.key === 'type'">
						<a-tag :color="getTypeColor(record.type)">
							{{ getTypeLabel(record.type) }}
						</a-tag>
					</template>
					<template v-else-if="column.key === 'status'">
						<a-tag :color="getStatusColor(record.status)">
							{{ getStatusLabel(record.status) }}
						</a-tag>
					</template>
					<template v-else-if="column.key === 'description'">
						<div class="description-cell">
							{{ record.description }}
							<a-button
								v-if="record.images && record.images.length > 0"
								type="link"
								size="small"
								@click="handleViewImages(record)"
							>
								查看图片({{ record.images.length }})
							</a-button>
						</div>
					</template>
					<template v-else-if="column.key === 'action'">
						<a-space>
							<a-button type="link" size="small" @click="handleViewDetail(record)"> 查看详情 </a-button>
							<a-button
								v-if="record.status === 'pending'"
								type="link"
								size="small"
								@click="handleUpdateStatus(record, 'processing')"
							>
								开始处理
							</a-button>
							<a-button
								v-if="record.status === 'processing'"
								type="link"
								size="small"
								@click="handleUpdateStatus(record, 'resolved')"
							>
								标记已解决
							</a-button>
							<a-button type="link" size="small" danger @click="handleDelete(record)"> 删除 </a-button>
						</a-space>
					</template>
				</template>
			</a-table>
		</a-card>

		<!-- 详情弹窗 -->
		<a-modal v-model:open="detailModalVisible" title="反馈详情" width="800px" :footer="null">
			<div v-if="currentRecord" class="feedback-detail">
				<a-descriptions :column="2" bordered>
					<a-descriptions-item label="反馈ID">{{ currentRecord.id }}</a-descriptions-item>
					<a-descriptions-item label="反馈类型">
						<a-tag :color="getTypeColor(currentRecord.type)">
							{{ getTypeLabel(currentRecord.type) }}
						</a-tag>
					</a-descriptions-item>
					<a-descriptions-item label="处理状态">
						<a-tag :color="getStatusColor(currentRecord.status)">
							{{ getStatusLabel(currentRecord.status) }}
						</a-tag>
					</a-descriptions-item>
					<a-descriptions-item label="提交时间">
						{{ formatDate(currentRecord.create_time) }}
					</a-descriptions-item>
					<a-descriptions-item label="用户信息" :span="2">
						<a-space>
							<a-avatar :src="currentRecord.user?.avatar" :size="40">
								{{ currentRecord.user?.nickname?.[0] || 'U' }}
							</a-avatar>
							<span>{{ currentRecord.user?.nickname || '未知用户' }}</span>
						</a-space>
					</a-descriptions-item>
					<a-descriptions-item label="问题描述" :span="2">
						<div class="description-text">{{ currentRecord.description }}</div>
					</a-descriptions-item>
					<a-descriptions-item
						v-if="currentRecord.images && currentRecord.images.length > 0"
						label="相关图片"
						:span="2"
					>
						<div class="image-list">
							<a-image
								v-for="(img, index) in currentRecord.images"
								:key="index"
								:src="img"
								:width="150"
								:preview="true"
								style="margin-right: 8px; margin-bottom: 8px"
							/>
						</div>
					</a-descriptions-item>
					<a-descriptions-item v-if="currentRecord.reply" label="管理员回复" :span="2">
						<div class="reply-text">{{ currentRecord.reply }}</div>
					</a-descriptions-item>
				</a-descriptions>

				<div class="action-section">
					<a-divider />
					<a-form :model="replyForm" layout="vertical">
						<a-form-item label="管理员回复">
							<a-textarea v-model:value="replyForm.reply" :rows="4" placeholder="请输入回复内容" />
						</a-form-item>
						<a-form-item>
							<a-space>
								<a-button type="primary" :loading="replyLoading" @click="handleSubmitReply(currentRecord.id)">
									提交回复
								</a-button>
								<a-button
									v-if="currentRecord.status !== 'resolved' && currentRecord.status !== 'rejected'"
									type="default"
									:loading="replyLoading"
									@click="handleReply(currentRecord.id)"
								>
									回复并标记已解决
								</a-button>
							</a-space>
						</a-form-item>
					</a-form>
				</div>
			</div>
		</a-modal>

		<!-- 图片预览弹窗 -->
		<a-modal v-model:open="imageModalVisible" title="反馈图片" width="800px" :footer="null">
			<div v-if="currentImages && currentImages.length > 0" class="image-preview">
				<a-image-preview-group>
					<a-image v-for="(img, index) in currentImages" :key="index" :src="img" :width="200" style="margin: 8px" />
				</a-image-preview-group>
			</div>
		</a-modal>

		<!-- 删除确认弹窗 -->
		<a-modal
			v-model:open="deleteModalVisible"
			title="删除反馈"
			:confirm-loading="deleteLoading"
			@ok="confirmDelete"
			@cancel="handleCancelDelete"
		>
			<p>确定要删除这条反馈吗？删除后无法恢复。</p>
		</a-modal>

		<!-- 提交反馈弹窗 -->
		<a-modal
			v-model:open="submitModalVisible"
			title="提交反馈"
			width="600px"
			:confirm-loading="submitLoading"
			@ok="handleSubmitFeedback"
			@cancel="handleCancelSubmit"
		>
			<a-form :model="submitForm" layout="vertical">
				<a-form-item label="反馈类型" name="type" :rules="[{ required: true, message: '请选择反馈类型' }]">
					<a-radio-group v-model:value="submitForm.type">
						<a-radio value="bug">
							<span style="margin-left: 8px">🐛 缺陷</span>
						</a-radio>
						<a-radio value="style">
							<span style="margin-left: 8px">🎨 样式优化</span>
						</a-radio>
						<a-radio value="feature">
							<span style="margin-left: 8px">💡 功能需求</span>
						</a-radio>
					</a-radio-group>
				</a-form-item>
				<a-form-item
					label="问题描述"
					name="description"
					:rules="[
						{ required: true, message: '请输入问题描述' },
						{ min: 5, message: '问题描述至少5个字符' },
						{ max: 2000, message: '问题描述最多2000个字符' },
					]"
				>
					<a-textarea
						v-model:value="submitForm.description"
						:rows="6"
						placeholder="请详细描述您遇到的问题或建议（至少5个字符）"
						:maxlength="2000"
						show-count
					/>
				</a-form-item>
				<a-form-item label="相关图片（可选）">
					<a-upload
						v-model:file-list="submitForm.imageList"
						list-type="picture-card"
						:before-upload="handleBeforeUpload"
						:custom-request="handleImageUpload"
						:max-count="9"
						accept="image/*"
					>
						<div v-if="submitForm.imageList.length < 9">
							<PlusOutlined />
							<div style="margin-top: 8px">上传图片</div>
						</div>
					</a-upload>
					<div class="upload-tip">最多可上传9张图片，每张不超过5MB</div>
				</a-form-item>
			</a-form>
		</a-modal>
	</div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { message } from 'ant-design-vue';
import { PlusOutlined } from '@ant-design/icons-vue';
import type { UploadFile } from 'ant-design-vue';
import {
	getFeedbackList,
	getAdminFeedbackDetail,
	updateFeedback,
	deleteFeedback,
	createAdminFeedback,
	type Feedback,
	type GetFeedbackListParams,
	type CreateFeedbackDto,
} from '@/api/feedback';
import { uploadImage } from '@/api/upload';
import dayjs from 'dayjs';

const loading = ref(false);
const dataSource = ref<Feedback[]>([]);
const detailModalVisible = ref(false);
const imageModalVisible = ref(false);
const currentRecord = ref<Feedback | null>(null);
const currentImages = ref<string[]>([]);
const replyLoading = ref(false);
const submitModalVisible = ref(false);
const submitLoading = ref(false);
const deleteModalVisible = ref(false);
const deletingId = ref<number | null>(null);
const deleteLoading = ref(false);
const submitForm = ref<{
	type: 'bug' | 'style' | 'feature';
	description: string;
	imageList: UploadFile[];
}>({
	type: 'bug',
	description: '',
	imageList: [],
});

const searchForm = ref<GetFeedbackListParams>({
	type: undefined,
	status: undefined,
});

const pagination = ref({
	current: 1,
	pageSize: 10,
	total: 0,
});

const replyForm = ref({
	reply: '',
});

const columns = [
	{
		title: 'ID',
		dataIndex: 'id',
		key: 'id',
		width: 80,
	},
	{
		title: '用户',
		key: 'user',
		width: 150,
	},
	{
		title: '反馈类型',
		key: 'type',
		width: 120,
	},
	{
		title: '问题描述',
		key: 'description',
		ellipsis: true,
	},
	{
		title: '处理状态',
		key: 'status',
		width: 120,
	},
	{
		title: '提交时间',
		dataIndex: 'create_time',
		key: 'create_time',
		width: 180,
	},
	{
		title: '操作',
		key: 'action',
		width: 200,
		fixed: 'right',
	},
];

const getTypeLabel = (type: string) => {
	const map: Record<string, string> = {
		bug: '缺陷',
		style: '样式优化',
		feature: '功能需求',
	};
	return map[type] || type;
};

const getTypeColor = (type: string) => {
	const map: Record<string, string> = {
		bug: 'red',
		style: 'orange',
		feature: 'blue',
	};
	return map[type] || 'default';
};

const getStatusLabel = (status: string) => {
	const map: Record<string, string> = {
		pending: '待处理',
		processing: '处理中',
		resolved: '已解决',
		rejected: '已拒绝',
	};
	return map[status] || status;
};

const getStatusColor = (status: string) => {
	const map: Record<string, string> = {
		pending: 'orange',
		processing: 'blue',
		resolved: 'green',
		rejected: 'red',
	};
	return map[status] || 'default';
};

const formatDate = (date: string) => {
	return dayjs(date).format('YYYY-MM-DD HH:mm:ss');
};

const fetchData = async () => {
	loading.value = true;
	try {
		const params: GetFeedbackListParams = {
			page: pagination.value.current,
			pageSize: pagination.value.pageSize,
			...searchForm.value,
		};
		const res = await getFeedbackList(params);
		dataSource.value = res.data.list || [];
		pagination.value.total = res.data.total || 0;
	} catch (error: any) {
		message.error(error?.message || '获取反馈列表失败');
	} finally {
		loading.value = false;
	}
};

const handleSearch = () => {
	pagination.value.current = 1;
	fetchData();
};

const handleReset = () => {
	searchForm.value = {
		type: undefined,
		status: undefined,
	};
	pagination.value.current = 1;
	fetchData();
};

const handleTableChange = (pag: any) => {
	pagination.value.current = pag.current;
	pagination.value.pageSize = pag.pageSize;
	fetchData();
};

const handleViewDetail = async (record: Feedback) => {
	try {
		// 调用详情接口获取完整数据，确保 images 字段正确加载
		const res = await getAdminFeedbackDetail(record.id);
		currentRecord.value = res.data;
		replyForm.value.reply = res.data.reply || '';
		detailModalVisible.value = true;
	} catch (error: any) {
		message.error(error?.message || '获取反馈详情失败');
		// 如果获取详情失败，使用列表中的数据作为降级方案
		currentRecord.value = record;
		replyForm.value.reply = record.reply || '';
		detailModalVisible.value = true;
	}
};

const handleViewImages = (record: Feedback) => {
	currentImages.value = record.images || [];
	imageModalVisible.value = true;
};

const handleUpdateStatus = async (record: Feedback, status: string) => {
	try {
		await updateFeedback(record.id, { status: status as any });
		message.success('操作成功');
		fetchData();
	} catch (error: any) {
		message.error(error?.message || '操作失败');
	}
};

const handleDelete = (record: Feedback) => {
	deletingId.value = record.id;
	deleteModalVisible.value = true;
};

const handleCancelDelete = () => {
	deleteModalVisible.value = false;
	deletingId.value = null;
};

const confirmDelete = async () => {
	if (!deletingId.value) return;

	deleteLoading.value = true;
	try {
		await deleteFeedback(deletingId.value);
		message.success('删除成功');
		deleteModalVisible.value = false;
		deletingId.value = null;
		fetchData();
	} catch (error: any) {
		message.error(error?.message || '删除失败');
	} finally {
		deleteLoading.value = false;
	}
};

const handleSubmitReply = async (id: number) => {
	if (!replyForm.value.reply.trim()) {
		message.warning('请输入回复内容');
		return;
	}

	replyLoading.value = true;
	try {
		await updateFeedback(id, {
			reply: replyForm.value.reply,
		});
		message.success('回复成功');
		detailModalVisible.value = false;
		replyForm.value.reply = '';
		fetchData();
	} catch (error: any) {
		message.error(error?.message || '回复失败');
	} finally {
		replyLoading.value = false;
	}
};

const handleReply = async (id: number) => {
	if (!replyForm.value.reply.trim()) {
		message.warning('请输入回复内容');
		return;
	}

	replyLoading.value = true;
	try {
		await updateFeedback(id, {
			reply: replyForm.value.reply,
			status: 'resolved' as any,
		});
		message.success('回复成功并已标记为已解决');
		detailModalVisible.value = false;
		replyForm.value.reply = '';
		fetchData();
	} catch (error: any) {
		message.error(error?.message || '回复失败');
	} finally {
		replyLoading.value = false;
	}
};

const handleOpenSubmitModal = () => {
	submitForm.value = {
		type: 'bug',
		description: '',
		imageList: [],
	};
	submitModalVisible.value = true;
};

const handleCancelSubmit = () => {
	submitForm.value = {
		type: 'bug',
		description: '',
		imageList: [],
	};
	submitModalVisible.value = false;
};

const handleBeforeUpload = (file: File) => {
	const isImage = file.type.startsWith('image/');
	if (!isImage) {
		message.error('只能上传图片文件');
		return false;
	}
	const isLt5M = file.size / 1024 / 1024 < 5;
	if (!isLt5M) {
		message.error('图片大小不能超过5MB');
		return false;
	}
	return true; // 阻止自动上传，使用自定义上传
};

const handleImageUpload = async (options: any) => {
	const { file, onSuccess, onError } = options;
	try {
		const result = await uploadImage(file as File);
		const imageUrl = result.url || result.imageUrl;
		console.log('result', result);
		// 更新文件列表中的URL
		const fileList = submitForm.value.imageList;
		// 通过文件名或 uid 查找文件
		const index = fileList.findIndex((item) => {
			return item.uid === file.uid || (item.name === file.name && item.size === file.size);
		});

		if (index !== -1) {
			fileList[index].url = imageUrl;
			fileList[index].status = 'done';
			fileList[index].response = result; // 保存完整响应，方便后续提取
		} else {
			// 如果找不到，添加到列表末尾
			fileList.push({
				uid: file.uid || `file-${Date.now()}`,
				name: file.name,
				status: 'done',
				url: imageUrl,
				response: result,
			} as UploadFile);
		}

		onSuccess?.(result, file);
	} catch (error: any) {
		message.error(error?.message || '图片上传失败');
		const fileList = submitForm.value.imageList;
		const index = fileList.findIndex((item) => {
			return item.uid === file.uid || (item.name === file.name && item.size === file.size);
		});
		if (index !== -1) {
			fileList[index].status = 'error';
		}
		onError?.(error);
	}
};

const handleSubmitFeedback = async () => {
	if (!submitForm.value.type) {
		message.warning('请选择反馈类型');
		return;
	}
	if (!submitForm.value.description.trim()) {
		message.warning('请输入问题描述');
		return;
	}
	if (submitForm.value.description.trim().length < 5) {
		message.warning('问题描述至少5个字符');
		return;
	}

	submitLoading.value = true;
	try {
		// 提取所有已上传成功的图片 URL
		const images = submitForm.value.imageList
			.filter((file) => file.status === 'done')
			.map((file) => {
				// 优先使用 url，然后是 response 中的数据
				return (
					file.url ||
					file.response?.url ||
					file.response?.imageUrl ||
					(file.response?.data && (file.response.data.url || file.response.data.imageUrl))
				);
			})
			.filter((url) => url && typeof url === 'string') as string[];

		console.log('提交的图片列表:', images); // 调试日志

		const data: CreateFeedbackDto = {
			type: submitForm.value.type,
			description: submitForm.value.description.trim(),
			images: images.length > 0 ? images : undefined,
		};

		await createAdminFeedback(data);
		message.success('反馈提交成功');
		submitModalVisible.value = false;
		submitForm.value = {
			type: 'bug',
			description: '',
			imageList: [],
		};
		fetchData();
	} catch (error: any) {
		message.error(error?.message || '提交失败，请重试');
	} finally {
		submitLoading.value = false;
	}
};

onMounted(() => {
	fetchData();
});
</script>

<style scoped lang="scss">
.feedback-list {
	.description-cell {
		max-width: 300px;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.search-form {
		margin-bottom: 16px;
	}

	.feedback-detail {
		.description-text {
			white-space: pre-wrap;
			word-break: break-word;
		}

		.reply-text {
			white-space: pre-wrap;
			word-break: break-word;
			color: #1890ff;
		}

		.image-list {
			display: flex;
			flex-wrap: wrap;
		}

		.action-section {
			margin-top: 16px;
		}
	}

	.image-preview {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
	}
}
</style>
