<template>
	<div class="course-intro-template-config">
		<a-alert
			type="info"
			show-icon
			message="这里配置课程介绍默认模板。新增课程或编辑课程时，如果课程介绍留空，后端会自动使用该模板。"
			class="config-tip"
		/>

		<a-form layout="vertical">
			<a-form-item label="默认课程介绍模板">
				<WangEditor v-model="template" placeholder="请输入默认课程介绍模板（支持富文本）" />
			</a-form-item>
		</a-form>

		<div class="footer-actions">
			<a-space>
				<a-button @click="resetToDefault">恢复推荐模板</a-button>
				<a-button type="primary" :loading="saving" @click="save">保存配置</a-button>
			</a-space>
		</div>
	</div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { message } from 'ant-design-vue';
import WangEditor from '@/components/WangEditor/index.vue';
import { getCourseIntroTemplate, setCourseIntroTemplate } from '@/api/system';

const defaultTemplate = [
	'<h3>课程介绍</h3>',
	'<p>本课程包含系统整理的复习资料与配套练习内容，适合用于日常复习、考前冲刺和查漏补缺。</p>',
	'<p>购买或激活后，可在小程序内查看课程内容，并根据课程类型进行在线练习或文件学习。</p>',
].join('');

const template = ref('');
const saving = ref(false);

const load = async () => {
	try {
		const res = await getCourseIntroTemplate();
		template.value = res.data?.template || defaultTemplate;
	} catch (error) {
		message.error('获取课程介绍模板失败');
		template.value = defaultTemplate;
	}
};

const resetToDefault = () => {
	template.value = defaultTemplate;
};

const save = async () => {
	saving.value = true;
	try {
		await setCourseIntroTemplate({ template: template.value || '' });
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

.footer-actions {
	margin-top: 16px;
}
</style>
