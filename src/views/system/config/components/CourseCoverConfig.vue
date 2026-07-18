<template>
	<div class="course-cover-config">
		<a-alert
			type="info"
			show-icon
			style="margin-bottom: 16px"
			message="配置说明"
			description="可设置自动生成课程封面的背景图、画布尺寸，以及任意字段的字号、颜色等样式。字段位置改为在右侧预览区直接拖拽定位。默认字段包含学校、专业、真题年份、答案年份，你也可以继续追加字段或静态文案。"
		/>

			<a-row :gutter="16" class="config-layout">
				<a-col :span="14" class="config-layout__left">
					<div class="config-scroll-panel">
					<a-card title="封面模板" class="template-card">
						<a-tabs v-model:activeKey="activeTemplateId" class="template-tabs" type="card">
							<a-tab-pane
								v-for="template in templatePack.templates"
								:key="template.id"
								:tab="template.name || '未命名模板'"
							/>
							<template #rightExtra>
								<a-space size="small" wrap>
									<a-button size="small" @click="handleCreateTemplate">新增</a-button>
									<a-button size="small" @click="handleCopyTemplate">复制</a-button>
									<a-button
										size="small"
										danger
										:disabled="templatePack.templates.length <= 1"
										@click="handleDeleteTemplate"
									>
										删除
									</a-button>
								</a-space>
							</template>
						</a-tabs>
						<a-form :label-col="{ span: 6 }" :wrapper-col="{ span: 18 }">
							<a-form-item label="模板名称">
								<a-input v-model:value="currentTemplate.name" placeholder="请输入封面名称" maxlength="30" />
							</a-form-item>
							<a-form-item label="绑定分类">
								<a-cascader
									v-model:value="currentTemplate.bindCategory"
									:options="categoryOptions"
									:show-search="{ filter: cascaderFilter }"
									change-on-select
									allow-clear
									:placeholder="props.configType === 'category' ? '不绑定则作为通用默认模板；可只选一级分类' : '不绑定则作为通用默认模板'"
									style="width: 100%"
								/>
								<div class="form-tip">
									{{
										props.configType === 'category'
											? '绑定一级分类后，该分类下所有二级分类将优先使用此封面模板；也可继续选择二级分类做精确绑定。'
											: '绑定后，该分类下新建或编辑课程时会优先使用此封面模板。'
									}}
								</div>
							</a-form-item>
						</a-form>
					</a-card>

					<a-card title="基础配置">
						<a-form :label-col="{ span: 6 }" :wrapper-col="{ span: 18 }">
							<a-form-item label="画布宽度">
								<a-input-number
									v-model:value="formState.width"
									:min="200"
									:max="4000"
									:precision="0"
									:step="10"
									style="width: 100%"
									@change="normalizeCanvasConfig"
								/>
							</a-form-item>
							<a-form-item label="画布高度">
								<a-input-number
									v-model:value="formState.height"
									:min="200"
									:max="4000"
									:precision="0"
									:step="10"
									style="width: 100%"
									@change="normalizeCanvasConfig"
								/>
							</a-form-item>
						<a-form-item label="背景色">
							<div class="color-control">
								<input
									class="native-color-picker"
									type="color"
									:value="toColorPickerValue(formState.backgroundColor, '#5d9ef0')"
									@input="handleBackgroundColorPick"
								/>
								<a-input
									v-model:value="formState.backgroundColor"
									placeholder="#5d9ef0"
									@blur="formState.backgroundColor = normalizeColorInput(formState.backgroundColor, '#5d9ef0')"
								/>
							</div>
						</a-form-item>
						<a-form-item label="背景图">
								<a-upload
									v-model:file-list="backgroundFileList"
									:before-upload="beforeBackgroundUpload"
									:custom-request="handleBackgroundUpload"
									@remove="handleBackgroundRemove"
									list-type="picture-card"
									:max-count="1"
								>
								<div v-if="backgroundFileList.length < 1">
									<plus-outlined />
									<div style="margin-top: 8px">上传</div>
								</div>
								</a-upload>
								<div style="margin-top: 8px">
									<a-button size="small" @click="restoreDefaultBackground">恢复默认背景图</a-button>
									<a-button size="small" style="margin-left: 8px" @click="clearBackgroundImage">无背景图</a-button>
								</div>
								<div class="form-tip">选择“无背景图”后，预览和生成封面将使用上方背景色。</div>
							</a-form-item>
						</a-form>
					</a-card>

				<a-card title="字段配置" style="margin-top: 16px">
					<div
						v-for="(field, index) in formState.fields"
						:key="field.id"
						class="field-card"
						:class="{ 'is-active': activeFieldId === field.id }"
						@click="setActiveField(field.id)"
					>
						<div class="field-card__header">
							<span>{{ field.label || `字段 ${index + 1}` }}</span>
							<a-space size="small">
								<a-button type="link" size="small" @click.stop="copyFieldStyle(field)">复制样式</a-button>
								<a-button type="link" size="small" :disabled="!copiedFieldStyle" @click.stop="applyCopiedStyle(field)">
									应用样式
								</a-button>
								<a-button danger type="link" size="small" @click.stop="removeField(index)">删除</a-button>
							</a-space>
						</div>
						<a-row :gutter="12">
							<a-col :span="12">
								<a-form-item label="名称" :label-col="{ span: 8 }" :wrapper-col="{ span: 16 }">
									<a-input v-model:value="field.label" />
								</a-form-item>
							</a-col>
							<a-col :span="12">
								<a-form-item label="类型" :label-col="{ span: 8 }" :wrapper-col="{ span: 16 }">
									<a-select v-model:value="field.type">
										<a-select-option value="courseField">课程字段</a-select-option>
										<a-select-option value="staticText">静态文本</a-select-option>
									</a-select>
								</a-form-item>
							</a-col>
						</a-row>

						<a-row :gutter="12">
							<a-col :span="12" v-if="field.type === 'courseField'">
								<a-form-item label="字段来源" :label-col="{ span: 8 }" :wrapper-col="{ span: 16 }">
									<a-select v-model:value="field.sourceKey" :options="courseFieldOptions" />
								</a-form-item>
							</a-col>
							<a-col :span="12" v-else>
								<a-form-item label="静态文本" :label-col="{ span: 8 }" :wrapper-col="{ span: 16 }">
									<a-input v-model:value="field.text" />
								</a-form-item>
							</a-col>
							<a-col :span="12">
								<a-form-item label="对齐" :label-col="{ span: 8 }" :wrapper-col="{ span: 16 }">
									<a-select v-model:value="field.align">
										<a-select-option value="left">左对齐</a-select-option>
										<a-select-option value="center">居中</a-select-option>
										<a-select-option value="right">右对齐</a-select-option>
									</a-select>
								</a-form-item>
							</a-col>
						</a-row>

						<div class="field-card__position-tip">在右侧预览图中拖拽该字段即可调整位置</div>

						<a-row :gutter="12">
								<a-col :span="12">
									<a-form-item label="字号" :label-col="{ span: 8 }" :wrapper-col="{ span: 16 }">
										<a-input-number
											v-model:value="field.fontSize"
											:min="8"
											:max="240"
											:precision="0"
											style="width: 100%"
											@change="normalizeFieldConfig(field)"
										/>
									</a-form-item>
								</a-col>
								<a-col :span="12">
									<a-form-item label="宽度" :label-col="{ span: 8 }" :wrapper-col="{ span: 16 }">
										<a-input-number
											v-model:value="field.maxWidth"
											:min="20"
											:max="4000"
											:precision="0"
											style="width: 100%"
											@change="normalizeFieldConfig(field)"
										/>
									</a-form-item>
								</a-col>
						</a-row>

						<a-row :gutter="12">
							<a-col :span="12">
								<a-form-item label="颜色" :label-col="{ span: 8 }" :wrapper-col="{ span: 16 }">
									<div class="color-control">
										<input
											class="native-color-picker"
											type="color"
											:value="toColorPickerValue(field.color)"
											@input="handleFieldColorPick(field, $event)"
										/>
										<a-input
											v-model:value="field.color"
											placeholder="#FFFFFF"
											@blur="field.color = normalizeColorInput(field.color)"
										/>
									</div>
								</a-form-item>
							</a-col>
							<a-col :span="12">
								<a-form-item label="背景色" :label-col="{ span: 8 }" :wrapper-col="{ span: 16 }">
									<div class="color-control">
										<input
											class="native-color-picker"
											type="color"
											:value="toColorPickerValue(field.backgroundColor, '#FFFFFF')"
											@input="handleFieldBackgroundColorPick(field, $event)"
										/>
										<a-input
											v-model:value="field.backgroundColor"
											placeholder="transparent"
											@blur="field.backgroundColor = normalizeOptionalColorInput(field.backgroundColor)"
										/>
										<a-button size="small" @click.stop="clearFieldBackgroundColor(field)">透明</a-button>
									</div>
								</a-form-item>
							</a-col>
						</a-row>

						<a-row :gutter="12">
							<a-col :span="12">
								<a-form-item label="字体" :label-col="{ span: 8 }" :wrapper-col="{ span: 16 }">
									<a-select
										v-model:value="field.fontFamily"
										:options="getFontOptionsForField(field)"
										show-search
										:filter-option="filterFontOption"
										placeholder="选择字体栈"
										@change="() => normalizeFieldConfig(field)"
									/>
								</a-form-item>
							</a-col>
							<a-col :span="12">
								<a-form-item label="粗细" :label-col="{ span: 8 }" :wrapper-col="{ span: 16 }">
									<a-select v-model:value="field.fontWeight" :options="fontWeightOptions" @change="normalizeFieldConfig(field)" />
								</a-form-item>
							</a-col>
						</a-row>

						<a-row :gutter="12">
								<a-col :span="12">
									<a-form-item label="行数" :label-col="{ span: 8 }" :wrapper-col="{ span: 16 }">
										<a-input-number
											v-model:value="field.maxLines"
											:min="1"
											:max="10"
											:precision="0"
											style="width: 100%"
											@change="normalizeFieldConfig(field)"
										/>
									</a-form-item>
								</a-col>
								<a-col :span="12">
									<a-form-item label="行高" :label-col="{ span: 8 }" :wrapper-col="{ span: 16 }">
										<a-input-number
											v-model:value="field.lineHeight"
											:min="10"
											:max="300"
											:precision="0"
											style="width: 100%"
											@change="normalizeFieldConfig(field)"
										/>
									</a-form-item>
								</a-col>
						</a-row>
					</div>

					<a-button type="dashed" block @click="addCourseField">+ 添加课程字段</a-button>
					<a-button type="dashed" block style="margin-top: 8px" @click="addStaticField">+ 添加静态文本</a-button>
				</a-card>

        </div>

        <div class="config-action-bar">
          <a-space>
            <a-button :disabled="!canUndo" @click="handleUndo">撤回</a-button>
            <a-button type="primary" :loading="saving" @click="handleSave">保存配置</a-button>
			<a-tooltip v-if="props.configType === 'category'" title="保存配置后，只更新实际使用当前模板的分类封面">
				<a-button
					:loading="props.syncingTemplate"
					:disabled="saving"
					@click="handleSyncCurrentTemplate"
				>
					仅同步当前模板
				</a-button>
			</a-tooltip>
            <a-button :disabled="!activeFieldId" @click="centerActiveField">一键文字居中</a-button>
            <a-button @click="handleReset">恢复默认</a-button>
          </a-space>
        </div>
        </a-col>

			<a-col :span="10">
				<a-card title="实时预览">
					<div class="preview-hint">下方为与导出相同的 Canvas 合成图；虚线框为可拖拽的字段区域（标签仅作区分）。</div>
					<div class="preview-wrap">
							<div ref="previewBoardRef" class="preview-board" :style="previewBoardStyle">
								<a-spin :spinning="fullPreviewLoading" class="preview-board__spin">
									<img
										v-if="fullPreviewUrl"
										:src="fullPreviewUrl"
										alt="封面合成预览"
										class="preview-board__image"
										draggable="false"
									/>
								</a-spin>
							<div
								v-for="field in formState.fields"
								:key="field.id"
								class="preview-board__hit"
								:class="{ 'is-active': activeFieldId === field.id }"
								:style="getFieldHitAreaStyle(field)"
								@click.stop="setActiveField(field.id)"
								@pointerdown="startDrag(field, $event)"
							>
								<span class="preview-board__hit-label">{{ field.label || field.id }}</span>
							</div>
							<div
								v-if="draggingField"
								class="preview-board__guide preview-board__guide--vertical"
								:style="{ left: `${draggingField.x * previewScale}px` }"
							></div>
							<div
								v-if="draggingField"
								class="preview-board__guide preview-board__guide--horizontal"
								:style="{ top: `${draggingField.y * previewScale}px` }"
							></div>
							<div
								v-if="draggingField"
								class="preview-board__coords"
								:style="{
									left: `${Math.min(Math.max(draggingField.x * previewScale + 12, 8), previewBoardWidth - 110)}px`,
									top: `${Math.max(draggingField.y * previewScale - 42, 8)}px`,
								}"
							>
								X: {{ draggingField.x }} / Y: {{ draggingField.y }}
							</div>
						</div>
					</div>
				</a-card>
			</a-col>
		</a-row>
	</div>
