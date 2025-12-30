<template>
  <div class="countdown-config">
    <a-form
      :model="formState"
      :label-col="{ span: 4 }"
      :wrapper-col="{ span: 20 }"
    >
      <a-form-item label="目标日期">
        <a-date-picker
          v-model:value="formState.targetDate"
          show-time
          format="YYYY-MM-DD HH:mm:ss"
          style="width: 100%"
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
import dayjs, { Dayjs } from 'dayjs'
import { getSystemConfig, updateSystemConfig } from '@/api/system'

const loading = ref(false)
const formState = ref<{
  targetDate: Dayjs | null
}>({
  targetDate: null,
})

const fetchConfig = async () => {
  try {
    const res = await getSystemConfig()
    if (res.data.countdownTargetDate) {
      formState.value.targetDate = dayjs(res.data.countdownTargetDate)
    }
  } catch (error) {
    console.error('获取配置失败:', error)
  }
}

const handleSubmit = async () => {
  if (!formState.value.targetDate) {
    message.error('请选择目标日期')
    return
  }

  loading.value = true
  try {
    await updateSystemConfig({
      countdownTargetDate: formState.value.targetDate.format('YYYY-MM-DD HH:mm:ss'),
    })
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

