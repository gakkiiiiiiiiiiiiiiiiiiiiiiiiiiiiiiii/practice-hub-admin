<template>
	<a-modal
		:open="open"
		:title="record ? '编辑课程' : '新增课程'"
		@cancel="handleCancel"
		@ok="handleSubmit"
		:confirmLoading="loading"
		width="600px"
	>
		<a-form ref="formRef" :model="formState" :rules="rules" :label-col="{ span: 6 }" :wrapper-col="{ span: 18 }">
			<a-form-item label="课程名称" name="name">
				<a-input v-model:value="formState.name" placeholder="请输入课程名称" />
			</a-form-item>
			<a-form-item label="课程类型" name="content_type">
				<a-radio-group v-model:value="formState.content_type">
					<a-radio value="normal">普通题库（章节+题目）</a-radio>
					<a-radio value="file">文件课程（PDF/Word 直接查看）</a-radio>
				</a-radio-group>
			</a-form-item>
			<a-form-item v-if="formState.content_type === 'file'" label="课程文件" name="file_url">
				<a-upload
					v-model:file-list="courseFileList"
					:before-upload="beforeCourseFileUpload"
					:custom-request="handleCourseFileUpload"
					:max-count="1"
					accept=".pdf,.doc,.docx"
				>
					<a-button v-if="courseFileList.length < 1">
						<upload-outlined />
						上传 PDF 或 Word
					</a-button>
				</a-upload>
				<div v-if="formState.file_name" class="form-tip">当前文件：{{ formState.file_name }}</div>
			</a-form-item>
			<a-form-item v-if="formState.content_type === 'file'" label="源文件查看">
				<a-radio-group v-model:value="formState.allow_source_file">
					<a-radio :value="1">允许用户查看源文件</a-radio>
					<a-radio :value="0">关闭</a-radio>
				</a-radio-group>
				<div class="form-tip">关闭后，小程序端不展示“查看完整文件/查看文件”入口。</div>
			</a-form-item>
			<a-form-item label="课程" name="subject">
				<a-input v-model:value="formState.subject" placeholder="请输入课程（如：数学、英语等）" />
			</a-form-item>
			<a-form-item label="课程分类" name="category">
				<a-cascader
					v-model:value="categoryCascaderValue"
					:options="cascaderOptions"
					:field-names="{ label: 'label', value: 'value', children: 'children' }"
					placeholder="请选择课程分类"
					allow-clear
					:show-search="{ filter: cascaderFilter }"
					style="width: 100%"
				/>
			</a-form-item>
			<a-form-item label="学校" name="school">
				<a-input v-model:value="formState.school" placeholder="请输入学校（如：北京大学等）" />
			</a-form-item>
			<a-form-item label="专业" name="major">
				<a-input v-model:value="formState.major" placeholder="请输入专业（如：计算机科学与技术等）" />
			</a-form-item>
			<a-form-item label="真题年份" name="exam_year">
				<a-input v-model:value="formState.exam_year" placeholder="请输入真题年份（如：2024）" />
			</a-form-item>
			<a-form-item label="答案年份" name="answer_year">
				<a-input v-model:value="formState.answer_year" placeholder="请输入答案年份（如：2024）" />
			</a-form-item>
			<a-form-item label="封面方式">
				<a-radio-group v-model:value="coverMode">
					<a-radio value="manual">手动上传</a-radio>
					<a-radio value="auto">自动生成</a-radio>
				</a-radio-group>
			</a-form-item>
			<a-form-item label="封面图" name="cover_img">
				<template v-if="coverMode === 'manual'">
					<a-upload
						v-model:file-list="fileList"
						:before-upload="beforeUpload"
						:custom-request="handleUpload"
						list-type="picture-card"
						:max-count="1"
					>
						<div v-if="fileList.length < 1">
							<plus-outlined />
							<div style="margin-top: 8px">上传</div>
						</div>
					</a-upload>
				</template>
				<template v-else>
					<div class="cover-generator">
						<div class="cover-generator__actions">
							<a-button type="primary" :loading="autoCoverLoading" @click="handleGenerateCover">
								生成并使用封面
							</a-button>
							<a-button @click="handleOpenCoverConfig">
								配置封面模板
							</a-button>
							<span class="cover-generator__hint">
								将根据学校、专业、科目、真题年份、答案年份自动生成
							</span>
						</div>
						<div v-if="generatedCoverPreview || formState.cover_img" class="cover-generator__preview">
							<img :src="generatedCoverPreview || formState.cover_img" alt="自动生成封面预览" />
						</div>
					</div>
				</template>
			</a-form-item>
			<a-form-item label="价格" name="price">
				<a-input-number
					v-model:value="formState.price"
					:min="0"
					:precision="2"
					style="width: 100%"
					placeholder="请输入价格"
				/>
			</a-form-item>
			<a-form-item label="代理商售价" name="agent_price">
				<a-input-number
					v-model:value="formState.agent_price"
					:min="0"
					:precision="2"
					style="width: 100%"
					placeholder="请输入代理商售价"
				/>
			</a-form-item>
			<a-form-item label="是否免费" name="is_free">
				<a-radio-group v-model:value="formState.is_free">
					<a-radio :value="0">付费</a-radio>
					<a-radio :value="1">免费</a-radio>
				</a-radio-group>
			</a-form-item>
			<a-form-item v-if="formState.is_free === 0" label="有效期设置" name="validity_days">
				<a-radio-group v-model:value="formState.validity_days">
					<a-radio :value="30">30天</a-radio>
					<a-radio :value="90">90天</a-radio>
					<a-radio :value="180">180天</a-radio>
					<a-radio :value="365">365天</a-radio>
					<a-radio :value="null">永久有效</a-radio>
				</a-radio-group>
				<div style="margin-top: 8px; color: #999; font-size: 12px">
					设置用户购买此课程后的有效期，选择"永久有效"则购买后永久可用
				</div>
			</a-form-item>
			<a-form-item label="排序" name="sort">
				<a-input-number
					v-model:value="formState.sort"
					:min="0"
					style="width: 100%"
					placeholder="请输入排序值（数字越小越靠前）"
				/>
			</a-form-item>
			<a-form-item label="课程介绍" name="introduction">
				<WangEditor v-model="formState.introduction" placeholder="请输入课程介绍（支持富文本）" />
			</a-form-item>
		</a-form>
	</a-modal>
	<a-modal
		:open="coverConfigOpen"
		title="课程封面配置"
		width="1280px"
		:footer="null"
		@cancel="coverConfigOpen = false"
	>
		<CourseCoverConfig />
	</a-modal>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { message } from 'ant-design-vue';
