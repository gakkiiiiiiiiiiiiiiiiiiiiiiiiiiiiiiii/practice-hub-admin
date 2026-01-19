import { get, put } from '@/utils/request';

/**
 * 获取售后申请列表（管理后台）
 */
export const getAfterSaleList = (params?: any) => {
	return get('/admin/after-sale/list', params);
};

/**
 * 处理售后申请（管理后台）
 */
export const processAfterSale = (id: number, data: { status: number; admin_reply?: string }) => {
	return put(`/admin/after-sale/${id}/process`, data);
};