</template>

<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount, ref, watch } from 'vue';
import { message } from 'ant-design-vue';
import { PlusOutlined } from '@ant-design/icons-vue';
import { uploadImage } from '@/api/upload';
import { getCategoryCoverConfig, getCourseCoverConfig, setCategoryCoverConfig, setCourseCoverConfig } from '@/api/system';
import { getCourseCategoryTree } from '@/api/course-category';
import {
	COURSE_COVER_FIELD_OPTIONS,
	COURSE_COVER_FONT_PRESETS,
	DEFAULT_CATEGORY_COVER_CONFIG,
	DEFAULT_COURSE_COVER_CONFIG,
	cloneCourseCoverConfig,
	createCoverTemplate,
	defaultCourseCoverBackground,
	getActiveCourseCoverConfig,
	normalizeCourseCoverConfig,
	normalizeCourseCoverTemplatePack,
	normalizeFontFamilyForCover,
	renderCourseCover,
	type CourseCoverConfig,
	type CourseCoverFieldConfig,
	type CourseCoverTemplate,
	type CourseCoverTemplatePack,
} from '@/utils/course-cover';

const saving = ref(false);
const fullPreviewUrl = ref('');
const fullPreviewLoading = ref(false);
let fullPreviewTimer: ReturnType<typeof setTimeout> | null = null;
const backgroundFileList = ref<any[]>([]);
const formState = ref<CourseCoverConfig>(cloneCourseCoverConfig(DEFAULT_COURSE_COVER_CONFIG));
const templatePack = ref<CourseCoverTemplatePack>({
	activeTemplateId: 'default',
	templates: [createCoverTemplate('默认课程封面', DEFAULT_COURSE_COVER_CONFIG, { id: 'default' })],
});
const activeTemplateId = ref('default');
const categoryOptions = ref<any[]>([]);
const previewBoardRef = ref<HTMLDivElement | null>(null);
const activeFieldId = ref('');
const draggingFieldId = ref('');
const previewBoardWidth = ref(420);
const dragOffset = ref({ x: 0, y: 0 });
const copiedFieldStyle = ref<Partial<CourseCoverFieldConfig> | null>(null);
type UndoSnapshot = {
	formState: CourseCoverConfig;
	templatePack: CourseCoverTemplatePack;
	activeTemplateId: string;
	activeFieldId: string;
};
const undoStack = ref<UndoSnapshot[]>([]);
const isRestoringHistory = ref(false);
let historyTimer: ReturnType<typeof setTimeout> | null = null;