import { PlusOutlined, UploadOutlined } from '@ant-design/icons-vue';
import { createCourse, updateCourse } from '@/api/course';
import { getCourseCoverConfig } from '@/api/system';
import { getCourseCategoryTree } from '@/api/course-category';
import { uploadImage, uploadCourseFile } from '@/api/upload';
import type { UploadProps } from 'ant-design-vue';
import WangEditor from '@/components/WangEditor/index.vue';
import CourseCoverConfig from '@/views/system/config/components/CourseCoverConfig.vue';
import { DEFAULT_COURSE_COVER_CONFIG, normalizeCourseCoverConfig, renderCourseCover } from '@/utils/course-cover';

const props = defineProps<{
	open: boolean;
	record: any;
}>();

const emit = defineEmits<{
	(e: 'update:open', value: boolean): void;
	(e: 'success'): void;
}>();

const formRef = ref();
const loading = ref(false);
const uploadLoading = ref(false);
const courseFileUploading = ref(false);
const autoCoverLoading = ref(false);
const fileList = ref<any[]>([]);
const courseFileList = ref<any[]>([]);
const categoryTree = ref<any[]>([]);
const categoryCascaderValue = ref<string[]>([]);
const coverMode = ref<'manual' | 'auto'>('manual');
const coverConfigOpen = ref(false);
const generatedCoverPreview = ref('');
let generatedPreviewObjectUrl = '';

// 转换为级联选择器需要的格式
const cascaderOptions = computed(() => {
	return categoryTree.value
		.filter((item) => item.status === 1 || item.name === formState.value.category)
		.map((parent) => ({
			label: parent.name,
			value: parent.name,
			children: Array.isArray(parent.children)
				? parent.children
						.filter((child) => child.status === 1 || child.name === formState.value.sub_category)
						.map((child) => ({
							label: child.name,
							value: child.name,
						}))
				: [],
		}))
		.filter((item) => item.children.length > 0 || item.value === formState.value.category);
});

