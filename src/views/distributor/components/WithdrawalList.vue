<template>
  <div class="withdrawal-list">
    <a-space class="toolbar">
      <a-select v-model:value="status" allow-clear placeholder="处理状态" style="width: 160px" @change="loadData">
        <a-select-option :value="0">待人工打款</a-select-option>
        <a-select-option :value="1">已打款</a-select-option>
        <a-select-option :value="2">已驳回</a-select-option>
      </a-select>
      <a-button @click="loadData">刷新</a-button>
    </a-space>
    <a-table :data-source="rows" :columns="columns" :loading="loading" row-key="id" :scroll="{ x: 1200 }">
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'status'">
          <a-tag :color="['orange', 'green', 'red'][record.status]">{{ ['待打款', '已打款', '已驳回'][record.status] }}</a-tag>
        </template>
        <template v-else-if="column.key === 'action' && record.status === 0">
          <a-space>
            <a-button type="primary" size="small" @click="markPaid(record)">确认已打款</a-button>
            <a-button danger size="small" @click="reject(record)">驳回</a-button>
          </a-space>
        </template>
      </template>
    </a-table>
  </div>
</template>

<script setup lang="ts">
import { h, onMounted, ref } from 'vue';
import { message, Modal } from 'ant-design-vue';
import { getDistributorWithdrawals, updateDistributorWithdrawal } from '@/api/distributor';

const loading = ref(false);
const status = ref<number | undefined>(0);
const rows = ref<any[]>([]);
const money = ({ text }: any) => `¥${Number(text || 0).toFixed(2)}`;
const columns = [
  { title: '申请时间', dataIndex: 'create_time', width: 180 },
  { title: '用户', dataIndex: 'user_nickname', width: 130 },
  { title: '用户ID', dataIndex: 'user_id', width: 90 },
  { title: '申请金额', dataIndex: 'amount', customRender: money, width: 110 },
  { title: '手续费', dataIndex: 'fee_amount', customRender: money, width: 100 },
  { title: '实际打款', dataIndex: 'payout_amount', customRender: money, width: 110 },
  { title: '支付宝账号', dataIndex: 'alipay_account', width: 180 },
  { title: '真实姓名', dataIndex: 'real_name', width: 110 },
  { title: '状态', key: 'status', width: 100 },
  { title: '备注', dataIndex: 'remark', width: 180 },
  { title: '操作', key: 'action', fixed: 'right', width: 180 },
];

const loadData = async () => {
  loading.value = true;
  try { rows.value = (await getDistributorWithdrawals(status.value)) || []; }
  catch (error: any) { message.error(error?.msg || error?.message || '加载提现申请失败'); }
  finally { loading.value = false; }
};

const markPaid = (record: any) => Modal.confirm({
  title: '确认已完成支付宝打款？',
  content: `应打款 ¥${Number(record.payout_amount).toFixed(2)} 至 ${record.alipay_account}（${record.real_name}）`,
  onOk: async () => { await updateDistributorWithdrawal(record.id, { status: 1 }); message.success('已标记打款完成'); loadData(); },
});

const reject = (record: any) => {
  let remark = '';
  Modal.confirm({
    title: '驳回提现申请',
    content: () => h('textarea', {
      placeholder: '请输入驳回原因',
      style: 'width:100%;min-height:88px;padding:8px;margin-top:12px;',
      onInput: (event: any) => remark = event.target.value,
    }),
    onOk: async () => { await updateDistributorWithdrawal(record.id, { status: 2, remark }); message.success('已驳回并退回余额'); loadData(); },
  });
};

onMounted(loadData);
</script>

<style scoped>.withdrawal-list { padding: 24px; }.toolbar { margin-bottom: 16px; }</style>
