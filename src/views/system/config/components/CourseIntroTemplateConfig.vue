<template>
	<div class="course-intro-template-config">
		<a-alert
			type="info"
			show-icon
			message="这里配置课程介绍模板。新增课程或编辑课程时，如果课程介绍留空，系统会按分类匹配模板；未匹配时使用默认模板。"
			class="config-tip"
		/>

		<a-card title="介绍模板" class="template-card">
			<a-tabs v-model:activeKey="activeTemplateId" type="card">
				<a-tab-pane
					v-for="item in templatePack.templates"
					:key="item.id"
					:tab="item.name || '未命名模板'"
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

			<a-form layout="vertical" class="template-form">
				<a-form-item label="模板名称">
					<a-input v-model:value="currentTemplate.name" placeholder="请输入模板名称" maxlength="30" />
				</a-form-item>
				<a-form-item label="绑定分类">
					<a-cascader
						v-model:value="currentTemplate.bindCategory"
						:options="categoryOptions"
						:show-search="{ filter: cascaderFilter }"
						change-on-select
						allow-clear
						placeholder="不绑定则作为通用默认模板；可只选一级分类"
						style="width: 100%"
					/>
					<div class="form-tip">
						绑定一级分类后，该分类下所有二级分类会优先使用此介绍模板；也可继续选择二级分类做精确绑定。
					</div>
				</a-form-item>
				<a-form-item label="课程介绍模板">
					<WangEditor v-model="currentTemplate.template" placeholder="请输入课程介绍模板（支持富文本）" />
				</a-form-item>
			</a-form>
		</a-card>

		<div class="footer-actions">
			<a-space>
				<a-button @click="resetToDefault">恢复推荐模板</a-button>
				<a-button type="primary" :loading="saving" @click="save">保存配置</a-button>
			</a-space>
		</div>
	</div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { message } from 'ant-design-vue';
import WangEditor from '@/components/WangEditor/index.vue';
import { getCourseIntroTemplate, setCourseIntroTemplate } from '@/api/system';
import { getCourseCategoryTree } from '@/api/course-category';
import {
	DEFAULT_COURSE_INTRO_TEMPLATE,
	createCourseIntroTemplate,
	normalizeCourseIntroTemplatePack,
	type CourseIntroTemplatePack,
} from '@/utils/course-intro-template';

const templatePack = ref<CourseIntroTemplatePack>(normalizeCourseIntroTemplatePack(null));
const saving = ref(false);
const categoryTree = ref<any[]>([]);

const activeTemplateId = computed({
	get: () => templatePack.value.activeTemplateId,
	set: (value: string) => {
		templatePack.value.activeTemplateId = value;
	},
});

const currentTemplate = computed(() => {
	const current =
		templatePack.value.templates.find((item) => item.id === templatePack.value.activeTemplateId) ||
		templatePack.value.templates[0];
	return current;
});

const categoryOptions = computed(() =>
	categoryTree.value.map((parent) => ({
		label: parent.status === 0 ? `${parent.name}（已禁用）` : parent.name,
		value: parent.name,
		children: Array.isArray(parent.children)
			? parent.children.map((child: any) => ({
					label: child.status === 0 ? `${child.name}（已禁用）` : child.name,
					value: child.name,
				}))
			: [],
	})),
);

const cascaderFilter = (inputValue: string, path: any[]) =>
	path.some((option) => String(option.label || '').toLowerCase().includes(inputValue.toLowerCase()));

const ensureActiveTemplate = () => {
	if (templatePack.value.templates.some((item) => item.id === templatePack.value.activeTemplateId)) {
		return;
	}
	templatePack.value.activeTemplateId = templatePack.value.templates[0]?.id || 'default';
};

const load = async () => {
	try {
		const [templateRes, categoryRes] = await Promise.all([getCourseIntroTemplate(), getCourseCategoryTree()]);
		templatePack.value = normalizeCourseIntroTemplatePack(templateRes.data || templateRes);
		categoryTree.value = Array.isArray(categoryRes.data) ? categoryRes.data : Array.isArray(categoryRes) ? categoryRes : [];
		ensureActiveTemplate();
	} catch (error) {
		message.error('获取课程介绍模板失败');
		templatePack.value = normalizeCourseIntroTemplatePack(null);
	}
};

const handleCreateTemplate = () => {
	const next = createCourseIntroTemplate(
		`课程介绍模板 ${templatePack.value.templates.length + 1}`,
		DEFAULT_COURSE_INTRO_TEMPLATE,
	);
	templatePack.value.templates.push(next);
	templatePack.value.activeTemplateId = next.id;
};

const handleCopyTemplate = () => {
	const current = currentTemplate.value;
	const next = createCourseIntroTemplate(`${current.name || '课程介绍模板'} 副本`, current.template, {
		bindCategory: current.bindCategory,
	});
	templatePack.value.templates.push(next);
	templatePack.value.activeTemplateId = next.id;
};

const handleDeleteTemplate = () => {
	if (templatePack.value.templates.length <= 1) return;
	const index = templatePack.value.templates.findIndex((item) => item.id === templatePack.value.activeTemplateId);
	if (index >= 0) {
		templatePack.value.templates.splice(index, 1);
	}
	ensureActiveTemplate();
};

const resetToDefault = () => {
	currentTemplate.value.template = DEFAULT_COURSE_INTRO_TEMPLATE;
};

const save = async () => {
	const normalized = normalizeCourseIntroTemplatePack(templatePack.value);
	if (normalized.templates.some((item) => !String(item.name || '').trim())) {
		message.warning('请填写模板名称');
		return;
	}
	saving.value = true;
	try {
		await setCourseIntroTemplate(normalized);
		templatePack.value = normalized;
		message.success('保存成功');
	} catch (error) {
		message.error('保存失败');
	} finally {
		saving.value = false;
	}
};

onMounted(load);
</script>

<style scoped>
.config-tip {
	margin-bottom: 16px;
}

.template-card {
	margin-bottom: 16px;
}

.template-form {
	margin-top: 16px;
}

.form-tip {
	margin-top: 6px;
	color: #8c8c8c;
	font-size: 12px;
	line-height: 1.6;
}

.footer-actions {
	margin-top: 16px;
}
</style>