// 级联选择器搜索过滤函数
const cascaderFilter = (inputValue: string, path: any[]) => {
	return path.some((option) => option.label.toLowerCase().indexOf(inputValue.toLowerCase()) > -1);
};

const formState = ref({
	name: '',
	subject: '',
	category: '',
	sub_category: '',
	school: '',
	major: '',
	exam_year: '',
	answer_year: '',
	cover_img: '',
	price: 0,
	agent_price: 0,
	is_free: 0,
	validity_days: null as number | null,
	sort: 0,
	introduction: '',
	content_type: 'normal',
	file_url: '',
	file_name: '',
	file_type: '',
	allow_source_file: 0,
});


const rules = {
	name: [{ required: true, message: '请输入课程名称', trigger: 'blur' }],
	price: [{ required: true, message: '请输入价格', trigger: 'blur' }],
	file_url: [
		{
			validator: (_rule: any, value: string) => {
				if (formState.value.content_type === 'file' && !value) {
					return Promise.reject(new Error('请上传课程文件（PDF 或 Word）'));
				}
				return Promise.resolve();
			},
			trigger: 'change',
		},
	],
};

watch(
	() => props.open,
	(val) => {
		if (val) {
			if (props.record) {
				// 映射后端字段到前端表单
				formState.value = {
					name: props.record.name || '',
					subject: props.record.subject || '',
					category: props.record.category || '',
					sub_category: props.record.sub_category || '',
					school: props.record.school || '',
					major: props.record.major || '',
					exam_year: props.record.exam_year || '',
					answer_year: props.record.answer_year || '',
					cover_img: props.record.cover_img || props.record.cover || '',
					price: props.record.price || 0,
					agent_price: props.record.agent_price || 0,
					is_free: props.record.is_free ?? 0,
					validity_days: props.record.validity_days ?? null,
					sort: props.record.sort || 0,
					introduction: props.record.introduction || '',
					content_type: props.record.content_type || 'normal',
					file_url: props.record.file_url || '',
					file_name: props.record.file_name || '',
					file_type: props.record.file_type || '',
					allow_source_file: props.record.allow_source_file ?? 0,
				};
				if (formState.value.cover_img) {
					fileList.value = [
						{
							uid: '-1',
							name: 'cover.png',
							status: 'done',
							url: formState.value.cover_img,
						},
					];
				} else {
					fileList.value = [];
				}
				coverMode.value = 'manual';
				generatedCoverPreview.value = '';
				if (formState.value.content_type === 'file' && formState.value.file_url) {
					courseFileList.value = [
						{
							uid: '-1',
							name: formState.value.file_name || '课程文件',
							status: 'done',
							url: formState.value.file_url,
						},
					];
				} else {
					courseFileList.value = [];
				}
			} else {
				formState.value = {
					name: '',
					subject: '',
					category: '',
					sub_category: '',
					school: '',
					major: '',
					exam_year: '',
					answer_year: '',
					cover_img: '',
					price: 0,
					agent_price: 0,
					is_free: 0,
					validity_days: null,
					sort: 0,
					introduction: '',
					content_type: 'normal',
					file_url: '',
					file_name: '',
					file_type: '',
					allow_source_file: 0,
				};
				fileList.value = [];
				courseFileList.value = [];
				coverMode.value = 'manual';
				generatedCoverPreview.value = '';
			}
			fetchCategoryTree();
		}
	}
);

// 监听级联选择器的值变化，同步到 formState
watch(
	() => categoryCascaderValue.value,
	(newValue) => {
		if (Array.isArray(newValue) && newValue.length > 0) {
			formState.value.category = newValue[0] || '';
			formState.value.sub_category = newValue[1] || '';
		} else {
			formState.value.category = '';
			formState.value.sub_category = '';
		}
	},
);

// 监听 formState 的 category 和 sub_category 变化，同步到级联选择器
// 注意：只在 categoryTree 加载完成后才同步，避免数据未加载时的错误
watch(
	[() => formState.value.category, () => formState.value.sub_category, () => categoryTree.value.length],
	([category, subCategory, treeLength]) => {
		// 等待分类树加载完成
		if (treeLength === 0) {
			return;
		}
		if (category && subCategory) {
			categoryCascaderValue.value = [category, subCategory];
		} else if (category) {
			categoryCascaderValue.value = [category];
		} else {
			categoryCascaderValue.value = [];
		}
	},
	{ immediate: true },
);