const props = withDefaults(
	defineProps<{
		configType?: 'course' | 'category';
		syncingTemplate?: boolean;
	}>(),
	{
		configType: 'course',
		syncingTemplate: false,
	},
);

const emit = defineEmits<{
	(e: 'saved', config: CourseCoverConfig): void;
	(e: 'sync-template', payload: { templateId: string; templatePack: CourseCoverTemplatePack }): void;
}>();

const samplePayload = {
	school: '武汉理工大学',
	major: '602数学分析+817高等代数',
	exam_year: '2002-2025',
	answer_year: '2002-2025',
	name: '武汉理工大学 602数学分析+817高等代数',
	subject: '数学',
	category: '考研专业课',
	sub_category: '心理学',
};

const currentTemplate = computed<CourseCoverTemplate>(() => {
	const current = templatePack.value.templates.find((item) => item.id === activeTemplateId.value);
	if (current) return current;
	return templatePack.value.templates[0];
});
const canUndo = computed(() => undoStack.value.length > 1);

const courseFieldOptions = computed(() => {
	if (props.configType === 'category') {
		return COURSE_COVER_FIELD_OPTIONS.filter((item) => ['category', 'sub_category'].includes(item.value));
	}
	return COURSE_COVER_FIELD_OPTIONS;
});
const fontWeightOptions = [
	{ label: '常规 400', value: '400' },
	{ label: '中等 500', value: '500' },
	{ label: '半粗 600', value: '600' },
	{ label: '粗体 700', value: '700' },
	{ label: '特粗 800', value: '800' },
	{ label: '黑体 900', value: '900' },
];

