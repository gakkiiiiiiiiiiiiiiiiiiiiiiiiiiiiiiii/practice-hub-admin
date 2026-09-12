<template>
  <div class="cloud-print-config">
    <a-alert
      type="warning"
      show-icon
      message="云打印订单提交后可能立即扣除刺猬云印余额"
      description="自动模式只处理开启后新支付的纸质资料订单。上线时请先保持自动模式关闭，手动验证一个小批量订单后再开启。"
      class="notice"
    />

    <a-spin :spinning="loading">
      <a-descriptions bordered :column="3" class="status-card">
        <a-descriptions-item label="接口密钥">
          <a-tag :color="form.configured ? 'green' : 'red'">{{ form.configured ? '已配置' : '未配置' }}</a-tag>
        </a-descriptions-item>
        <a-descriptions-item label="订单回调">
          <a-tag :color="form.callbackConfigured ? 'green' : 'orange'">{{ form.callbackConfigured ? '已配置安全令牌' : '未配置' }}</a-tag>
        </a-descriptions-item>
        <a-descriptions-item label="任务执行器">
          <a-tag :color="form.workerEnabled ? 'green' : 'orange'">{{ form.workerEnabled ? '已启用' : '安全关闭' }}</a-tag>
        </a-descriptions-item>
      </a-descriptions>

      <a-form layout="vertical" :model="form" class="form-grid">
        <a-form-item label="自动云打印" class="full-row">
          <a-switch v-model:checked="form.autoEnabled" checked-children="自动" un-checked-children="手动" />
          <span class="hint">关闭时仍可在订单管理中逐单手动提交</span>
        </a-form-item>
        <a-form-item label="纸张尺寸">
          <a-select v-model:value="form.paperSize">
            <a-select-option :value="9">A4</a-select-option>
            <a-select-option :value="8">A3</a-select-option>
            <a-select-option :value="13">B5</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="单双面">
          <a-select v-model:value="form.duplex">
            <a-select-option :value="1">单面</a-select-option>
            <a-select-option :value="2">双面</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="打印颜色">
          <a-select v-model:value="form.color">
            <a-select-option :value="1">黑白</a-select-option>
            <a-select-option :value="2">经济彩印</a-select-option>
            <a-select-option :value="3">标准彩印</a-select-option>
            <a-select-option :value="4">经济黑白</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="纸张材质">
          <a-select v-model:value="form.paperMedia">
            <a-select-option :value="1">普通纸</a-select-option>
            <a-select-option :value="2">高端纸</a-select-option>
            <a-select-option :value="4">85g 高端纸</a-select-option>
            <a-select-option :value="6">80g 护眼纸</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="多页合一">
          <a-select v-model:value="form.pagesInOne">
            <a-select-option v-for="value in [1, 2, 3, 4, 6, 9]" :key="value" :value="value">{{ value }} 页合一</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="装订方式">
          <a-select v-model:value="form.bindType">
            <a-select-option :value="0">不装订 · 无装订费</a-select-option>
            <a-select-option :value="1">胶装 · 8–600 页 · ¥3/本起</a-select-option>
            <a-select-option :value="2">骑马钉 · 8–60 页 · ¥1/本</a-select-option>
            <a-select-option :value="3">订书钉 · 2–160 页 · ¥0.20/本</a-select-option>
            <a-select-option :value="4">圈装 · 8–200 页 · ¥5/本</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="超页自动胶装">
          <a-switch v-model:checked="form.autoBindByPageCount" checked-children="开启" un-checked-children="关闭" />
          <div class="hint-inline">所选装订超过最大页数时，自动改为下方胶装配置；默认皮纹纸、白色封面，最多支持 600 页。</div>
        </a-form-item>
        <template v-if="showGlueOptions">
          <a-form-item label="胶装/超页胶装封面材质">
            <a-select v-model:value="form.coverMedia">
              <a-select-option :value="1">皮纹纸 · 8–600 页 · ¥3/本</a-select-option>
              <a-select-option :value="2">铜版纸 · 8–600 页 · ¥4/本</a-select-option>
            </a-select>
          </a-form-item>
          <a-form-item v-if="form.coverMedia === 1" label="皮纹纸封面颜色">
            <a-select v-model:value="form.coverColor">
              <a-select-option :value="1">绿色</a-select-option>
              <a-select-option :value="2">黄色</a-select-option>
              <a-select-option :value="3">蓝色</a-select-option>
              <a-select-option :value="4">粉色</a-select-option>
              <a-select-option :value="5">白色（默认）</a-select-option>
              <a-select-option :value="6">青蓝色</a-select-option>
            </a-select>
          </a-form-item>
          <a-form-item label="胶装封面内容">
            <a-select v-model:value="form.coverContentType">
              <a-select-option :value="1">纯色封面 · 不加价</a-select-option>
              <a-select-option :value="2">文字封面 · +¥1/本</a-select-option>
              <a-select-option :value="3">空白封面 · 不加价</a-select-option>
              <a-select-option :value="4">文件首页为封面 · +¥1/本</a-select-option>
              <a-select-option :value="5">上传封面图片 · +¥1/本</a-select-option>
              <a-select-option :value="6">上传封面、封底图片 · +¥1/本</a-select-option>
              <a-select-option :value="7">上传封面封底合并图 · +¥1/本</a-select-option>
              <a-select-option :value="8">文件首尾为封面封底 · +¥1/本</a-select-option>
              <a-select-option :value="9">文件首页为封面封底 · +¥1/本</a-select-option>
            </a-select>
          </a-form-item>
          <a-form-item v-if="form.coverContentType === 2" label="封面文字">
            <a-input v-model:value="form.coverContentValue" :maxlength="2000" placeholder="请输入封面文字" />
          </a-form-item>
          <a-form-item v-if="[5, 6, 7].includes(form.coverContentType)" label="封面图片 URL">
            <a-input v-model:value="form.coverContentValue" :maxlength="2000" placeholder="请输入可公开访问的 HTTPS 图片 URL" />
          </a-form-item>
          <a-form-item v-if="form.coverContentType === 6" label="封底图片 URL">
            <a-input v-model:value="form.coverContentValue2" :maxlength="2000" placeholder="请输入可公开访问的 HTTPS 图片 URL" />
          </a-form-item>
        </template>
        <a-form-item label="打印顺序">
          <a-select v-model:value="form.printCollate">
            <a-select-option :value="0">逐份打印</a-select-option>
            <a-select-option :value="1">逐页打印</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="纸张方向">
          <a-select v-model:value="form.orientation">
            <a-select-option :value="0">自动</a-select-option>
            <a-select-option :value="1">竖版</a-select-option>
            <a-select-option :value="2">横版</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="快递供应商">
          <a-select v-model:value="form.shipSupplierId">
            <a-select-option :value="82">中通</a-select-option>
            <a-select-option :value="120">顺丰标快</a-select-option>
            <a-select-option :value="121">顺丰特快</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="单笔扣款上限（元）">
          <a-input-number v-model:value="maxSingleAmountYuan" :min="0.01" :max="100000" :precision="2" style="width: 100%" />
          <div class="hint-inline">打印结算价与运费预估合计超过此金额时转人工核对，不会自动下单。</div>
        </a-form-item>
        <cloud-print-pricing-guide class="full-row pricing-guide" :config="form" />
        <a-form-item class="full-row">
          <a-button type="primary" :loading="saving" :disabled="form.autoEnabled && (!form.configured || !form.callbackConfigured)" @click="save">
            保存云打印配置
          </a-button>
          <span v-if="form.autoEnabled && !form.configured" class="error-hint">请先在后端配置 CWY_APPID 和 CWY_APPKEY</span>
          <span v-else-if="form.autoEnabled && !form.callbackConfigured" class="error-hint">请先在后端配置 CWY_CALLBACK_TOKEN</span>
          <span v-else-if="form.autoEnabled && !form.workerEnabled" class="error-hint">自动任务会入队，但执行器仍处于安全关闭状态</span>
        </a-form-item>
      </a-form>
    </a-spin>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { Modal, message } from 'ant-design-vue'
