<template>
  <div class="paper-promotion-config">
    <a-alert
      type="info"
      show-icon
      message="按同一纸质资料订单中的不同资料种类数减免"
      description="购买份数不重复计数，偏远地区附加运费不参与减免。默认 2 种减 1 元、3 种减 2 元，依次递增。"
      class="notice"
    />

    <a-spin :spinning="loading">
      <a-form layout="vertical" class="config-form">
        <a-form-item label="启用合单促销">
          <a-switch v-model:checked="form.enabled" />
        </a-form-item>
        <a-form-item
          label="起减种类数"
          extra="达到该种类数时减免一次，范围 2–20 种"
        >
          <a-input-number
            v-model:value="form.minimum_items"
            :min="2"
            :max="20"
            :precision="0"
            style="width: 100%"
          />
        </a-form-item>
        <a-form-item
          label="每增加一种减免（元）"
          extra="使用整数金额，范围 1–100 元"
        >
          <a-input-number
            v-model:value="form.discount_per_additional_item"
            :min="1"
            :max="100"
            :precision="0"
            style="width: 100%"
          />
        </a-form-item>

        <div class="preview-card">
          <strong>优惠示例</strong>
          <span>{{ previewText }}</span>
        </div>

        <a-form-item class="actions">
          <a-button type="primary" :loading="saving" @click="save"
            >保存配置</a-button
          >
        </a-form-item>
      </a-form>
    </a-spin>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { message } from "ant-design-vue";
import {
  getPaperPromotionConfig,
  setPaperPromotionConfig,
  type PaperPromotionConfig,
} from "@/api/system";

const loading = ref(false);
const saving = ref(false);
const form = reactive<PaperPromotionConfig>({
  enabled: true,
  minimum_items: 2,
  discount_per_additional_item: 1,
});

const previewText = computed(() => {
  if (!form.enabled) return "活动已关闭，新订单不再享受合单减免。";
  const examples = Array.from({ length: 3 }, (_, index) => {
    const count = form.minimum_items + index;
    const discount = (index + 1) * form.discount_per_additional_item;
    return `${count} 种减 ¥${discount}`;
  });
  return examples.join("，");
});

async function load() {
  loading.value = true;
  try {
    const response: any = await getPaperPromotionConfig();
    Object.assign(form, response?.data || response || {});
  } catch {
    message.error("获取纸质资料促销配置失败");
  } finally {
    loading.value = false;
  }
}

async function save() {
  saving.value = true;
  try {
    const response: any = await setPaperPromotionConfig({ ...form });
    Object.assign(form, response?.data || response || {});
    message.success("纸质资料促销配置已保存");
  } catch {
    message.error("保存促销配置失败");
  } finally {
    saving.value = false;
  }
}

onMounted(load);
</script>

<style scoped>
.paper-promotion-config {
  max-width: 720px;
}

.notice {
  margin-bottom: 24px;
}

.config-form {
  max-width: 520px;
}

.preview-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 24px;
  padding: 16px;
  border: 1px solid #d9d9d9;
  border-radius: 8px;
  background: #fafafa;
  color: rgba(0, 0, 0, 0.65);
}

.actions {
  margin-bottom: 0;
}
</style>
