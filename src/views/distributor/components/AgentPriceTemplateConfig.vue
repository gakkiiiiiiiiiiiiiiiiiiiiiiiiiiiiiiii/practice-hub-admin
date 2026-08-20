<template>
  <div class="agent-template-config">
    <a-alert
      show-icon
      type="info"
      message="代理模板按课程原价计算，结果向上取整为整数元。保存只更新模板；点击“应用到课程”后才会批量覆盖对应等级的课程代理价。"
    />

    <a-card title="代理等级模板" :bordered="false" class="config-card">
      <a-table
        :columns="columns"
        :data-source="formState.templates"
        :pagination="false"
        row-key="level"
        size="middle"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'level'">
            <a-tag :color="levelColor(record.level)">{{
              levelLabel(record.level)
            }}</a-tag>
          </template>
          <template v-else-if="column.key === 'enabled'">
            <a-switch
              v-model:checked="record.enabled"
              checked-children="启用"
              un-checked-children="停用"
            />
          </template>
          <template v-else-if="column.key === 'discount'">
            <a-input-number
              v-model:value="record.discount"
              :min="0.1"
              :max="10"
              :precision="1"
              :step="0.1"
              addon-after="折"
              style="width: 150px"
            />
          </template>
          <template v-else-if="column.key === 'example'">
            <span class="price-example"
              >5 元课程 → {{ calculateExample(record.discount) }} 元</span
            >
          </template>
        </template>
      </a-table>
    </a-card>

    <a-card title="代理价排除范围" :bordered="false" class="config-card">
      <a-form :label-col="{ span: 4 }" :wrapper-col="{ span: 18 }">
        <a-form-item label="排除课程分类">
          <a-select
            v-model:value="formState.category_ids"
            mode="multiple"
            allow-clear
            show-search
            :filter-option="selectFilter"
            :options="categoryOptions"
            placeholder="选择后，该分类课程只能按原价购买"
          />
          <div class="field-help">
            选择一级分类会排除其下全部课程；选择二级分类只排除该子分类。
          </div>
        </a-form-item>
        <a-form-item label="排除套餐">
          <a-select
            v-model:value="formState.package_section_ids"
            mode="multiple"
            allow-clear
            show-search
            :filter-option="selectFilter"
            :options="packageOptions"
            placeholder="选择不允许代理购买的套餐（包含 VIP）"
          />
          <div class="field-help">排除套餐不会连带排除套餐内的单门课程。</div>
        </a-form-item>
        <a-form-item label="排除类目套餐">
          <a-select
            v-model:value="formState.category_bundle_ids"
            mode="multiple"
            allow-clear
            show-search
            :filter-option="selectFilter"
            :options="categoryBundleOptions"
            placeholder="选择不允许使用代理价的类目套餐"
          />
          <div class="field-help">
            排除类目套餐不会连带排除该类目下的单门课程。
          </div>
        </a-form-item>
      </a-form>
    </a-card>

    <div class="action-bar">
      <div class="scope-summary">
        当前排除 {{ Number(serverSummary.excluded_course_count || 0) }} 门课程、
        {{ formState.package_section_ids.length }} 个套餐、
        {{ formState.category_bundle_ids.length }} 个类目套餐
      </div>
      <a-space>
        <a-button :disabled="loading || saving" @click="loadConfig"
          >重置</a-button
        >
        <a-button type="primary" :loading="saving" @click="saveConfig"
          >保存模板</a-button
        >
        <a-button
          type="primary"
          danger
          ghost
          :loading="applying"
          @click="confirmApply"
          >应用到课程</a-button
        >
      </a-space>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { Modal, message } from "ant-design-vue";
import {
  applyAgentPriceTemplates,
  getAgentPriceTemplates,
  updateAgentPriceTemplates,
} from "@/api/distributor";
import { getCourseCategoryTree } from "@/api/course-category";
import { getPackageSectionList } from "@/api/package";

type AgentTemplate = {
  level: number;
  discount: number;
  enabled: boolean;
};

const defaultTemplates = (): AgentTemplate[] => [
  { level: 1, discount: 4, enabled: true },
  { level: 2, discount: 3, enabled: true },
  { level: 3, discount: 2, enabled: true },
];

const columns = [
  { title: "代理等级", key: "level", width: 160 },
  { title: "状态", key: "enabled", width: 140 },
  { title: "代理折扣", key: "discount", width: 220 },
  { title: "价格示例", key: "example" },
];
const loading = ref(false);
const saving = ref(false);
const applying = ref(false);
const categoryTree = ref<any[]>([]);
const packageSections = ref<any[]>([]);
const serverSummary = ref({ excluded_course_count: 0 });
const formState = ref({
  templates: defaultTemplates(),
  category_ids: [] as number[],
  package_section_ids: [] as number[],
  category_bundle_ids: [] as number[],
});

const responseData = (response: any) => response?.data ?? response ?? {};
const levelLabel = (level: number) =>
  ["一级代理", "二级代理", "三级代理"][Number(level) - 1] || `${level}级代理`;
const levelColor = (level: number) =>
  ["blue", "purple", "gold"][Number(level) - 1] || "default";
