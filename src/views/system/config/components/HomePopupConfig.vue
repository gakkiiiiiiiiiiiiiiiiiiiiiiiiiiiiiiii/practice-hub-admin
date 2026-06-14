<template>
	<div class="home-popup-config">
		<a-alert
			type="info"
			show-icon
			message="配置小程序首页弹窗内容。开启后用户进入首页会看到弹窗；「只弹一次」在用户关闭后不再展示（更新配置后会再次展示）；「每次进入都弹」则每次打开首页都会展示。"
			class="config-tip"
		/>

		<a-form layout="vertical" style="max-width: 640px; margin-top: 16px">
			<a-form-item label="启用首页弹窗">
				<a-switch v-model:checked="form.enabled" />
			</a-form-item>
			<a-form-item label="弹窗标题">
				<a-input v-model:value="form.title" placeholder="例如：重要公告" :maxlength="100" allow-clear />
			</a-form-item>
			<a-form-item label="弹窗内容" required>
				<a-textarea
					v-model:value="form.content"
					placeholder="请输入弹窗正文内容"
					:rows="6"
					:maxlength="2000"
					show-count
				/>
			</a-form-item>
			<a-form-item label="弹窗图片（选填）">
				<a-upload
					v-model:file-list="fileList"
					list-type="picture-card"
					:max-count="1"
					:before-upload="beforeUpload"
					:custom-request="handleUpload"
					@remove="handleRemoveImage"
					:disabled="uploadLoading"
				>
					<div v-if="fileList.length < 1">
						<plus-outlined />
						<div style="margin-top: 8px">上传</div>
					</div>
				</a-upload>
			</a-form-item>
			<a-form-item label="展示策略">
				<a-radio-group v-model:value="form.showMode">
					<a-radio value="once">只弹一次（关闭后不再展示，更新配置后重新展示）</a-radio>
					<a-radio value="always">每次进入首页都弹</a-radio>
				</a-radio-group>
			</a-form-item>
			<a-form-item>
				<a-space>
					<a-button type="primary" :loading="saving" @click="save">保存配置</a-button>
					<span v-if="form.version" class="version-tip">当前版本号：{{ form.version }}</span>
				</a-space>
			</a-form-item>
		</a-form>
	</div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { message } from 'ant-design-vue';
import { PlusOutlined } from '@ant-design/icons-vue';
import type { UploadFile } from 'ant-design-vue';
import { getHomePopupConfig, setHomePopupConfig } from '@/api/system';
import { uploadImage } from '@/api/upload';
import { getProxiedImageUrl } from '@/utils/imageProxy';

const saving = ref(false);
const uploadLoading = ref(false);
const fileList = ref<UploadFile[]>([]);

const form = reactive({
	enabled: false,
	title: '',
	content: '',
	image: '',
	showMode: 'once' as 'once' | 'always',
	version: 0,
});

const syncFileList = (imageUrl?: string) => {
	if (imageUrl) {
		fileList.value = [
			{
				uid: '-1',
				name: 'popup-image',
				status: 'done',
				url: getProxiedImageUrl(imageUrl),
			},
		];
	} else {
		fileList.value = [];
	}
};

const load = async () => {
	try {
		const res = await getHomePopupConfig();
		const data = res.data || {};
		form.enabled = Boolean(data.enabled);
		form.title = data.title || '';
		form.content = data.content || '';
		form.image = data.image || '';
		form.showMode = data.showMode === 'always' ? 'always' : 'once';
		form.version = Number(data.version) || 0;
		syncFileList(form.image);
	} catch {
		message.error('获取首页弹窗配置失败');
	}
};

const beforeUpload = (file: File) => {
	const isImage = file.type.startsWith('image/');
	if (!isImage) {
		message.error('只能上传图片文件');
		return false;
	}
	const isLt5M = file.size / 1024 / 1024 < 5;
	if (!isLt5M) {
		message.error('图片大小不能超过 5MB');
		return false;
	}
	return true;
};

const handleUpload = async ({ file, onSuccess, onError }: any) => {
	uploadLoading.value = true;
	try {
		const response = await uploadImage(file as File);
		const imageUrl = response.url || response.imageUrl;
		if (!imageUrl) {
			throw new Error('上传失败');
		}
		form.image = imageUrl;
		syncFileList(imageUrl);
		onSuccess?.(response, file);
	} catch (error: any) {
		message.error(error?.message || '图片上传失败');
		onError?.(error);
	} finally {
		uploadLoading.value = false;
	}
};

const handleRemoveImage = () => {
	form.image = '';
	fileList.value = [];
};

const save = async () => {
	if (form.enabled && !form.content.trim()) {
		message.warning('启用弹窗时请填写弹窗内容');
		return;
	}

	saving.value = true;
	try {
		const res = await setHomePopupConfig({
			enabled: form.enabled,
			title: form.title.trim(),
			content: form.content.trim(),
			image: form.image.trim(),
			showMode: form.showMode,
		});
		const config = res.data?.config;
		if (config?.version) {
			form.version = config.version;
		}
		message.success('保存成功');
	} catch {
		message.error('保存失败');
	} finally {
		saving.value = false;
	}
};

onMounted(load);
</script>

<style scoped>
.config-tip {
	margin-bottom: 8px;
}

.version-tip {
	color: #999;
	font-size: 12px;
}
</style>
