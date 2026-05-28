<template>
  <div class="system-config">
    <a-card>
      <template #title>运营配置</template>

      <a-tabs v-model:activeKey="activeTab">
        <a-tab-pane key="banner" tab="首页轮播图">
          <banner-config />
        </a-tab-pane>
        <!-- <a-tab-pane key="countdown" tab="倒计时配置">
          <countdown-config />
        </a-tab-pane> -->
        <a-tab-pane key="ai" tab="首页广播消息">
          <ai-prompt-config />
        </a-tab-pane>
        <a-tab-pane key="checkin" tab="刷题打卡配置">
          <checkin-config />
        </a-tab-pane>
        <a-tab-pane key="course-cover" tab="课程封面配置">
          <course-cover-config />
        </a-tab-pane>
        <a-tab-pane key="course-intro-template" tab="课程介绍模板">
          <course-intro-template-config />
        </a-tab-pane>
        <a-tab-pane key="faq" tab="常见问题配置">
          <faq-config />
        </a-tab-pane>
        <a-tab-pane key="referral-coupon" tab="拉新优惠券">
          <referral-coupon-config />
        </a-tab-pane>
      </a-tabs>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import BannerConfig from './components/BannerConfig.vue'
import AiPromptConfig from './components/AiPromptConfig.vue'
import CheckinConfig from './components/CheckinConfig.vue'
import CourseCoverConfig from './components/CourseCoverConfig.vue'
import CourseIntroTemplateConfig from './components/CourseIntroTemplateConfig.vue'
import FaqConfig from './components/FaqConfig.vue'
import ReferralCouponConfig from './components/ReferralCouponConfig.vue'

const route = useRoute()
const router = useRouter()
const validTabs = new Set(['banner', 'ai', 'checkin', 'course-cover', 'course-intro-template', 'faq', 'referral-coupon'])
const activeTab = ref(getInitialTab())

function getInitialTab() {
	const tab = Array.isArray(route.query.tab) ? route.query.tab[0] : route.query.tab
	return typeof tab === 'string' && validTabs.has(tab) ? tab : 'banner'
}

watch(
	() => route.query.tab,
	(tab) => {
		const nextTab = Array.isArray(tab) ? tab[0] : tab
		activeTab.value = typeof nextTab === 'string' && validTabs.has(nextTab) ? nextTab : 'banner'
	},
)

watch(activeTab, (tab) => {
	const currentTab = Array.isArray(route.query.tab) ? route.query.tab[0] : route.query.tab
	if (currentTab === tab) {
		return
	}
	router.replace({
		query: {
			...route.query,
			tab,
		},
	})
})
</script>
