<template>
	<div class="option-editor">
		<a-space direction="vertical" style="width: 100%">
			<a-radio-group v-model:value="inputType" style="margin-bottom: 8px">
				<a-radio-button value="text">文本</a-radio-button>
				<a-radio-button value="image">图片</a-radio-button>
			</a-radio-group>

			<div v-if="inputType === 'text'" class="text-input">
				<a-input
					v-model:value="textValue"
					placeholder="请输入选项内容"
					@change="handleTextChange"
				/>
			</div>

			<div v-else class="image-input">
				<a-upload
					v-model:file-list="fileList"
					name="file"
					list-type="picture-card"
					:max-count="1"
					:before-upload="beforeUpload"
					:customRequest="handleUpload"
					@remove="handleRemove"
				>
					<div v-if="fileList.length < 1">
						<plus-outlined />
						<div style="margin-top: 8px">上传图片</div>
					</div>
				</a-upload>
				<div v-if="imageUrl" class="image-preview">
					<a-image :src="imageUrl" :width="200" :preview="true" />
				</div>
			</div>
		</a-space>
	</div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import { message } from 'ant-design-vue';
import { PlusOutlined } from '@ant-design/icons-vue';
import type { UploadProps, UploadFile } from 'ant-design-vue';
import { uploadImage } from '@/api/upload';

const props = defineProps<{
	modelValue: string;
}>();

const emit = defineEmits<{
	(e: 'update:modelValue', value: string): void;
}>();

const inputType = ref<'text' | 'image'>('text');
const textValue = ref('');
const imageUrl = ref('');
const fileList = ref<UploadFile[]>([]);

// 初始化：判断当前值是文本还是图片URL
onMounted(() => {
	if (props.modelValue) {
		// 判断是否为图片URL（简单判断：以http开头或包含图片扩展名）
		if (props.modelValue.startsWith('http') || /\.(jpg|jpeg|png|gif|webp)$/i.test(props.modelValue)) {
			inputType.value = 'image';
			imageUrl.value = props.modelValue;
			fileList.value = [
				{
					uid: '-1',
					name: 'image.png',
					status: 'done',
					url: props.modelValue,
				},
			];
		} else {
			inputType.value = 'text';
			textValue.value = props.modelValue;
		}
	}
});

// 监听外部值变化
watch(
	() => props.modelValue,
	(newVal) => {
		if (newVal !== textValue.value && newVal !== imageUrl.value) {
			if (newVal.startsWith('http') || /\.(jpg|jpeg|png|gif|webp)$/i.test(newVal)) {
				inputType.value = 'image';
				imageUrl.value = newVal;
			} else {
				inputType.value = 'text';
				textValue.value = newVal;
			}
		}
	}
);

// 监听输入类型变化
watch(inputType, (newType) => {
	if (newType === 'text') {
		emit('update:modelValue', textValue.value);
		imageUrl.value = '';
		fileList.value = [];
	} else {
		emit('update:modelValue', imageUrl.value);
		textValue.value = '';
	}
});

const handleTextChange = () => {
	emit('update:modelValue', textValue.value);
};

const beforeUpload: UploadProps['beforeUpload'] = (file) => {
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
	return false; // 阻止自动上传，使用自定义上传
};

const handleUpload = async (options: any) => {
	const { file, onSuccess, onError } = options;

	try {
		const response = await uploadImage(file);
		const url = response.url || response.imageUrl;

		if (url) {
			imageUrl.value = url;
			emit('update:modelValue', url);
			onSuccess?.('ok');
			message.success('上传成功');
		} else {
			throw new Error('上传失败：未返回图片URL');
		}
	} catch (error: any) {
		// 如果上传失败，使用本地预览作为临时方案
		const localUrl = URL.createObjectURL(file);
		imageUrl.value = localUrl;
		emit('update:modelValue', localUrl);
		onSuccess?.('ok');
		message.warning('使用本地预览，请配置图片上传接口');
		console.error('图片上传失败:', error);
	}
};

const handleRemove = () => {
	imageUrl.value = '';
	fileList.value = [];
	emit('update:modelValue', '');
};
</script>

<style scoped lang="scss">
.option-editor {
	width: 100%;

	.text-input {
		width: 100%;
	}

	.image-input {
		width: 100%;

		.image-preview {
			margin-top: 8px;
		}
	}
}

:deep(.ant-upload-select-picture-card) {
	width: 104px;
	height: 104px;
}
</style>

