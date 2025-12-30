<template>
	<div class="wang-editor-wrapper">
		<Toolbar
			style="border-bottom: 1px solid #ccc"
			:editor="editorRef"
			:defaultConfig="toolbarConfig"
			:mode="mode"
		/>
		<Editor
			style="height: 300px; overflow-y: hidden"
			v-model="value"
			:defaultConfig="editorConfig"
			:mode="mode"
			@onCreated="handleCreated"
			@onChange="handleChange"
		/>
	</div>
</template>

<script setup lang="ts">
import { ref, shallowRef, onBeforeUnmount, watch } from 'vue';
import '@wangeditor/editor/dist/css/style.css';
import { Editor, Toolbar } from '@wangeditor/editor-for-vue';
import type { IDomEditor, IEditorConfig, IToolbarConfig } from '@wangeditor/editor';
import { uploadImage } from '@/api/upload';

const props = defineProps<{
	modelValue: string;
	mode?: 'default' | 'simple';
	placeholder?: string;
}>();

const emit = defineEmits<{
	(e: 'update:modelValue', value: string): void;
}>();

const mode = props.mode || 'simple';
const editorRef = shallowRef<IDomEditor>();
const value = ref(props.modelValue);

// 工具栏配置（简洁模式）
const toolbarConfig: Partial<IToolbarConfig> = {
	excludeKeys: ['group-video', 'group-more-style'], // 排除视频和更多样式
};

// 编辑器配置
const editorConfig: Partial<IEditorConfig> = {
	placeholder: props.placeholder || '请输入内容...',
	MENU_CONF: {
		uploadImage: {
			// 自定义上传处理
			async customUpload(file: File, insertFn: (url: string, alt: string, href: string) => void) {
				try {
					const response = await uploadImage(file)
					const url = response.url || response.imageUrl

					if (url) {
						insertFn(url, file.name, url)
					} else {
						throw new Error('上传失败：未返回图片URL')
					}
				} catch (error: any) {
					console.error('图片上传失败:', error)
					throw error
				}
			},
		},
	},
};

// 组件销毁时，也及时销毁编辑器
onBeforeUnmount(() => {
	const editor = editorRef.value;
	if (editor == null) return;
	editor.destroy();
});

// 监听外部值变化
watch(
	() => props.modelValue,
	(newVal) => {
		if (newVal !== value.value) {
			value.value = newVal;
		}
	}
);

const handleCreated = (editor: IDomEditor) => {
	editorRef.value = editor;
};

const handleChange = (editor: IDomEditor) => {
	const html = editor.getHtml();
	value.value = html;
	emit('update:modelValue', html);
};
</script>

<style scoped lang="scss">
.wang-editor-wrapper {
	border: 1px solid #d9d9d9;
	border-radius: 4px;
	overflow: hidden;
	transition: border-color 0.3s;

	&:hover {
		border-color: #40a9ff;
	}

	&:focus-within {
		border-color: #40a9ff;
		box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
	}
}

:deep(.w-e-text-container) {
	background-color: #fff;
}

:deep(.w-e-text-placeholder) {
	color: #bfbfbf;
}
</style>

