<template>
	<a-drawer
		:open="open"
		:title="drawerTitle"
		width="600px"
		@close="handleClose"
	>
		<a-form :model="formState" :label-col="{ span: 6 }" :wrapper-col="{ span: 18 }">
			<a-form-item label="配置类型">
				<a-radio-group v-model:value="configType" @change="handleConfigTypeChange">
					<a-radio value="global">公共配置</a-radio>
					<a-radio value="course">课程配置</a-radio>
				</a-radio-group>
				<div style="margin-top: 8px; color: #999; font-size: 12px">
					{{ configType === 'global' ? '公共配置将作为所有课程的默认推荐，当课程没有单独配置时使用' : '为当前课程单独配置推荐内容，优先级高于公共配置' }}
				</div>
			</a-form-item>

			<a-form-item label="推荐课程">
				<a-select
					v-model:value="selectedCourseIds"
					mode="multiple"
					:options="courseOptions"
					placeholder="请选择推荐的课程"
					:loading="courseLoading"
					style="width: 100%"
					:filter-option="filterOption"
					show-search
					:max-tag-count="3"
				>
					<template #option="{ value, label }">
						<div style="display: flex; justify-content: space-between; align-items: center">
							<span>{{ label }}</span>
							<a-tag v-if="getCoursePrice(value) > 0" color="orange">¥{{ getCoursePrice(value) }}</a-tag>
							<a-tag v-else color="green">免费</a-tag>
						</div>
					</template>
				</a-select>
				<div style="margin-top: 8px; color: #999; font-size: 12px">
					已选择 {{ selectedCourseIds.length }} 个课程
				</div>
			</a-form-item>
		</a-form>

		<template #footer>
			<a-space>
				<a-button @click="handleClose">取消</a-button>
				<a-button type="primary" :loading="loading" @click="handleSubmit">保存</a-button>
			</a-space>
		</template>
	</a-drawer>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { message } from 'ant-design-vue';
import { getCourseList } from '@/api/course';
import { getRecommendations, updateRecommendations } from '@/api/course';

const props = defineProps<{
	open: boolean;
	courseId?: number | null;
	courseName?: string;
}>();

const emit = defineEmits<{
	(e: 'close'): void;
	(e: 'success'): void;
}>();

const loading = ref(false);
const courseLoading = ref(false);
const configType = ref<'global' | 'course'>('global');
const selectedCourseIds = ref<number[]>([]);
const allCourses = ref<any[]>([]);
const courseOptions = ref<Array<{ value: number; label: string }>>([]);

const drawerTitle = computed(() => {
	if (configType.value === 'global') {
		return '相关推荐 - 公共配置';
	}
	return props.courseName ? `相关推荐 - ${props.courseName}` : '相关推荐 - 课程配置';
});

const filterOption = (input: string, option: any) => {
	return option.label.toLowerCase().indexOf(input.toLowerCase()) >= 0;
};

const getCoursePrice = (courseId: number) => {
	const course = allCourses.value.find(c => c.id === courseId);
	return course?.price || 0;
};

const handleConfigTypeChange = () => {
	loadRecommendations();
};

const loadCourses = async () => {
	courseLoading.value = true;
	try {
		const res = await getCourseList();
		allCourses.value = Array.isArray(res.data) ? res.data : res.data.list || [];
		courseOptions.value = allCourses.value.map(course => ({
			value: course.id,
			label: `${course.name}${course.subject ? ` (${course.subject})` : ''}`,
		}));
	} catch (error) {
		message.error('获取课程列表失败');
	} finally {
		courseLoading.value = false;
	}
};

const loadRecommendations = async () => {
	if (configType.value === 'global') {
		// 加载公共配置
		try {
			const res = await getRecommendations(null);
			selectedCourseIds.value = res.data?.recommendedCourseIds || [];
		} catch (error) {
			console.error('加载公共配置失败:', error);
			selectedCourseIds.value = [];
		}
	} else {
		// 加载课程配置
		if (props.courseId) {
			try {
				const res = await getRecommendations(props.courseId);
				selectedCourseIds.value = res.data?.recommendedCourseIds || [];
			} catch (error) {
				console.error('加载课程配置失败:', error);
				selectedCourseIds.value = [];
			}
		} else {
			selectedCourseIds.value = [];
		}
	}
};

const handleSubmit = async () => {
	if (selectedCourseIds.value.length === 0) {
		message.warning('请至少选择一个推荐课程');
		return;
	}

	loading.value = true;
	try {
		const courseId = configType.value === 'global' ? null : props.courseId;
		await updateRecommendations({
			courseId,
			recommendedCourseIds: selectedCourseIds.value,
		});
		message.success('保存成功');
		emit('success');
		handleClose();
	} catch (error: any) {
		message.error(error.message || '保存失败');
	} finally {
		loading.value = false;
	}
};

const handleClose = () => {
	emit('close');
};

watch(
	() => props.open,
	(newVal) => {
		if (newVal) {
			loadCourses();
			// 默认加载课程配置（如果有courseId），否则加载公共配置
			if (props.courseId) {
				configType.value = 'course';
			} else {
				configType.value = 'global';
			}
			loadRecommendations();
		} else {
			selectedCourseIds.value = [];
		}
	}
);
</script>

<style scoped lang="scss">
</style>
