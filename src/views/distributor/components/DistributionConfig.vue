<template>
	<div class="distribution-config">
		<a-form :model="formState" :label-col="{ span: 6 }" :wrapper-col="{ span: 18 }" @finish="handleSubmit">
			<a-alert class="config-tip" type="info" show-icon message="配置保存后，佣金比例会同步用于新订单结算及代理商页面展示；推广海报会同步到小程序推广素材。" />
			<a-form-item label="是否启用分销系统">
				<a-switch v-model:checked="formState.is_enabled" :checkedValue="1" :unCheckedValue="0" />
				<span style="margin-left: 12px; color: #999">
					{{ formState.is_enabled === 1 ? '已启用' : '已禁用' }}
				</span>
			</a-form-item>

			<a-form-item label="宣传海报">
				<a-upload
					v-model:file-list="posterFileList"
					list-type="picture-card"
					:max-count="1"
					:before-upload="beforePosterUpload"
					:custom-request="handlePosterUpload"
					:disabled="posterUploading"
					@remove="handlePosterRemove"
				>
					<div v-if="posterFileList.length < 1">
						<plus-outlined />
						<div style="margin-top: 8px">上传海报</div>
					</div>
				</a-upload>
				<div class="form-tip">建议使用 750 × 1011 的竖版图片，最大 5MB。未配置时继续使用小程序内置默认海报。</div>
				<a-button v-if="formState.promotion_poster_url" type="link" class="restore-button" @click="restoreDefaultPoster">恢复默认海报</a-button>
			</a-form-item>

			<a-form-item v-for="group in rateGroups" :key="group.key" :label="group.label">
				<a-space>
					<a-input-number
						v-for="(_, index) in formState[group.key]"
						:key="index"
						v-model:value="formState[group.key][index]"
						:min="0"
						:max="100"
						:precision="2"
						style="width: 125px"
						:addon-before="levelNames[index]"
						addon-after="%"
					/>
				</a-space>
				<div class="form-tip">{{ group.tip }}</div>
			</a-form-item>

			<a-form-item label="最低提现金额">
				<a-input-number v-model:value="formState.min_withdraw_amount" :min="0" :precision="2" style="width: 200px" addon-after="元" />
			</a-form-item>
			<a-form-item label="提现规则">
				<a-space>
					<a-input-number v-model:value="formState.withdraw_reserve_amount" :min="0" :precision="2" addon-before="保留余额" addon-after="元" />
					<a-input-number v-model:value="formState.withdraw_fee_rate" :min="0" :max="100" :precision="2" addon-before="手续费" addon-after="%" />
					<a-input-number v-model:value="formState.commission_freeze_days" :min="0" :max="365" addon-before="冻结" addon-after="天" />
				</a-space>
			</a-form-item>
			<a-form-item label="纸质资料佣金">
				<a-input-number v-model:value="formState.paper_commission_per_kind" :min="0" :precision="2" addon-after="元/种" />
			</a-form-item>

			<a-form-item label="分销说明">
				<a-textarea v-model:value="formState.description" :rows="4" placeholder="请输入分销说明，用户申请时会看到此说明" />
			</a-form-item>

			<a-form-item :wrapper-col="{ offset: 6, span: 18 }">
				<a-button type="primary" html-type="submit" :loading="loading">保存配置</a-button>
				<a-button style="margin-left: 12px" @click="loadConfig">重置</a-button>
			</a-form-item>
		</a-form>
	</div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { message } from 'ant-design-vue';
import type { UploadFile } from 'ant-design-vue';
import { PlusOutlined } from '@ant-design/icons-vue';
import { getDistributionConfig, updateDistributionConfig } from '@/api/distributor';
import { uploadImage } from '@/api/upload';
import { responseData } from '@/api/response-data';
import { getProxiedImageUrl } from '@/utils/imageProxy';

const loading = ref(false);
const posterUploading = ref(false);
const posterFileList = ref<UploadFile[]>([]);
const formState = ref({
	max_level: 3,
	commission_rates: [20, 25, 30],
	base_commission_rates: [20, 25, 30],
	direct_commission_rates: [5, 6, 8],
	indirect_commission_rates: [0, 3, 4],
	min_withdraw_amount: 100,
	withdraw_reserve_amount: 20,
	withdraw_fee_rate: 5,
	commission_freeze_days: 15,
	paper_commission_per_kind: 1,
	is_enabled: 1,
	description: '',
	promotion_poster_url: '',
});