const fetchCategoryTree = async () => {
	try {
		const res = await getCourseCategoryTree();
		categoryTree.value = Array.isArray(res.data) ? res.data : [];
		// 数据加载完成后，同步级联选择器的值
		if (formState.value.category && formState.value.sub_category) {
			categoryCascaderValue.value = [formState.value.category, formState.value.sub_category];
		} else if (formState.value.category) {
			categoryCascaderValue.value = [formState.value.category];
		} else {
			categoryCascaderValue.value = [];
		}
	} catch (error) {
		message.error('获取分类列表失败');
	}
};

const beforeUpload: UploadProps['beforeUpload'] = (file) => {
	const isImage = file.type.startsWith('image/');
	if (!isImage) {
		message.error('只能上传图片文件!');
		return false;
	}
	// 允许 upload 组件继续（返回true触发customRequest调用handleUpload）
	return true;
};

const beforeCourseFileUpload: UploadProps['beforeUpload'] = (file) => {
	const name = (file.name || '').toLowerCase();
	const ok = name.endsWith('.pdf') || name.endsWith('.doc') || name.endsWith('.docx');
	if (!ok) {
		message.error('仅支持 PDF、Word（.doc/.docx）文件');
		return false;
	}
	return true;
};

const handleCourseFileUpload = async (options: any) => {
	const { file, onSuccess, onError } = options;
	try {
		courseFileUploading.value = true;
		const res = await uploadCourseFile(file as File);
		formState.value.file_url = res.url || res.fileUrl;
		formState.value.file_name = res.fileName;
		formState.value.file_type = res.fileType;
		courseFileList.value = [
			{ uid: file.uid, name: res.fileName, status: 'done', url: res.url || res.fileUrl },
		];
		onSuccess?.();
		message.success('课程文件上传成功');
	} catch (e: any) {
		message.error(e?.message || '上传失败');
		onError?.(e);
	} finally {
		courseFileUploading.value = false;
	}
};

const handleUpload = async (options: any) => {
	const { file, onSuccess, onError } = options;
	try {
		uploadLoading.value = true;
		const response = await uploadImage(file as File);

		// 修正：uploadImage返回 { url, imageUrl }
		const url = response.url || response.imageUrl;

		if (url) {
			formState.value.cover_img = url;
			fileList.value = [
				{
					uid: Date.now().toString(),
					name: file.name,
					status: 'done',
					url,
				},
			];
			onSuccess?.('ok');
			message.success('上传成功');
		} else {
			throw new Error('上传失败：未返回图片URL');
		}
	} catch (error: any) {
		console.error('图片上传失败:', error);
		message.error(error?.message || '图片上传失败');
		onError?.(error);
	} finally {
		uploadLoading.value = false;
	}
};

const handleGenerateCover = async () => {
	try {
		autoCoverLoading.value = true;
		const coverFile = await generateCourseCoverFile();
		if (generatedPreviewObjectUrl) {
			URL.revokeObjectURL(generatedPreviewObjectUrl);
		}
		generatedPreviewObjectUrl = URL.createObjectURL(coverFile);
		generatedCoverPreview.value = generatedPreviewObjectUrl;
		const response = await uploadImage(coverFile);
		const url = response.url || response.imageUrl;
		if (!url) {
			throw new Error('自动生成封面上传失败');
		}
		formState.value.cover_img = url;
		fileList.value = [
			{
				uid: `auto-${Date.now()}`,
				name: coverFile.name,
				status: 'done',
				url,
			},
		];
		message.success('已生成并使用自动封面');
	} catch (error: any) {
		message.error(error?.message || '自动生成封面失败');
	} finally {
		autoCoverLoading.value = false;
	}
};

