<template>
	<div class="home-popup-config">
		<a-alert
			type="info"
			show-icon
			message="配置小程序首页弹窗。可创建多个模板，但只有选中的模板会在小程序生效；模板内可配置多个轮播页，用户可像轮播图一样切换查看。"
			class="config-tip"
		/>

		<a-form layout="vertical" class="popup-form">
			<a-form-item label="启用首页弹窗">
				<a-switch v-model:checked="form.enabled" />
			</a-form-item>

			<a-form-item label="生效模板">
				<a-space wrap>
					<a-radio-group v-model:value="form.activeTemplateId">
						<a-radio-button v-for="template in form.templates" :key="template.id" :value="template.id">
							{{ template.name || '未命名模板' }}
						</a-radio-button>
					</a-radio-group>
					<a-button @click="addTemplate">
						<template #icon><plus-outlined /></template>
						新增模板
					</a-button>
					<a-button danger :disabled="form.templates.length <= 1" @click="removeActiveTemplate">
						删除当前模板
					</a-button>
				</a-space>
				<div class="field-help">只能有一个模板生效，切换上方选项即可指定当前小程序使用的弹窗模板。</div>
			</a-form-item>

			<template v-if="activeTemplate">
				<a-divider orientation="left">模板配置</a-divider>

				<a-row :gutter="16">
					<a-col :span="12">
						<a-form-item label="模板名称">
							<a-input v-model:value="activeTemplate.name" placeholder="例如：新人引导模板" :maxlength="40" />
						</a-form-item>
					</a-col>
					<a-col :span="12">
						<a-form-item label="弹窗标题">
							<a-input v-model:value="activeTemplate.title" placeholder="例如：重要公告" :maxlength="100" allow-clear />
						</a-form-item>
					</a-col>
				</a-row>

				<a-row :gutter="16">
					<a-col :span="12">
						<a-form-item label="按钮文案">
							<a-input
								v-model:value="activeTemplate.buttonText"
								placeholder="默认：我知道了"
								:maxlength="20"
								allow-clear
							/>
						</a-form-item>
					</a-col>
					<a-col :span="12">
						<a-form-item label="展示策略">
							<a-radio-group v-model:value="activeTemplate.showMode">
								<a-radio value="once">只弹一次</a-radio>
								<a-radio value="always">每次进入首页都弹</a-radio>
							</a-radio-group>
						</a-form-item>
					</a-col>
				</a-row>

				<a-row :gutter="16">
					<a-col :span="12">
						<a-form-item label="弹出对象">
							<a-radio-group v-model:value="activeTemplate.targetMode">
								<a-radio value="all">全部用户</a-radio>
								<a-radio value="specified">指定用户</a-radio>
							</a-radio-group>
						</a-form-item>
					</a-col>
					<a-col v-if="activeTemplate.targetMode === 'specified'" :span="12">
						<a-form-item label="指定用户ID">
							<a-textarea
								v-model:value="activeTemplate.targetUserIdsText"
								placeholder="输入小程序用户ID，支持逗号、空格或换行分隔"
								:auto-size="{ minRows: 2, maxRows: 4 }"
							/>
							<div class="field-help">仅这些用户进入首页时会看到当前模板弹窗。</div>
						</a-form-item>
					</a-col>
				</a-row>

				<a-divider orientation="left">弹窗轮播内容</a-divider>

				<div
					v-for="(page, index) in activeTemplate.pages"
					:key="page.id"
					class="popup-page-editor"
				>
					<div class="page-editor-header">
						<strong>第 {{ index + 1 }} 页</strong>
						<a-space>
							<a-button size="small" @click="duplicatePage(page)">复制</a-button>
							<a-button
								size="small"
								danger
								:disabled="activeTemplate.pages.length <= 1"
								@click="removePage(page.id)"
							>
								删除
							</a-button>
						</a-space>
					</div>

					<a-form-item label="页面标题">
						<a-input v-model:value="page.title" placeholder="留空则使用模板标题" :maxlength="100" allow-clear />
					</a-form-item>

					<a-form-item label="页面内容" required>
						<WangEditor v-model="page.content" placeholder="请输入当前轮播页正文内容（支持富文本）" />
					</a-form-item>

					<a-form-item label="页面图片（选填）">
						<a-upload
							v-model:file-list="page.fileList"
							list-type="picture-card"
							:max-count="1"
							:before-upload="beforeUpload"
							:custom-request="(options) => handleUpload(options, page)"
							@remove="() => handleRemoveImage(page)"
							:disabled="uploadLoading"
						>
							<div v-if="page.fileList.length < 1">
								<plus-outlined />
								<div style="margin-top: 8px">上传</div>
							</div>
						</a-upload>
					</a-form-item>
				</div>

				<a-button class="add-page-btn" @click="addPage">
					<template #icon><plus-outlined /></template>
					新增轮播页
				</a-button>
			</template>

			<a-form-item class="save-row">
				<a-space>
					<a-button type="primary" :loading="saving" @click="save">保存配置</a-button>
					<span v-if="form.version" class="version-tip">当前版本号：{{ form.version }}</span>
				</a-space>
			</a-form-item>
		</a-form>
	</div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { message } from 'ant-design-vue';