import { getCloudPrintConfig, setCloudPrintConfig, type CloudPrintConfig } from '@/api/system'
import CloudPrintPricingGuide from '@/components/CloudPrintPricingGuide/index.vue'

const defaults: CloudPrintConfig = {
  autoEnabled: false, paperSize: 9, duplex: 2, color: 1, paperMedia: 1,
  pagesInOne: 1, bindType: 3, autoBindByPageCount: true,
  coverMedia: 1, coverColor: 5, coverContentType: 1,
  coverContentValue: '', coverContentValue2: '',
  printCollate: 0, orientation: 0, shipSupplierId: 82,
  maxSingleAmountCents: 5000,
}
const form = reactive<CloudPrintConfig>({ ...defaults })
const loading = ref(false)
const saving = ref(false)
const showGlueOptions = computed(() => form.bindType === 1)
const maxSingleAmountYuan = computed({
  get: () => form.maxSingleAmountCents / 100,
  set: (value: number) => { form.maxSingleAmountCents = Math.round(Number(value || 0) * 100) },
})

async function load() {
  loading.value = true
  try {
    const response: any = await getCloudPrintConfig()
    Object.assign(form, defaults, response?.data || response)
  } catch {
    message.error('获取云打印配置失败')
  } finally {
    loading.value = false
  }
}

