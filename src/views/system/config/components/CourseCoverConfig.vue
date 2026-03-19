<template>
	<div class="course-cover-config">
		<a-alert
			type="info"
			show-icon
			style="margin-bottom: 16px"
			message="配置说明"
			description="可设置自动生成课程封面的背景图、画布尺寸，以及任意字段的字号、颜色等样式。字段位置改为在右侧预览区直接拖拽定位。默认字段包含学校、专业、真题年份、答案年份，你也可以继续追加字段或静态文案。"
		/>

		<a-row :gutter="16">
			<a-col :span="14">
				<a-card title="基础配置">
					<a-form :label-col="{ span: 6 }" :wrapper-col="{ span: 18 }">
						<a-form-item label="画布宽度">
							<a-input-number v-model:value="formState.width" :min="200" :max="4000" style="width: 100%" />
						</a-form-item>
						<a-form-item label="画布高度">
							<a-input-number v-model:value="formState.height" :min="200" :max="4000" style="width: 100%" />
						</a-form-item>
						<a-form-item label="背景色">
							<a-input v-model:value="formState.backgroundColor" placeholder="#5d9ef0" />
						</a-form-item>
						<a-form-item label="背景图">
							<a-upload
								v-model:file-list="backgroundFileList"
								:before-upload="beforeBackgroundUpload"
								:custom-request="handleBackgroundUpload"
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
							</div>
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
									<a-input-number v-model:value="field.fontSize" :min="8" :max="240" style="width: 100%" />
								</a-form-item>
							</a-col>
							<a-col :span="12">
								<a-form-item label="宽度" :label-col="{ span: 8 }" :wrapper-col="{ span: 16 }">
									<a-input-number v-model:value="field.maxWidth" style="width: 100%" />
								</a-form-item>
							</a-col>
						</a-row>

						<a-row :gutter="12">
							<a-col :span="8">
								<a-form-item label="颜色" :label-col="{ span: 8 }" :wrapper-col="{ span: 16 }">
									<a-input v-model:value="field.color" />
								</a-form-item>
							</a-col>
							<a-col :span="8">
								<a-form-item label="粗细" :label-col="{ span: 8 }" :wrapper-col="{ span: 16 }">
									<a-input v-model:value="field.fontWeight" />
								</a-form-item>
							</a-col>
							<a-col :span="8">
								<a-form-item label="字体" :label-col="{ span: 8 }" :wrapper-col="{ span: 16 }">
									<a-input v-model:value="field.fontFamily" />
								</a-form-item>
							</a-col>
						</a-row>

						<a-row :gutter="12">
							<a-col :span="12">
								<a-form-item label="行数" :label-col="{ span: 8 }" :wrapper-col="{ span: 16 }">
									<a-input-number v-model:value="field.maxLines" :min="1" :max="10" style="width: 100%" />
								</a-form-item>
							</a-col>
							<a-col :span="12">
								<a-form-item label="行高" :label-col="{ span: 8 }" :wrapper-col="{ span: 16 }">
									<a-input-number v-model:value="field.lineHeight" :min="10" :max="240" style="width: 100%" />
								</a-form-item>
							</a-col>
						</a-row>
					</div>

					<a-button type="dashed" block @click="addCourseField">+ 添加课程字段</a-button>
					<a-button type="dashed" block style="margin-top: 8px" @click="addStaticField">+ 添加静态文本</a-button>
				</a-card>

				<div style="margin-top: 16px">
					<a-space>
						<a-button type="primary" :loading="saving" @click="handleSave">保存配置</a-button>
						<a-button :disabled="!activeFieldId" @click="centerActiveField">一键文字居中</a-button>
						<a-button @click="handleReset">恢复默认</a-button>
					</a-space>
				</div>
			</a-col>

			<a-col :span="10">
				<a-card title="实时预览">
					<div class="preview-wrap">
						<div ref="previewBoardRef" class="preview-board" :style="previewBoardStyle">
							<img v-if="previewUrl" :src="previewUrl" alt="封面预览底图" class="preview-board__image" />
							<div
								v-for="field in formState.fields"
								:key="field.id"
								class="preview-board__field"
								:class="{ 'is-active': activeFieldId === field.id }"
								:style="getFieldStyle(field)"
								@click.stop="setActiveField(field.id)"
								@pointerdown="startDrag(field, $event)"
							>
								{{ getFieldPreviewText(field) }}
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
import { getCourseCoverConfig, setCourseCoverConfig } from '@/api/system';
import {
	COURSE_COVER_FIELD_OPTIONS,
	DEFAULT_COURSE_COVER_CONFIG,
	cloneCourseCoverConfig,
	defaultCourseCoverBackground,
	normalizeCourseCoverConfig,
	renderCourseCover,
	type CourseCoverConfig,
	type CourseCoverFieldConfig,
} from '@/utils/course-cover';

const saving = ref(false);
const previewUrl = ref('');
const backgroundFileList = ref<any[]>([]);
const formState = ref<CourseCoverConfig>(cloneCourseCoverConfig(DEFAULT_COURSE_COVER_CONFIG));
const previewBoardRef = ref<HTMLDivElement | null>(null);
const activeFieldId = ref('');
const draggingFieldId = ref('');
const previewBoardWidth = ref(420);
const dragOffset = ref({ x: 0, y: 0 });
const copiedFieldStyle = ref<Partial<CourseCoverFieldConfig> | null>(null);

