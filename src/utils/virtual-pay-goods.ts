import { message } from 'ant-design-vue';

export type VirtualPayGoodsSyncNotice = {
	syncing?: boolean;
	wait_minutes?: number;
	message?: string;
};

export const DEFAULT_VIRTUAL_PAY_GOODS_WAIT_MINUTES = 10;

export const getVirtualPayGoodsSyncMessage = (notice?: VirtualPayGoodsSyncNotice | null) => {
	if (!notice?.syncing) return '';
	return (
		notice.message ||
		`虚拟道具价格正在同步，约 ${notice.wait_minutes || DEFAULT_VIRTUAL_PAY_GOODS_WAIT_MINUTES} 分钟后生效`
	);
};

/** 管理端保存/调价后提示虚拟道具同步 */
export const notifyVirtualPayGoodsPriceSync = (payload?: { virtual_pay_goods_sync?: VirtualPayGoodsSyncNotice } | null) => {
	const text = getVirtualPayGoodsSyncMessage(payload?.virtual_pay_goods_sync);
	if (!text) return false;
	message.warning(text, 6);
	return true;
};
