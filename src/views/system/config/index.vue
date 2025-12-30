<template>
  <div class="system-config">
    <a-card>
      <template #title>运营配置</template>

      <a-tabs v-model:activeKey="activeTab">
        <a-tab-pane key="banner" tab="首页轮播图">
          <banner-config />
        </a-tab-pane>
        <a-tab-pane key="countdown" tab="倒计时配置">
          <countdown-config />
        </a-tab-pane>
        <a-tab-pane key="ai" tab="AI提示词配置">
          <ai-prompt-config />
        </a-tab-pane>
      </a-tabs>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import BannerConfig from './components/BannerConfig.vue'
import CountdownConfig from './components/CountdownConfig.vue'
import AiPromptConfig from './components/AiPromptConfig.vue'

const activeTab = ref('banner')
</script>

<style scoped lang="scss">
.system-config {
  // 样式
}
</style>