const samplePayload = {
	school: '武汉理工大学',
	major: '602数学分析+817高等代数',
	exam_year: '2002-2025',
	answer_year: '2002-2025',
	name: '武汉理工大学 602数学分析+817高等代数',
	subject: '数学',
};

const courseFieldOptions = computed(() => COURSE_COVER_FIELD_OPTIONS);
const previewScale = computed(() => previewBoardWidth.value / Math.max(formState.value.width || 1, 1));
const draggingField = computed(() => {
	if (!draggingFieldId.value) return null;
	return formState.value.fields.find((item) => item.id === draggingFieldId.value) || null;
});
const previewBoardStyle = computed(() => ({
	width: '100%',
	aspectRatio: `${formState.value.width} / ${formState.value.height}`,
}));

const updateBackgroundFileList = () => {
	backgroundFileList.value = formState.value.backgroundImage
		? [{ uid: '-1', name: 'background.png', status: 'done', url: formState.value.backgroundImage }]
		: [];
};

const fetchConfig = async () => {
	try {
		const res = await getCourseCoverConfig();
		formState.value = normalizeCourseCoverConfig(res.data || res);
	} catch (error) {
		formState.value = cloneCourseCoverConfig(DEFAULT_COURSE_COVER_CONFIG);
	} finally {
		updateBackgroundFileList();
		await refreshPreview();
	}
};

const refreshPreview = async () => {
	try {
		const canvas = await renderCourseCover(formState.value, samplePayload, { includeFields: false });
		previewUrl.value = canvas.toDataURL('image/png');
	} catch (error) {
		console.error('封面预览生成失败:', error);
	}
};

watch(
	() => formState.value,
	() => {
		refreshPreview();
	},
	{ deep: true },
);

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
};

const createField = (type: 'courseField' | 'staticText'): CourseCoverFieldConfig => ({
	id: `field_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
	label: type === 'courseField' ? '新字段' : '新文案',
	type,
	sourceKey: type === 'courseField' ? 'school' : '',
	text: type === 'staticText' ? '请输入文案' : '',
	x: 600,
	y: 600,
	fontSize: 42,
	color: '#FFFFFF',
	fontWeight: '700',
	fontFamily: 'serif',
	maxWidth: 900,
	align: 'center',
	maxLines: 1,
	lineHeight: 42,
});

const getFieldPreviewText = (field: CourseCoverFieldConfig) => {
	if (field.type === 'staticText') {
		return field.label || field.text || '静态文本';
	}
	return field.label || '字段';
};

const getFieldStyle = (field: CourseCoverFieldConfig) => ({
	left: `${field.x * previewScale.value}px`,
	top: `${field.y * previewScale.value}px`,
	color: field.color,
	fontSize: `${field.fontSize * previewScale.value}px`,
	fontWeight: field.fontWeight || '700',
	fontFamily: field.fontFamily || 'serif',
	textAlign: field.align || 'center',
	maxWidth: `${(field.maxWidth || formState.value.width) * previewScale.value}px`,
	transform:
		field.align === 'left'
			? 'translate(0, -100%)'
			: field.align === 'right'
				? 'translate(-100%, -100%)'
				: 'translate(-50%, -100%)',
});

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

const handleSave = async () => {
	saving.value = true;
	try {
		await setCourseCoverConfig(normalizeCourseCoverConfig(formState.value));
		message.success('课程封面配置已保存');
	} catch (error: any) {
		message.error(error?.message || '保存失败');
	} finally {
		saving.value = false;
	}
};

const handleReset = async () => {
	formState.value = cloneCourseCoverConfig(DEFAULT_COURSE_COVER_CONFIG);
	updateBackgroundFileList();
	await refreshPreview();
	message.success('已恢复默认配置');
};

onMounted(() => {
	window.addEventListener('pointermove', updateDraggedField);
	window.addEventListener('pointerup', stopDrag);
	window.addEventListener('keydown', handleKeydown);
	fetchConfig();
	requestAnimationFrame(() => updatePreviewBoardWidth());
});

onBeforeUnmount(() => {
	window.removeEventListener('pointermove', updateDraggedField);
	window.removeEventListener('pointerup', stopDrag);
	window.removeEventListener('keydown', handleKeydown);
});
</script>

<style scoped lang="scss">
.course-cover-config {
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

	.preview-wrap {
		display: flex;
		justify-content: center;
		padding: 8px;
		background: #f7f7f7;
		border-radius: 12px;
	}

	.preview-board {
		position: relative;
		width: 100%;
		max-width: 420px;
		user-select: none;
		touch-action: none;
	}

	.preview-wrap img,
	.preview-board__image {
		width: 100%;
		display: block;
		border-radius: 10px;
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
	}

	.preview-board__field {
		position: absolute;
		z-index: 2;
		cursor: grab;
		white-space: pre-wrap;
		line-height: 1.1;
		text-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
	}

	.preview-board__field.is-active {
		outline: 1px dashed rgba(255, 255, 255, 0.9);
		outline-offset: 4px;
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