const filterFontOption = (input: string, option: { label?: string; value?: string }) => {
	const q = String(input || '').trim().toLowerCase();
	if (!q) return true;
	const label = String(option?.label || '').toLowerCase();
	const value = String(option?.value || '').toLowerCase();
	return label.includes(q) || value.includes(q);
};

const getFontOptionsForField = (field: CourseCoverFieldConfig) => {
	const current = normalizeFontFamilyForCover(field.fontFamily);
	const inList = COURSE_COVER_FONT_PRESETS.some((item) => item.value === current);
	if (inList) return [...COURSE_COVER_FONT_PRESETS];
	return [
		{
			label: `当前配置（自定义栈）`,
			value: current,
		},
		...COURSE_COVER_FONT_PRESETS,
	];
};

const cascaderFilter = (inputValue: string, path: any[]) => {
	const keyword = String(inputValue || '').trim().toLowerCase();
	if (!keyword) return true;
	return path.some((option) => String(option?.label || '').toLowerCase().includes(keyword));
};

const loadCategoryOptions = async () => {
	try {
		const res = await getCourseCategoryTree();
		const list = res.data || res || [];
		categoryOptions.value = (Array.isArray(list) ? list : []).map((parent: any) => ({
			label: parent.status === 0 ? `${parent.name}（已禁用）` : parent.name,
			value: parent.name,
			children: Array.isArray(parent.children)
				? parent.children.map((child: any) => ({
						label: child.status === 0 ? `${child.name}（已禁用）` : child.name,
						value: child.name,
					}))
				: [],
		}));
	} catch (error) {
		console.error('加载课程分类失败:', error);
		categoryOptions.value = [];
	}
};

const getDefaultTemplateName = () => (props.configType === 'category' ? '默认分类封面' : '默认课程封面');

const getDefaultTemplateConfig = () =>
	props.configType === 'category' ? DEFAULT_CATEGORY_COVER_CONFIG : DEFAULT_COURSE_COVER_CONFIG;

const syncCurrentTemplateConfig = () => {
	const current = templatePack.value.templates.find((item) => item.id === activeTemplateId.value);
	if (!current) return;
	current.name = String(current.name || '').trim() || getDefaultTemplateName();
	current.config = normalizeCourseCoverConfig(formState.value, getDefaultTemplateConfig());
	current.bindCategory = Array.isArray(current.bindCategory) ? current.bindCategory.filter(Boolean).slice(0, 2) : [];
	templatePack.value.activeTemplateId = activeTemplateId.value;
};

const applyTemplateToForm = (templateId: string) => {
	const template = templatePack.value.templates.find((item) => item.id === templateId) || templatePack.value.templates[0];
	if (!template) return;
	formState.value = normalizeCourseCoverConfig(template.config, getDefaultTemplateConfig());
	activeTemplateId.value = template.id;
	templatePack.value.activeTemplateId = template.id;
	updateBackgroundFileList();
	scheduleFullPreview(0);
};

const cloneTemplatePack = (pack: CourseCoverTemplatePack): CourseCoverTemplatePack =>
	JSON.parse(JSON.stringify(pack || { activeTemplateId: 'default', templates: [] }));

const createUndoSnapshot = (): UndoSnapshot => ({
	formState: cloneCourseCoverConfig(formState.value),
	templatePack: cloneTemplatePack(templatePack.value),
	activeTemplateId: activeTemplateId.value,
	activeFieldId: activeFieldId.value,
});

const snapshotKey = (snapshot: UndoSnapshot) => JSON.stringify(snapshot);

const pushUndoSnapshot = () => {
	if (isRestoringHistory.value) return;
	const snapshot = createUndoSnapshot();
	const previous = undoStack.value[undoStack.value.length - 1];
	if (previous && snapshotKey(previous) === snapshotKey(snapshot)) return;
	undoStack.value.push(snapshot);
	if (undoStack.value.length > 60) {
		undoStack.value.shift();
	}
};

const scheduleUndoSnapshot = (delay = 360) => {
	if (isRestoringHistory.value) return;
	if (historyTimer) {
		clearTimeout(historyTimer);
		historyTimer = null;
	}
	historyTimer = setTimeout(() => {
		historyTimer = null;
		pushUndoSnapshot();
	}, delay);
};

const resetUndoHistory = () => {
	if (historyTimer) {
		clearTimeout(historyTimer);
		historyTimer = null;
	}
	undoStack.value = [createUndoSnapshot()];
};

const applyUndoSnapshot = (snapshot: UndoSnapshot) => {
	templatePack.value = cloneTemplatePack(snapshot.templatePack);
	activeTemplateId.value = snapshot.activeTemplateId;
	formState.value = cloneCourseCoverConfig(snapshot.formState);
	activeFieldId.value = snapshot.activeFieldId;
	updateBackgroundFileList();
	scheduleFullPreview(0);
};

const handleUndo = () => {
	if (!canUndo.value) return;
	if (historyTimer) {
		clearTimeout(historyTimer);
		historyTimer = null;
		pushUndoSnapshot();
	}
	undoStack.value.pop();
	const previous = undoStack.value[undoStack.value.length - 1];
	if (!previous) return;
	isRestoringHistory.value = true;
	applyUndoSnapshot(previous);
	setTimeout(() => {
		isRestoringHistory.value = false;
	}, 0);
};
const previewScale = computed(() => previewBoardWidth.value / Math.max(formState.value.width || 1, 1));
const draggingField = computed(() => {
	if (!draggingFieldId.value) return null;
	return formState.value.fields.find((item) => item.id === draggingFieldId.value) || null;
});
const previewBoardStyle = computed(() => ({
	width: '100%',
	aspectRatio: `${formState.value.width} / ${formState.value.height}`,
	backgroundColor: normalizeColorInput(formState.value.backgroundColor, '#5d9ef0'),
}));