const generateCourseCoverFile = async (): Promise<File> => {
	const school = formState.value.school?.trim();
	const major = formState.value.major?.trim();

	if (!school || !major) {
		throw new Error('请先填写学校和专业，再自动生成封面');
	}
	let config = DEFAULT_COURSE_COVER_CONFIG;
	try {
		const res = await getCourseCoverConfig();
		config = normalizeCourseCoverConfig(res.data || res);
	} catch (_) {
		config = normalizeCourseCoverConfig(DEFAULT_COURSE_COVER_CONFIG);
	}
	const canvas = await renderCourseCover(config, {
		name: formState.value.name?.trim(),
		subject: formState.value.subject?.trim(),
		category: formState.value.category?.trim(),
		sub_category: formState.value.sub_category?.trim(),
		school,
		major,
		exam_year: formState.value.exam_year?.trim() || '待更新',
		answer_year: formState.value.answer_year?.trim() || '待更新',
	});
	const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png', 0.96));
	if (!blob) {
		throw new Error('封面生成失败');
	}

	const fileName = `${sanitizeFileName(school)}-${sanitizeFileName(major)}-cover.png`;
	return new File([blob], fileName, { type: 'image/png' });
};

const sanitizeFileName = (value: string) => value.replace(/[\\/:*?"<>|]+/g, '-').slice(0, 40);

const handleOpenCoverConfig = () => {
	coverConfigOpen.value = true;
};

const handleCancel = () => {
	emit('update:open', false);
	formRef.value?.resetFields();
	categoryCascaderValue.value = [];
	coverConfigOpen.value = false;
};

const handleSubmit = async () => {
	try {
		await formRef.value?.validate();
		loading.value = true;

		// 构建符合后端 DTO 的数据
		const submitData: any = {
			name: formState.value.name,
		};

		// 只添加有值的字段
		if (formState.value.subject) {
			submitData.subject = formState.value.subject;
		}
		if (formState.value.category) {
			submitData.category = formState.value.category;
		}
		if (formState.value.sub_category) {
			submitData.sub_category = formState.value.sub_category;
		}
		if (formState.value.school) {
			submitData.school = formState.value.school;
		}
		if (formState.value.major) {
			submitData.major = formState.value.major;
		}
		if (formState.value.exam_year) {
			submitData.exam_year = formState.value.exam_year;
		}
		if (formState.value.answer_year) {
			submitData.answer_year = formState.value.answer_year;
		}
		if (formState.value.cover_img) {
			submitData.cover_img = formState.value.cover_img;
		}
		if (formState.value.price !== undefined && formState.value.price !== null) {
			submitData.price = formState.value.price;
		}
		if (formState.value.agent_price !== undefined && formState.value.agent_price !== null) {
			submitData.agent_price = formState.value.agent_price;
		}
		if (formState.value.is_free !== undefined) {
			submitData.is_free = formState.value.is_free;
		}
		// 只有付费课程才设置有效期
		if (formState.value.is_free === 0) {
			if (formState.value.validity_days !== undefined) {
				submitData.validity_days = formState.value.validity_days;
			}
		} else {
			// 免费课程不设置有效期
			submitData.validity_days = null;
		}
		if (formState.value.sort !== undefined) {
			submitData.sort = formState.value.sort;
		}
		if (formState.value.introduction !== undefined) {
			submitData.introduction = formState.value.introduction;
		}
		submitData.content_type = formState.value.content_type || 'normal';
		if (formState.value.content_type === 'file') {
			submitData.file_url = formState.value.file_url || null;
			submitData.file_name = formState.value.file_name || null;
			submitData.file_type = formState.value.file_type || null;
			submitData.allow_source_file = formState.value.allow_source_file ?? 0;
		} else {
			submitData.file_url = null;
			submitData.file_name = null;
			submitData.file_type = null;
			submitData.allow_source_file = 0;
		}

		if (props.record) {
			await updateCourse(props.record.id, submitData);
			message.success('更新成功');
		} else {
			await createCourse(submitData);
			message.success('创建成功');
		}

		emit('success');
		emit('update:open', false);
	} catch (error: any) {
		if (error?.errorFields) {
			return;
		}
		message.error(error?.message || '操作失败');
	} finally {
		loading.value = false;
	}
};
</script>

<style scoped>
.cover-generator {
	display: flex;
	flex-direction: column;
	gap: 12px;
}

.cover-generator__actions {
	display: flex;
	align-items: center;
	flex-wrap: wrap;
	gap: 12px;
}

.cover-generator__hint {
	color: #8c8c8c;
	font-size: 12px;
}

.cover-generator__preview {
	width: 180px;
	padding: 8px;
	border: 1px solid #f0f0f0;
	border-radius: 12px;
	background: #fafafa;
}

.cover-generator__preview img {
	display: block;
	width: 100%;
	border-radius: 8px;
}
</style>