const levelNames = ['初级', '中级', '高级'];
const rateGroups = [
	{
		key: 'base_commission_rates',
		label: '基础佣金',
		tip: '代理本人推广用户购买线上资料时，按订单实付金额计算。',
	},
	{
		key: 'direct_commission_rates',
		label: '直推团队佣金',
		tip: '直属代理产生线上订单时，上级按自身等级获得佣金。',
	},
	{
		key: 'indirect_commission_rates',
		label: '间推团队佣金',
		tip: '二级团队产生线上订单时，上级按自身等级获得佣金。',
	},
];

const syncPosterFileList = () => {
	posterFileList.value = formState.value.promotion_poster_url
		? [
				{
					uid: '-1',
					name: '代理宣传海报',
					status: 'done',
					url: getProxiedImageUrl(formState.value.promotion_poster_url),
				},
			]
		: [];
};

const beforePosterUpload = (file: File) => {
	if (!file.type.startsWith('image/')) {
		message.error('只能上传图片文件');
		return false;
	}
	if (file.size / 1024 / 1024 >= 5) {
		message.error('图片大小不能超过 5MB');
		return false;
	}
	return true;
};

const handlePosterUpload = async ({ file, onSuccess, onError }: any) => {
	posterUploading.value = true;
	try {
		const response = await uploadImage(file as File);
		const imageUrl = response.url || response.imageUrl;
		if (!imageUrl) throw new Error('上传失败：未返回图片地址');
		formState.value.promotion_poster_url = imageUrl;
		syncPosterFileList();
		onSuccess?.(response, file);
	} catch (error: any) {
		message.error(error?.message || '海报上传失败');
		onError?.(error);
	} finally {
		posterUploading.value = false;
	}
};

const handlePosterRemove = () => {
	formState.value.promotion_poster_url = '';
	posterFileList.value = [];
	return true;
};

const restoreDefaultPoster = () => {
	handlePosterRemove();
	message.success('已恢复内置默认海报，请点击保存配置');
};

onMounted(() => {
	loadConfig();
});

const loadConfig = async () => {
	try {
		const res = responseData<any>(await getDistributionConfig(), {});
		if (res) {
			formState.value = {
				max_level: res.max_level ?? 3,
				commission_rates: Array.isArray(res.commission_rates) ? res.commission_rates : JSON.parse(res.commission_rates || '[20, 25, 30]'),
				base_commission_rates: res.base_commission_rates || [20, 25, 30],
				direct_commission_rates: res.direct_commission_rates || [5, 6, 8],
				indirect_commission_rates: res.indirect_commission_rates || [0, 3, 4],
				min_withdraw_amount: Number(res.min_withdraw_amount ?? 100),
				withdraw_reserve_amount: Number(res.withdraw_reserve_amount ?? 20),
				withdraw_fee_rate: Number(res.withdraw_fee_rate ?? 5),
				commission_freeze_days: Number(res.commission_freeze_days ?? 15),
				paper_commission_per_kind: Number(res.paper_commission_per_kind ?? 1),
				is_enabled: res.is_enabled !== undefined ? res.is_enabled : 1,
				description: res.description || '',
				promotion_poster_url: res.promotion_poster_url || '',
			};
			syncPosterFileList();

			// 确保分成比例数组长度不超过最大层级数
			if (formState.value.commission_rates.length > formState.value.max_level) {
				formState.value.commission_rates = formState.value.commission_rates.slice(0, formState.value.max_level);
			}
		}
	} catch (error: any) {
		message.error(error.msg || '加载配置失败');
	}
};

const handleSubmit = async () => {
	loading.value = true;
	try {
		await updateDistributionConfig({
			max_level: formState.value.max_level,
			commission_rates: formState.value.base_commission_rates,
			base_commission_rates: formState.value.base_commission_rates,
			direct_commission_rates: formState.value.direct_commission_rates,
			indirect_commission_rates: formState.value.indirect_commission_rates,
			min_withdraw_amount: formState.value.min_withdraw_amount,
			withdraw_reserve_amount: formState.value.withdraw_reserve_amount,
			withdraw_fee_rate: formState.value.withdraw_fee_rate,
			commission_freeze_days: formState.value.commission_freeze_days,
			paper_commission_per_kind: formState.value.paper_commission_per_kind,
			is_enabled: formState.value.is_enabled,
			description: formState.value.description,
			promotion_poster_url: formState.value.promotion_poster_url,
		});
		message.success('配置保存成功');
	} catch (error: any) {
		message.error(error.msg || '保存失败');
	} finally {
		loading.value = false;
	}
};
</script>

<style scoped lang="scss">
.distribution-config {
	padding: 24px;
}
.config-tip {
	margin-bottom: 24px;
}
.form-tip {
	margin-top: 8px;
	color: #999;
	font-size: 12px;
}
.restore-button {
	padding-left: 0;
}
</style>