const clampNumber = (value: unknown, min: number, max: number, fallback: number) => {
	const num = Number(value);
	if (!Number.isFinite(num)) return fallback;
	return Math.round(Math.min(max, Math.max(min, num)));
};

const normalizeCanvasConfig = () => {
	formState.value.width = clampNumber(formState.value.width, 200, 4000, DEFAULT_COURSE_COVER_CONFIG.width);
	formState.value.height = clampNumber(formState.value.height, 200, 4000, DEFAULT_COURSE_COVER_CONFIG.height);
	formState.value.backgroundColor = normalizeColorInput(formState.value.backgroundColor, '#5d9ef0');
};

const normalizeFieldConfig = (field: CourseCoverFieldConfig) => {
	const canvasWidth = clampNumber(formState.value.width, 200, 4000, DEFAULT_COURSE_COVER_CONFIG.width);
	const canvasHeight = clampNumber(formState.value.height, 200, 4000, DEFAULT_COURSE_COVER_CONFIG.height);
	field.label = String(field.label || '').slice(0, 30);
	field.type = field.type === 'staticText' ? 'staticText' : 'courseField';
	field.sourceKey = field.type === 'courseField' ? field.sourceKey || (props.configType === 'category' ? 'sub_category' : 'school') : '';
	field.text = field.type === 'staticText' ? String(field.text || '').slice(0, 80) : '';
	field.fontSize = clampNumber(field.fontSize, 8, 240, 32);
	field.lineHeight = clampNumber(field.lineHeight, 10, 300, field.fontSize);
	field.maxWidth = clampNumber(field.maxWidth, 20, 4000, canvasWidth);
	field.maxLines = clampNumber(field.maxLines, 1, 10, 1);
	field.x = clampNumber(field.x, 0, canvasWidth, Math.round(canvasWidth / 2));
	field.y = clampNumber(field.y, field.fontSize, canvasHeight, field.fontSize);
	field.color = normalizeColorInput(field.color, '#FFFFFF');
	field.backgroundColor = normalizeOptionalColorInput(field.backgroundColor);
	field.fontWeight = fontWeightOptions.some((item) => item.value === String(field.fontWeight)) ? String(field.fontWeight) : '700';
	field.fontFamily = normalizeFontFamilyForCover(field.fontFamily);
	field.align = ['left', 'center', 'right'].includes(field.align || '') ? field.align : 'center';
};

const normalizeAllConfig = () => {
	normalizeCanvasConfig();
	formState.value.fields.forEach(normalizeFieldConfig);
};

const validateConfig = () => {
	if (!formState.value.fields.length) return '至少需要保留一个字段';
	const invalidCourseField = formState.value.fields.find((field) => field.type === 'courseField' && !field.sourceKey);
	if (invalidCourseField) return `「${invalidCourseField.label || '课程字段'}」缺少字段来源`;
	const invalidStaticField = formState.value.fields.find((field) => field.type === 'staticText' && !String(field.text || '').trim());
	if (invalidStaticField) return `「${invalidStaticField.label || '静态文本'}」缺少静态文本内容`;
	return '';
};

const normalizeColorInput = (value?: string, fallback = '#FFFFFF') => {
	const raw = String(value || '').trim();
	const withoutHash = raw.startsWith('#') ? raw.slice(1) : raw;
	if (/^[0-9a-fA-F]{6}$/.test(withoutHash)) {
		return `#${withoutHash.toUpperCase()}`;
	}
	if (/^[0-9a-fA-F]{3}$/.test(withoutHash)) {
		return `#${withoutHash
			.split('')
			.map((char) => `${char}${char}`)
			.join('')
			.toUpperCase()}`;
	}
	return fallback;
};

const normalizeOptionalColorInput = (value?: string) => {
	const raw = String(value || '').trim();
	if (!raw || raw.toLowerCase() === 'transparent') {
		return 'transparent';
	}
	return normalizeColorInput(raw, 'transparent');
};

const toColorPickerValue = (value?: string, fallback = '#FFFFFF') => normalizeColorInput(value, fallback);

const getEventTargetValue = (event: Event) => (event.target as HTMLInputElement | null)?.value || '';

const handleBackgroundColorPick = (event: Event) => {
	formState.value.backgroundColor = normalizeColorInput(getEventTargetValue(event), '#5d9ef0');
};

const handleFieldColorPick = (field: CourseCoverFieldConfig, event: Event) => {
	field.color = normalizeColorInput(getEventTargetValue(event));
};

const handleFieldBackgroundColorPick = (field: CourseCoverFieldConfig, event: Event) => {
	field.backgroundColor = normalizeColorInput(getEventTargetValue(event));
};

const clearFieldBackgroundColor = (field: CourseCoverFieldConfig) => {
	field.backgroundColor = 'transparent';
};

const updateBackgroundFileList = () => {
	backgroundFileList.value = formState.value.backgroundImage
		? [{ uid: '-1', name: 'background.png', status: 'done', url: formState.value.backgroundImage }]
		: [];
};

const fetchConfig = async () => {
	try {
		const res = props.configType === 'category' ? await getCategoryCoverConfig() : await getCourseCoverConfig();
		templatePack.value = normalizeCourseCoverTemplatePack(res.data || res, { configType: props.configType });
		activeTemplateId.value = templatePack.value.activeTemplateId;
		formState.value = getActiveCourseCoverConfig(templatePack.value, { configType: props.configType });
	} catch (error) {
		const fallbackConfig = cloneCourseCoverConfig(getDefaultTemplateConfig());
		templatePack.value = {
			activeTemplateId: 'default',
			templates: [createCoverTemplate(getDefaultTemplateName(), fallbackConfig, { id: 'default' })],
		};
		activeTemplateId.value = 'default';
		formState.value = fallbackConfig;
	} finally {
		updateBackgroundFileList();
		scheduleFullPreview(0);
		resetUndoHistory();
	}
};

