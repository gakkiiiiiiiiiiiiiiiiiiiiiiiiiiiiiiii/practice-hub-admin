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
			<a-form-item label="封面图" name="cover_img">
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
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { message } from 'ant-design-vue';
import { PlusOutlined } from '@ant-design/icons-vue';
import { createCourse, updateCourse } from '@/api/course';
import { getCourseCategoryTree } from '@/api/course-category';
import { uploadImage } from '@/api/upload';
import type { UploadProps } from 'ant-design-vue';
import WangEditor from '@/components/WangEditor/index.vue';

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
const fileList = ref<any[]>([]);
const categoryTree = ref<any[]>([]);
const categoryCascaderValue = ref<string[]>([]);

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
});


const rules = {
	name: [{ required: true, message: '请输入课程名称', trigger: 'blur' }],
	price: [{ required: true, message: '请输入价格', trigger: 'blur' }],
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
				};
				fileList.value = [];
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
	const isLt5M = file.size / 1024 / 1024 < 5;
	if (!isLt5M) {
		message.error('图片大小不能超过 5MB!');
		return false;
	}
	// 允许 upload 组件继续（返回true触发customRequest调用handleUpload）
	return true;
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

const handleCancel = () => {
	emit('update:open', false);
	formRef.value?.resetFields();
	categoryCascaderValue.value = [];
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
