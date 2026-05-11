<template>
	<div class="faq-config">
		<a-alert
			type="info"
			show-icon
			message="这里配置的小程序常见问题，会展示在首页“常见问题”入口中。"
			class="config-tip"
		/>

		<a-space direction="vertical" style="width: 100%" size="middle">
			<a-card v-for="(item, index) in items" :key="index" size="small">
				<template #title>问题 {{ index + 1 }}</template>
				<template #extra>
					<a-button type="link" danger @click="removeItem(index)">删除</a-button>
				</template>
				<a-form layout="vertical">
					<a-form-item label="问题">
						<a-input v-model:value="item.question" placeholder="请输入问题" />
					</a-form-item>
					<a-form-item label="答案">
						<a-textarea v-model:value="item.answer" placeholder="请输入答案" :rows="4" />
					</a-form-item>
				</a-form>
			</a-card>
		</a-space>

		<div class="footer-actions">
			<a-space>
				<a-button @click="addItem">新增问题</a-button>
				<a-button type="primary" :loading="saving" @click="save">保存配置</a-button>
			</a-space>
		</div>
	</div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { message } from 'ant-design-vue'
import { getFaqConfig, setFaqConfig } from '@/api/system'

const items = ref<Array<{ question: string; answer: string }>>([])
const saving = ref(false)

const addItem = () => {
	items.value.push({ question: '', answer: '' })
}

const removeItem = (index: number) => {
	items.value.splice(index, 1)
}

const load = async () => {
	try {
		const res = await getFaqConfig()
		items.value = Array.isArray(res.data) ? res.data : []
		if (items.value.length === 0) addItem()
	} catch (error) {
		message.error('获取常见问题配置失败')
		items.value = [{ question: '', answer: '' }]
	}
}

const save = async () => {
	const safeItems = items.value
		.map((item) => ({ question: item.question.trim(), answer: item.answer.trim() }))
		.filter((item) => item.question && item.answer)
	if (safeItems.length === 0) {
		message.warning('请至少填写一个完整的问题和答案')
		return
	}
	saving.value = true
	try {
		await setFaqConfig({ items: safeItems })
		items.value = safeItems
		message.success('保存成功')
	} catch (error) {
		message.error('保存失败')
	} finally {
		saving.value = false
	}
}

onMounted(load)
</script>

<style scoped>
.config-tip {
	margin-bottom: 16px;
}

.footer-actions {
	margin-top: 16px;
}
</style>