const runFullPreview = async () => {
	fullPreviewLoading.value = true;
	try {
		const canvas = await renderCourseCover(formState.value, samplePayload);
		fullPreviewUrl.value = canvas.toDataURL('image/png', 0.92);
	} catch (error) {
		console.error('封面合成预览失败:', error);
	} finally {
		fullPreviewLoading.value = false;
	}
};

const scheduleFullPreview = (delay = 120) => {
	if (fullPreviewTimer) {
		clearTimeout(fullPreviewTimer);
		fullPreviewTimer = null;
	}
	if (delay <= 0) {
		void runFullPreview();
		return;
	}
	fullPreviewTimer = setTimeout(() => {
		fullPreviewTimer = null;
		void runFullPreview();
	}, delay);
};

watch(
	() => formState.value,
	() => {
		scheduleFullPreview();
		scheduleUndoSnapshot();
	},
	{ deep: true },
);

watch(
	() => templatePack.value,
	() => {
		scheduleUndoSnapshot();
	},
	{ deep: true },
);

watch(activeTemplateId, (next, prev) => {
	if (!next || next === prev) return;
	if (prev) {
		const oldTemplate = templatePack.value.templates.find((item) => item.id === prev);
		if (oldTemplate) {
			oldTemplate.config = normalizeCourseCoverConfig(formState.value, getDefaultTemplateConfig());
		}
	}
	applyTemplateToForm(next);
});

watch(
	() => formState.value.width,
	() => updatePreviewBoardWidth(),
);

watch(
	() => formState.value.height,
	() => updatePreviewBoardWidth(),
);

const beforeBackgroundUpload = (file: File) => {
	const isImage = file.type.startsWith('image/');
	if (!isImage) {
		message.error('只能上传图片文件');
		return false;
	}
	return true;
};

const handleBackgroundUpload = async ({ file, onSuccess, onError }: any) => {
	try {
		const res = await uploadImage(file as File);
		const url = res.url || res.imageUrl;
		formState.value.backgroundImage = url;
		updateBackgroundFileList();
		onSuccess?.('ok');
		message.success('背景图上传成功');
	} catch (error: any) {
		message.error(error?.message || '背景图上传失败');
		onError?.(error);
	}
};

const restoreDefaultBackground = () => {
	formState.value.backgroundImage = defaultCourseCoverBackground;
	updateBackgroundFileList();
	message.success('已恢复默认背景图');
	scheduleFullPreview(0);
};

const clearBackgroundImage = () => {
	formState.value.backgroundImage = '';
	updateBackgroundFileList();
	message.success('已设为无背景图，将使用背景色预览和生成封面');
	scheduleFullPreview(0);
};

const handleBackgroundRemove = () => {
	formState.value.backgroundImage = '';
	updateBackgroundFileList();
	return true;
};

