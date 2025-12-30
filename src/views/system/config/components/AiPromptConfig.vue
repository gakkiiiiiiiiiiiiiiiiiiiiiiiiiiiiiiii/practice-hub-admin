<template>
  <div class="ai-prompt-config">
    <a-form
      :model="formState"
      :label-col="{ span: 4 }"
      :wrapper-col="{ span: 20 }"
    >
      <a-form-item label="System Prompt">
        <a-textarea
          v-model:value="formState.aiPrompt"
          :rows="10"
          placeholder="配置 Gemini API 的 System Prompt，如：你是一个严厉的考研老师..."
        />
      </a-form-item>
      <a-form-item>
        <a-button type="primary" :loading="loading" @click="handleSubmit">
          保存
        </a-button>
      </a-form-item>
    </a-form>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import { getSystemConfig, updateSystemConfig } from '@/api/system'

const loading = ref(false)
const formState = ref({
  aiPrompt: '',
})

const fetchConfig = async () => {
  try {
    const res = await getSystemConfig()
    formState.value.aiPrompt = res.data.aiPrompt || ''
  } catch (error) {
    console.error('获取配置失败:', error)
  }
}

const handleSubmit = async () => {
  loading.value = true
  try {
    await updateSystemConfig({ aiPrompt: formState.value.aiPrompt })
    message.success('保存成功')
  } catch (error) {
    message.error('保存失败')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchConfig()
})
</script>