import { PlusOutlined } from '@ant-design/icons-vue';
import type { UploadFile } from 'ant-design-vue';
import { getHomePopupConfig, setHomePopupConfig } from '@/api/system';
import { uploadImage } from '@/api/upload';
import { getProxiedImageUrl } from '@/utils/imageProxy';
import WangEditor from '@/components/WangEditor/index.vue';

type ShowMode = 'once' | 'always';
type TargetMode = 'all' | 'specified';

interface PopupPage {
	id: string;
	title: string;
	content: string;
	image: string;
	fileList: UploadFile[];
}

interface PopupTemplate {
	id: string;
	name: string;
	title: string;
	buttonText: string;
	showMode: ShowMode;
	targetMode: TargetMode;
	targetUserIds: number[];
	targetUserIdsText: string;
	pages: PopupPage[];
}

const stripRichText = (html: string) =>
	String(html || '')
		.replace(/<[^>]+>/g, '')
		.replace(/&nbsp;/gi, ' ')
		.trim();

const createId = (prefix: string) => `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

const normalizeTargetUserIds = (input: unknown): number[] => {
	const rawValues = Array.isArray(input)
		? input
		: String(input || '')
				.split(/[\s,，;；]+/)
				.filter(Boolean);
	return Array.from(
		new Set(
			rawValues
				.map((item) => Number(item))
				.filter((id) => Number.isInteger(id) && id > 0),
		),
	);
};

const createPage = (data: Partial<PopupPage> = {}): PopupPage => ({
	id: data.id || createId('page'),
	title: data.title || '',
	content: data.content || '',
	image: data.image || '',
	fileList: data.image
		? [
				{
					uid: data.id || '-1',
					name: 'popup-image',
					status: 'done',
					url: getProxiedImageUrl(data.image),
				},
			]
		: [],
});

const createTemplate = (index: number, data: Partial<PopupTemplate> = {}): PopupTemplate => ({
	id: data.id || createId('template'),
	name: data.name || `模板 ${index + 1}`,
	title: data.title || '',
	buttonText: data.buttonText || '我知道了',
	showMode: data.showMode === 'always' ? 'always' : 'once',
	targetMode: data.targetMode === 'specified' ? 'specified' : 'all',
	targetUserIds: normalizeTargetUserIds(data.targetUserIds),
	targetUserIdsText:
		data.targetUserIdsText ||
		normalizeTargetUserIds(data.targetUserIds)
			.join(', '),
	pages: Array.isArray(data.pages) && data.pages.length ? data.pages.map((page) => createPage(page)) : [createPage()],
});

const saving = ref(false);
const uploadLoading = ref(false);

const form = reactive({
	enabled: false,
	activeTemplateId: 'default',
	templates: [createTemplate(0, { id: 'default', name: '默认模板' })] as PopupTemplate[],
	version: 0,
});

const activeTemplate = computed(() => {
	return form.templates.find((template) => template.id === form.activeTemplateId) || form.templates[0] || null;
});

const normalizeTemplatesFromServer = (data: any): PopupTemplate[] => {
	if (Array.isArray(data?.templates) && data.templates.length) {
		return data.templates.map((template: any, index: number) => createTemplate(index, template));
	}

	return [
		createTemplate(0, {
			id: 'default',
			name: '默认模板',
			title: data?.title || '',
			buttonText: data?.buttonText || '我知道了',
			showMode: data?.showMode === 'always' ? 'always' : 'once',
			pages: [
				createPage({
					id: 'page_1',
					title: data?.title || '',
					content: data?.content || '',
					image: data?.image || '',
				}),
			],
		}),
	];
};

const load = async () => {
	try {
		const res = await getHomePopupConfig();
		const data = res.data || {};
		form.enabled = Boolean(data.enabled);
		form.templates = normalizeTemplatesFromServer(data);
		form.activeTemplateId =
			data.activeTemplateId && form.templates.some((template) => template.id === data.activeTemplateId)
				? data.activeTemplateId
				: form.templates[0]?.id || 'default';
		form.version = Number(data.version) || 0;
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

const handleUpload = async ({ file, onSuccess, onError }: any, page: PopupPage) => {
	uploadLoading.value = true;
	try {
		const response = await uploadImage(file as File);
		const imageUrl = response.url || response.imageUrl;
		if (!imageUrl) {
			throw new Error('上传失败');
		}
		page.image = imageUrl;
		page.fileList = [
			{
				uid: page.id,
				name: 'popup-image',
				status: 'done',
				url: getProxiedImageUrl(imageUrl),
			},
		];
		onSuccess?.(response, file);
	} catch (error: any) {
		message.error(error?.message || '图片上传失败');
		onError?.(error);
	} finally {
		uploadLoading.value = false;
	}
};

const handleRemoveImage = (page: PopupPage) => {
	page.image = '';
	page.fileList = [];
};

const addTemplate = () => {
	const template = createTemplate(form.templates.length);
	form.templates.push(template);
	form.activeTemplateId = template.id;
};

const removeActiveTemplate = () => {
	if (form.templates.length <= 1 || !activeTemplate.value) return;
	const removeId = activeTemplate.value.id;
	form.templates = form.templates.filter((template) => template.id !== removeId);
	form.activeTemplateId = form.templates[0]?.id || 'default';
};

const addPage = () => {
	activeTemplate.value?.pages.push(createPage());
};

const duplicatePage = (page: PopupPage) => {
	activeTemplate.value?.pages.push(
		createPage({
			title: page.title,
			content: page.content,
			image: page.image,
		}),
	);
};

const removePage = (pageId: string) => {
	if (!activeTemplate.value || activeTemplate.value.pages.length <= 1) return;
	activeTemplate.value.pages = activeTemplate.value.pages.filter((page) => page.id !== pageId);
};

const hasPageContent = (page: PopupPage) => Boolean(page.title.trim() || stripRichText(page.content) || page.image.trim());

const save = async () => {
	const currentTemplate = activeTemplate.value;
	if (!currentTemplate) {
		message.warning('请至少保留一个弹窗模板');
		return;
	}
	if (form.enabled && !currentTemplate.pages.some(hasPageContent)) {
		message.warning('启用弹窗时请至少填写一个轮播页的标题、正文或图片');
		return;
	}
	const targetUserIds = normalizeTargetUserIds(currentTemplate.targetUserIdsText);
	if (form.enabled && currentTemplate.targetMode === 'specified' && targetUserIds.length === 0) {
		message.warning('指定用户弹窗请至少填写一个有效用户ID');
		return;
	}

	saving.value = true;
	try {
		const res = await setHomePopupConfig({
			enabled: form.enabled,
			activeTemplateId: form.activeTemplateId,
			templates: form.templates.map((template) => ({
				id: template.id,
				name: template.name.trim() || '未命名模板',
				title: template.title.trim(),
				buttonText: template.buttonText.trim() || '我知道了',
				showMode: template.showMode,
				targetMode: template.targetMode,
				targetUserIds:
					template.targetMode === 'specified' ? normalizeTargetUserIds(template.targetUserIdsText) : [],
				pages: template.pages.map((page) => ({
					id: page.id,
					title: page.title.trim(),
					content: page.content,
					image: page.image.trim(),
				})),
			})),
		});
		const config = res.data?.config;
		if (config?.version) {
			form.version = config.version;
		}
		message.success('保存成功');
	} catch (error: any) {
		message.error(error?.response?.data?.message || '保存失败');
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

.popup-form {
	max-width: 960px;
	margin-top: 16px;
}

.field-help {
	margin-top: 8px;
	color: #999;
	font-size: 12px;
}

.popup-page-editor {
	margin-bottom: 16px;
	padding: 16px;
	border: 1px solid #edf0f5;
	border-radius: 8px;
	background: #fafbfc;
}

.page-editor-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-bottom: 12px;
}

.add-page-btn {
	margin-bottom: 24px;
}

.save-row {
	margin-top: 16px;
}

.version-tip {
	color: #999;
	font-size: 12px;
}
</style>