const createField = (type: 'courseField' | 'staticText'): CourseCoverFieldConfig => ({
	id: `field_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
	label: type === 'courseField' ? '新字段' : '新文案',
	type,
	sourceKey: type === 'courseField' ? (props.configType === 'category' ? 'sub_category' : 'school') : '',
	text: type === 'staticText' ? '请输入文案' : '',
	x: 600,
	y: 600,
	fontSize: 42,
	color: '#FFFFFF',
	backgroundColor: 'transparent',
	fontWeight: '700',
	fontFamily: normalizeFontFamilyForCover('serif'),
	maxWidth: 900,
	align: 'center',
	maxLines: 1,
	lineHeight: 42,
});

const getFieldHitAreaStyle = (field: CourseCoverFieldConfig) => {
	const scale = previewScale.value;
	const lineHeightCanvas = field.lineHeight || field.fontSize;
	const maxLines = Math.max(1, Number(field.maxLines) || 1);
	const heightPx = Math.max(field.fontSize * scale * 0.92, lineHeightCanvas * scale * maxLines);
	const widthPx = (field.maxWidth || formState.value.width) * scale;
	const align = field.align || 'center';
	return {
		left: `${field.x * scale}px`,
		top: `${field.y * scale}px`,
		width: `${widthPx}px`,
		height: `${heightPx}px`,
		transform:
			align === 'left'
				? 'translate(0, -100%)'
				: align === 'right'
					? 'translate(-100%, -100%)'
					: 'translate(-50%, -100%)',
	};
};

const startDrag = (field: CourseCoverFieldConfig, event: PointerEvent) => {
	const board = previewBoardRef.value;
	if (!board) return;
	setActiveField(field.id);
	draggingFieldId.value = field.id;
	const rect = board.getBoundingClientRect();
	const pointerX = event.clientX - rect.left;
	const pointerY = event.clientY - rect.top;
	dragOffset.value = {
		x: pointerX - field.x * previewScale.value,
		y: pointerY - field.y * previewScale.value,
	};
	(event.currentTarget as HTMLElement)?.setPointerCapture?.(event.pointerId);
};

const updateDraggedField = (event: PointerEvent) => {
	if (!draggingFieldId.value || !previewBoardRef.value) return;
	const field = formState.value.fields.find((item) => item.id === draggingFieldId.value);
	if (!field) return;
	const rect = previewBoardRef.value.getBoundingClientRect();
	const nextX = (event.clientX - rect.left - dragOffset.value.x) / previewScale.value;
	const nextY = (event.clientY - rect.top - dragOffset.value.y) / previewScale.value;
	field.x = Math.round(Math.max(0, Math.min(formState.value.width, nextX)));
	field.y = Math.round(Math.max(field.fontSize, Math.min(formState.value.height, nextY)));
};

const stopDrag = () => {
	draggingFieldId.value = '';
};

const setActiveField = (fieldId: string) => {
	activeFieldId.value = fieldId;
};

const nudgeActiveField = (dx: number, dy: number) => {
	if (!activeFieldId.value) return;
	const field = formState.value.fields.find((item) => item.id === activeFieldId.value);
	if (!field) return;
	field.x = Math.max(0, Math.min(formState.value.width, field.x + dx));
	field.y = Math.max(field.fontSize, Math.min(formState.value.height, field.y + dy));
};

const centerActiveField = () => {
	if (!activeFieldId.value) return;
	const field = formState.value.fields.find((item) => item.id === activeFieldId.value);
	if (!field) return;
	field.x = Math.round(formState.value.width / 2);
	field.align = 'center';
	message.success(`已将「${field.label || '字段'}」水平居中`);
};

const handleKeydown = (event: KeyboardEvent) => {
	const target = event.target as HTMLElement | null;
	const tagName = target?.tagName?.toLowerCase();
	const isTypingTarget =
		tagName === 'input' ||
		tagName === 'textarea' ||
		target?.isContentEditable ||
		target?.closest('.ant-select-dropdown') ||
		target?.closest('.w-e-text-container');
	if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'z' && !event.shiftKey && !isTypingTarget) {
		event.preventDefault();
		handleUndo();
		return;
	}
	if (isTypingTarget || !activeFieldId.value) return;

	const step = event.shiftKey ? 10 : 1;
	if (event.key === 'ArrowLeft') {
		event.preventDefault();
		nudgeActiveField(-step, 0);
	} else if (event.key === 'ArrowRight') {
		event.preventDefault();
		nudgeActiveField(step, 0);
	} else if (event.key === 'ArrowUp') {
		event.preventDefault();
		nudgeActiveField(0, -step);
	} else if (event.key === 'ArrowDown') {
		event.preventDefault();
		nudgeActiveField(0, step);
	}
};

const updatePreviewBoardWidth = () => {
	if (!previewBoardRef.value) return;
	previewBoardWidth.value = previewBoardRef.value.clientWidth || 420;
};

const addCourseField = () => {
	formState.value.fields.push(createField('courseField'));
};

const addStaticField = () => {
	formState.value.fields.push(createField('staticText'));
};

const removeField = (index: number) => {
	formState.value.fields.splice(index, 1);
};

const copyFieldStyle = (field: CourseCoverFieldConfig) => {
	copiedFieldStyle.value = {
		fontSize: field.fontSize,
		color: field.color,
		backgroundColor: field.backgroundColor,
		fontWeight: field.fontWeight,
		fontFamily: field.fontFamily,
		maxWidth: field.maxWidth,
		align: field.align,
		maxLines: field.maxLines,
		lineHeight: field.lineHeight,
	};
	message.success(`已复制「${field.label || '字段'}」的样式`);
};

const applyCopiedStyle = (field: CourseCoverFieldConfig) => {
	if (!copiedFieldStyle.value) return;
	Object.assign(field, copiedFieldStyle.value);
};

const handleCreateTemplate = () => {
	syncCurrentTemplateConfig();
	const template = createCoverTemplate(`新封面模板 ${templatePack.value.templates.length + 1}`, getDefaultTemplateConfig());
	templatePack.value.templates.push(template);
	activeTemplateId.value = template.id;
	message.success('已新增封面模板');
};

const handleCopyTemplate = () => {
	syncCurrentTemplateConfig();
	const source = currentTemplate.value;
	const template = createCoverTemplate(`${source.name || '封面模板'} 副本`, source.config, {
		bindCategory: source.bindCategory,
	});
	templatePack.value.templates.push(template);
	activeTemplateId.value = template.id;
	message.success('已复制当前封面模板');
};

const handleDeleteTemplate = () => {
	if (templatePack.value.templates.length <= 1) return;
	const index = templatePack.value.templates.findIndex((item) => item.id === activeTemplateId.value);
	if (index < 0) return;
	templatePack.value.templates.splice(index, 1);
	const next = templatePack.value.templates[Math.max(0, index - 1)] || templatePack.value.templates[0];
	activeTemplateId.value = next.id;
	message.success('已删除当前封面模板');
};

const persistConfig = async (emitSaved: boolean) => {
	saving.value = true;
	try {
		normalizeAllConfig();
		const error = validateConfig();
		if (error) {
			message.error(error);
			return;
		}
		syncCurrentTemplateConfig();
		const normalizedPack = normalizeCourseCoverTemplatePack(templatePack.value, { configType: props.configType });
		if (props.configType === 'category') {
			await setCategoryCoverConfig(normalizedPack);
		} else {
			await setCourseCoverConfig(normalizedPack);
		}
		templatePack.value = normalizedPack;
		activeTemplateId.value = normalizedPack.activeTemplateId;
		message.success(props.configType === 'category' ? '分类封面配置已保存' : '课程封面配置已保存');
		if (emitSaved) {
			emit('saved', getActiveCourseCoverConfig(normalizedPack, { configType: props.configType }));
		}
		return normalizedPack;
	} catch (error: any) {
		message.error(error?.message || '保存失败');
		return null;
	} finally {
		saving.value = false;
	}
};

const handleSave = async () => {
	await persistConfig(true);
};

const handleSyncCurrentTemplate = async () => {
	const templateId = activeTemplateId.value;
	const normalizedPack = await persistConfig(false);
	if (!normalizedPack) return;
	emit('sync-template', { templateId, templatePack: normalizedPack });
};

const handleReset = async () => {
	formState.value = cloneCourseCoverConfig(getDefaultTemplateConfig());
	syncCurrentTemplateConfig();
	updateBackgroundFileList();
	scheduleFullPreview(0);
	message.success(props.configType === 'category' ? '已恢复分类封面默认配置' : '已恢复课程封面默认配置');
};

onMounted(() => {
	window.addEventListener('pointermove', updateDraggedField);
	window.addEventListener('pointerup', stopDrag);
	window.addEventListener('keydown', handleKeydown);
	loadCategoryOptions();
	fetchConfig();
	requestAnimationFrame(() => updatePreviewBoardWidth());
});

onBeforeUnmount(() => {
	if (fullPreviewTimer) {
		clearTimeout(fullPreviewTimer);
		fullPreviewTimer = null;
	}
	if (historyTimer) {
		clearTimeout(historyTimer);
		historyTimer = null;
	}
	window.removeEventListener('pointermove', updateDraggedField);
	window.removeEventListener('pointerup', stopDrag);
	window.removeEventListener('keydown', handleKeydown);
});
</script>

<style scoped lang="scss">
.course-cover-config {
	.config-layout {
		align-items: flex-start;
	}

	.config-layout__left {
		position: sticky;
		top: 0;
	}

	.template-card {
		margin-bottom: 16px;
	}

	.template-tabs {
		margin-bottom: 16px;
	}

	.template-tabs :deep(.ant-tabs-nav) {
		margin-bottom: 12px;
	}

	.template-tabs :deep(.ant-tabs-tab) {
		max-width: 180px;
	}

	.template-tabs :deep(.ant-tabs-tab-btn) {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

  .config-scroll-panel {
    max-height: calc(100vh - 190px);
    overflow-y: auto;
    overflow-x: hidden;
    padding-right: 6px;
    scrollbar-gutter: stable;
  }

  .config-action-bar {
    margin-top: 16px;
    padding-top: 12px;
    background: #fff;
  }

	.config-scroll-panel::-webkit-scrollbar {
		width: 6px;
	}

	.config-scroll-panel::-webkit-scrollbar-thumb {
		background: rgba(0, 0, 0, 0.18);
		border-radius: 999px;
	}

	.form-tip {
		margin-top: 8px;
		color: #8c8c8c;
		font-size: 12px;
		line-height: 1.5;
	}

	.color-control {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.color-control :deep(.ant-input) {
		flex: 1 1 0;
		min-width: 0;
	}

	.color-control :deep(.ant-btn) {
		flex: 0 0 52px;
		padding-inline: 8px;
	}

	.native-color-picker {
		width: 36px;
		height: 32px;
		padding: 0;
		flex: 0 0 36px;
		border: 1px solid #d9d9d9;
		border-radius: 6px;
		background: #fff;
		cursor: pointer;
	}

	.native-color-picker::-webkit-color-swatch-wrapper {
		padding: 3px;
	}

	.native-color-picker::-webkit-color-swatch,
	.native-color-picker::-moz-color-swatch {
		border: none;
		border-radius: 4px;
	}

	.field-card {
		padding: 12px;
		margin-bottom: 12px;
		border: 1px solid #f0f0f0;
		border-radius: 10px;
		background: #fafafa;
		cursor: pointer;
		transition:
			border-color 0.2s ease,
			box-shadow 0.2s ease;
	}

	.field-card.is-active {
		border-color: #1677ff;
		box-shadow: 0 0 0 2px rgba(22, 119, 255, 0.12);
	}

	.field-card__header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 8px;
		font-weight: 600;
	}

	.field-card__position-tip {
		margin: 0 0 12px;
		color: #8c8c8c;
		font-size: 12px;
	}

	.preview-hint {
		margin: 0 0 10px;
		color: #8c8c8c;
		font-size: 12px;
		line-height: 1.5;
	}

	.preview-wrap {
		display: flex;
		justify-content: center;
		padding: 8px;
		background: #f7f7f7;
		border-radius: 12px;
	}

	.preview-board__spin {
		display: block;
		width: 100%;
		min-height: 120px;
	}

	.preview-board__spin :deep(.ant-spin-container) {
		width: 100%;
	}

	.preview-board {
		position: relative;
		width: 100%;
		max-width: 420px;
		overflow: hidden;
		border-radius: 10px;
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
		user-select: none;
		touch-action: none;
	}

	.preview-board__image {
		width: 100%;
		height: auto;
		display: block;
		border-radius: 10px;
	}

	.preview-board__hit {
		position: absolute;
		z-index: 2;
		box-sizing: border-box;
		border: 1px dashed rgba(0, 0, 0, 0.22);
		border-radius: 6px;
		background: rgba(255, 255, 255, 0.06);
		cursor: grab;
		pointer-events: auto;
	}

	.preview-board__hit.is-active {
		border-color: #1677ff;
		background: rgba(22, 119, 255, 0.1);
		box-shadow: 0 0 0 1px rgba(22, 119, 255, 0.25);
	}

	.preview-board__hit-label {
		position: absolute;
		left: 6px;
		top: 4px;
		font-size: 11px;
		line-height: 1.2;
		color: rgba(0, 0, 0, 0.55);
		pointer-events: none;
		max-width: calc(100% - 12px);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		font-weight: 600;
	}

	.preview-board__guide {
		position: absolute;
		z-index: 1;
		pointer-events: none;
		background: rgba(255, 196, 0, 0.95);
		box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.45);
	}

	.preview-board__guide--vertical {
		top: 0;
		bottom: 0;
		width: 1px;
	}

	.preview-board__guide--horizontal {
		left: 0;
		right: 0;
		height: 1px;
	}

	.preview-board__coords {
		position: absolute;
		z-index: 3;
		padding: 4px 8px;
		font-size: 12px;
		color: #fff;
		background: rgba(0, 0, 0, 0.72);
		border-radius: 999px;
		pointer-events: none;
		white-space: nowrap;
	}
}
</style>