const calculateExample = (discount: number) =>
  Math.ceil((5 * Number(discount || 0)) / 10);
const selectFilter = (input: string, option: any) =>
  String(option?.label || "")
    .toLowerCase()
    .includes(String(input || "").toLowerCase());

const categoryOptions = computed(() =>
  categoryTree.value.flatMap((parent: any) => [
    { label: parent.name, value: Number(parent.id) },
    ...(parent.children || []).map((child: any) => ({
      label: `${parent.name} / ${child.name}`,
      value: Number(child.id),
    })),
  ]),
);
const packageOptions = computed(() =>
  packageSections.value.map((section: any) => ({
    label: `${section.name}${section.isVip || section.is_vip ? "（VIP）" : ""}`,
    value: Number(section.id),
  })),
);
const categoryBundleOptions = computed(() =>
  categoryTree.value.flatMap((parent: any) => [
    ...(Number(parent.bundle_enabled ?? 1) === 1
      ? [{ label: `整个${parent.name}`, value: Number(parent.id) }]
      : []),
    ...(parent.children || [])
      .filter((child: any) => Number(child.bundle_enabled ?? 1) === 1)
      .map((child: any) => ({
        label: `${parent.name} / ${child.name}`,
        value: Number(child.id),
      })),
  ]),
);

const loadConfig = async () => {
  loading.value = true;
  try {
    const [configResponse, categoryResponse, packageResponse] =
      await Promise.all([
        getAgentPriceTemplates(),
        getCourseCategoryTree(),
        getPackageSectionList(),
      ]);
    const config = responseData(configResponse);
    const categories = responseData(categoryResponse);
    const packages = responseData(packageResponse);
    formState.value = {
      templates: Array.isArray(config.templates)
        ? config.templates.map((item: any) => ({
            level: Number(item.level),
            discount: Number(item.discount),
            enabled: item.enabled !== false,
          }))
        : defaultTemplates(),
      category_ids: (config.category_ids || []).map(Number),
      package_section_ids: (config.package_section_ids || []).map(Number),
      category_bundle_ids: (config.category_bundle_ids || []).map(Number),
    };
    serverSummary.value = {
      excluded_course_count: Number(config.excluded_course_count || 0),
    };
    categoryTree.value = Array.isArray(categories)
      ? categories
      : categories.list || [];
    packageSections.value = Array.isArray(packages)
      ? packages
      : packages.list || [];
  } catch (error: any) {
    message.error(error?.msg || error?.message || "加载代理模板失败");
  } finally {
    loading.value = false;
  }
};

const validate = () => {
  if (!formState.value.templates.some((item) => item.enabled)) {
    message.warning("请至少启用一个代理模板");
    return false;
  }
  if (
    formState.value.templates.some(
      (item) =>
        !Number.isFinite(item.discount) ||
        item.discount < 0.1 ||
        item.discount > 10,
    )
  ) {
    message.warning("代理折扣必须在 0.1 至 10 折之间");
    return false;
  }
  return true;
};

const saveConfig = async () => {
  if (!validate() || saving.value) return;
  saving.value = true;
  try {
    const response = await updateAgentPriceTemplates(formState.value);
    const config = responseData(response);
    serverSummary.value = {
      excluded_course_count: Number(config.excluded_course_count || 0),
    };
    message.success("代理模板已保存");
  } catch (error: any) {
    message.error(error?.msg || error?.message || "保存代理模板失败");
  } finally {
    saving.value = false;
  }
};

const confirmApply = () => {
  if (!validate() || applying.value) return;
  Modal.confirm({
    title: "将模板应用到全部课程？",
    content:
      "系统将使用已保存的模板覆盖所有未排除课程的对应等级代理价。请先保存本页最新配置；此操作不会修改课程原价。",
    okText: "确认应用",
    cancelText: "取消",
    okType: "danger",
    onOk: applyTemplates,
  });
};

const applyTemplates = async () => {
  applying.value = true;
  try {
    const response = await applyAgentPriceTemplates();
    const result = responseData(response);
    message.success(
      `已更新 ${Number(result.updated_course_count || 0)} 门课程，跳过 ${Number(result.excluded_course_count || 0)} 门`,
    );
  } catch (error: any) {
    message.error(error?.msg || error?.message || "应用代理模板失败");
    throw error;
  } finally {
    applying.value = false;
  }
};

onMounted(loadConfig);
</script>

<style scoped lang="scss">
.agent-template-config {
  padding: 24px;
}

.config-card {
  margin-top: 16px;
  background: #fafafa;
}

.price-example {
  color: #1677ff;
  font-weight: 500;
}

.field-help {
  margin-top: 6px;
  color: #8c8c8c;
  font-size: 12px;
}

.action-bar {
  position: sticky;
  bottom: 0;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 16px;
  padding: 16px 20px;
  background: #fff;
  border: 1px solid #f0f0f0;
  box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.04);
}

.scope-summary {
  color: #595959;
}

@media (max-width: 900px) {
  .action-bar {
    align-items: flex-start;
    flex-direction: column;
    gap: 12px;
  }
}
</style>
