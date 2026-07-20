<template>
  <div class="storage-provider-config">
    <a-alert
      message="切换只影响新上传的文件"
      description="已有课程文件和图片会继续使用原地址，不会因为切换而批量迁移或失效。"
      type="info"
      show-icon
      class="notice"
    />

    <a-spin :spinning="loading">
      <section class="config-section">
        <div class="section-heading">
          <div>
            <h3>默认对象存储</h3>
            <p>课程文件、图片和新生成的预览缓存将上传到选中的服务。</p>
          </div>
          <a-tag :color="currentProvider === 'cos' ? 'blue' : 'orange'">
            当前：{{ providerLabels[currentProvider] }}
          </a-tag>
        </div>

        <a-radio-group v-model:value="selectedProvider" class="provider-grid">
          <div
            v-for="item in providerOptions"
            :key="item.value"
            class="provider-card"
            :class="{
              selected: selectedProvider === item.value,
              disabled: !providerStatus[item.value]?.configured,
            }"
            role="radio"
            :aria-checked="selectedProvider === item.value"
            :aria-disabled="!providerStatus[item.value]?.configured"
            :tabindex="providerStatus[item.value]?.configured ? 0 : -1"
            @click="selectProvider(item.value)"
            @keydown.enter.prevent="selectProvider(item.value)"
            @keydown.space.prevent="selectProvider(item.value)"
          >
            <a-radio :value="item.value" :disabled="!providerStatus[item.value]?.configured" />
            <div class="provider-content">
              <div class="provider-title-row">
                <strong>{{ item.title }}</strong>
                <a-tag v-if="item.value === 'cos'" color="blue">默认</a-tag>
                <a-tag v-if="!providerStatus[item.value]?.configured">未配置</a-tag>
              </div>
              <p>{{ item.description }}</p>
            </div>
          </div>
        </a-radio-group>

        <div class="actions">
          <a-button
            type="primary"
            :loading="saving"
            :disabled="selectedProvider === currentProvider"
            @click="confirmSwitch"
          >
            保存并切换
          </a-button>
          <span class="action-hint">切换后下一次上传立即生效</span>
        </div>
      </section>
    </a-spin>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { Modal, message } from 'ant-design-vue'
import {
  getStorageProviderConfig,
  setStorageProvider,
  type StorageProvider,
} from '@/api/system'

const loading = ref(false)
const saving = ref(false)
const currentProvider = ref<StorageProvider>('cos')
const selectedProvider = ref<StorageProvider>('cos')
const providerStatus = ref<Record<StorageProvider, { configured: boolean; label: string }>>({
  cos: { configured: true, label: '腾讯云' },
  oss: { configured: false, label: '阿里云' },
})

const providerLabels: Record<StorageProvider, string> = {
  cos: '腾讯云 COS',
  oss: '阿里云 OSS',
}

const providerOptions = computed(() => [
  {
    value: 'cos' as const,
    title: '腾讯云 COS',
    description: '使用微信云托管对象存储，适合小程序端直接访问。',
  },
  {
    value: 'oss' as const,
    title: '阿里云 OSS',
    description: '使用阿里云对象存储，可结合传输加速或 CDN。',
  },
])

async function loadConfig() {
  loading.value = true
  try {
    const response: any = await getStorageProviderConfig()
    const config = response?.data || response
    currentProvider.value = config?.provider === 'oss' ? 'oss' : 'cos'
    selectedProvider.value = currentProvider.value
    if (config?.providers) providerStatus.value = config.providers
  } catch (error) {
    message.error('获取对象存储配置失败')
  } finally {
    loading.value = false
  }
}

function selectProvider(provider: StorageProvider) {
  if (providerStatus.value[provider]?.configured) selectedProvider.value = provider
}

function confirmSwitch() {
  const next = selectedProvider.value
  Modal.confirm({
    title: `切换到${providerLabels[next]}？`,
    content: '切换只影响新上传文件，已有文件地址和访问方式保持不变。',
    okText: '确认切换',
    cancelText: '取消',
    async onOk() {
      saving.value = true
      try {
        const response: any = await setStorageProvider(next)
        const config = response?.data || response
        currentProvider.value = config?.provider === 'oss' ? 'oss' : 'cos'
        selectedProvider.value = currentProvider.value
        if (config?.providers) providerStatus.value = config.providers
        message.success(`已切换到${providerLabels[currentProvider.value]}`)
      } catch (error) {
        selectedProvider.value = currentProvider.value
        throw error
      } finally {
        saving.value = false
      }
    },
  })
}

onMounted(loadConfig)
</script>

<style scoped>
.storage-provider-config {
  max-width: 900px;
}

.notice {
  margin-bottom: 24px;
}

.config-section {
  padding: 4px 0;
}

.section-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 20px;
}

.section-heading h3 {
  margin: 0 0 6px;
  font-size: 18px;
}

.section-heading p,
.provider-content p {
  margin: 0;
  color: rgba(0, 0, 0, 0.55);
}

.provider-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  width: 100%;
}

.provider-card {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  box-sizing: border-box;
  min-height: 126px;
  padding: 20px;
  border: 1px solid #d9d9d9;
  border-radius: 10px;
  cursor: pointer;
  transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
}

.provider-card:hover:not(.disabled) {
  border-color: #69b1ff;
}

.provider-card.selected {
  border-color: #1677ff;
  background: #f0f7ff;
  box-shadow: 0 0 0 2px rgba(22, 119, 255, 0.08);
}

.provider-card.disabled {
  cursor: not-allowed;
  background: #fafafa;
  opacity: 0.65;
}

.provider-content {
  flex: 1;
  min-width: 0;
}

.provider-title-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  font-size: 16px;
}

.actions {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 24px;
}

.action-hint {
  color: rgba(0, 0, 0, 0.45);
}

@media (max-width: 768px) {
  .provider-grid {
    grid-template-columns: 1fr;
  }

  .section-heading {
    flex-direction: column;
  }
}
</style>
