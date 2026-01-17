<template>
  <div class="daily-quotes-config">
    <a-alert
      message="配置说明"
      description="配置小程序首页显示的广播消息。广播消息会以轮播形式自动切换显示，每4秒切换一条。可以添加多条广播消息，系统会自动轮播展示。"
      type="info"
      show-icon
      style="margin-bottom: 24px"
    />
    
    <a-form
      :model="formState"
      :label-col="{ span: 4 }"
      :wrapper-col="{ span: 20 }"
    >
      <a-form-item label="广播消息列表" required>
        <div class="quotes-list">
          <div
            v-for="(quote, index) in formState.quotes"
            :key="index"
            class="quote-item"
          >
            <a-input
              v-model:value="formState.quotes[index]"
              :placeholder="`请输入第 ${index + 1} 条广播消息`"
              style="margin-bottom: 8px"
            />
            <a-button
              type="link"
              danger
              size="small"
              @click="removeQuote(index)"
              :disabled="formState.quotes.length <= 1"
            >
              删除
            </a-button>
          </div>
          <a-button
            type="dashed"
            block
            @click="addQuote"
            style="margin-top: 8px"
          >
            + 添加广播消息
          </a-button>
        </div>
      </a-form-item>
      
      <a-form-item>
        <a-space>
          <a-button type="primary" :loading="loading" @click="handleSubmit">
            保存
          </a-button>
          <a-button @click="handleReset">重置</a-button>
        </a-space>
      </a-form-item>
    </a-form>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import { getDailyQuotes, setDailyQuotes } from '@/api/system'

const loading = ref(false)
const formState = ref({
  quotes: [''] as string[],
})

const defaultQuotes = [
  '宝剑锋从磨砺出，梅花香自苦寒来。',
  '不经一番寒彻骨，怎得梅花扑鼻香。',
  '路漫漫其修远兮，吾将上下而求索。',
  '天行健，君子以自强不息。',
  '业精于勤，荒于嬉；行成于思，毁于随。',
  '书山有路勤为径，学海无涯苦作舟。',
  '只要功夫深，铁杵磨成针。',
  '不积跬步，无以至千里；不积小流，无以成江海。',
]

const fetchConfig = async () => {
  try {
    const res = await getDailyQuotes()
    if (res.data && Array.isArray(res.data) && res.data.length > 0) {
      formState.value.quotes = res.data
    } else {
      formState.value.quotes = [...defaultQuotes]
    }
  } catch (error) {
    console.error('获取配置失败:', error)
    formState.value.quotes = [...defaultQuotes]
  }
}

const addQuote = () => {
  formState.value.quotes.push('')
}

const removeQuote = (index: number) => {
  if (formState.value.quotes.length > 1) {
    formState.value.quotes.splice(index, 1)
  }
}

const handleSubmit = async () => {
  // 过滤空字符串
  const validQuotes = formState.value.quotes.filter(quote => quote.trim().length > 0)
  
  if (validQuotes.length === 0) {
    message.warning('至少需要一条广播消息')
    return
  }

  loading.value = true
  try {
    await setDailyQuotes({ quotes: validQuotes })
    message.success('保存成功')
    // 更新表单数据，移除空项
    formState.value.quotes = validQuotes
  } catch (error: any) {
    message.error(error?.response?.data?.msg || '保存失败')
  } finally {
    loading.value = false
  }
}

const handleReset = () => {
  formState.value.quotes = [...defaultQuotes]
  message.info('已重置为默认广播消息')
}

onMounted(() => {
  fetchConfig()
})
</script>

<style scoped lang="scss">
.daily-quotes-config {
  .quotes-list {
    .quote-item {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      margin-bottom: 8px;
      
      :deep(.ant-input) {
        flex: 1;
      }
    }
  }
}
</style>