function persist() {
  saving.value = true
  return setCloudPrintConfig({
    autoEnabled: form.autoEnabled, paperSize: form.paperSize, duplex: form.duplex,
    color: form.color, paperMedia: form.paperMedia, pagesInOne: form.pagesInOne,
    bindType: form.bindType, autoBindByPageCount: form.autoBindByPageCount,
    coverMedia: form.coverMedia, coverColor: form.coverColor,
    coverContentType: form.coverContentType,
    coverContentValue: form.coverContentValue,
    coverContentValue2: form.coverContentValue2,
    printCollate: form.printCollate,
    orientation: form.orientation, shipSupplierId: form.shipSupplierId,
    maxSingleAmountCents: form.maxSingleAmountCents,
  }).then((response: any) => {
    Object.assign(form, response?.data || response)
    message.success('云打印配置已保存')
  }).finally(() => { saving.value = false })
}

function validateCoverConfig() {
  if (!showGlueOptions.value) return true
  const type = form.coverContentType
  const value = form.coverContentValue.trim()
  const value2 = form.coverContentValue2.trim()
  if (type === 2 && !value) {
    message.error('请填写封面文字')
    return false
  }
  const isHttpsUrl = (input: string) => {
    try { return new URL(input).protocol === 'https:' } catch { return false }
  }
  if ([5, 7].includes(type) && !isHttpsUrl(value)) {
    message.error('请填写可公开访问的 HTTPS 封面图片 URL')
    return false
  }
  if (type === 6 && (!isHttpsUrl(value) || !isHttpsUrl(value2))) {
    message.error('请填写可公开访问的 HTTPS 封面和封底图片 URL')
    return false
  }
  return true
}

function save() {
  if (!validateCoverConfig()) return
  if (!form.autoEnabled) return persist()
  Modal.confirm({
    title: '确认开启自动云打印？',
    content: '新支付的纸质资料订单将在 10 分钟缓冲期后进入云打印，提交后可能直接扣除刺猬云印余额。',
    okText: '确认开启', cancelText: '取消', onOk: persist,
  })
}

onMounted(load)
</script>

<style scoped>
.cloud-print-config { max-width: 920px; }
.notice, .status-card { margin-bottom: 24px; }
.form-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0 20px; }
.full-row { grid-column: 1 / -1; }
.hint, .error-hint { margin-left: 12px; color: rgba(0, 0, 0, 0.55); }
.hint-inline { margin-top: 6px; color: rgba(0, 0, 0, 0.55); font-size: 12px; }
.pricing-guide { margin-bottom: 24px; }
.error-hint { color: #ff4d4f; }
@media (max-width: 720px) { .form-grid { grid-template-columns: 1fr; } .full-row { grid-column: auto; } }
</style>
