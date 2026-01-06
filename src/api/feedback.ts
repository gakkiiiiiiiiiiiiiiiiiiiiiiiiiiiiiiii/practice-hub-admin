import request from '@/utils/request';

export interface CreateFeedbackDto {
	type: 'bug' | 'style' | 'feature';
	description: string;
	images?: string[];
}

export interface UpdateFeedbackDto {
	status?: 'pending' | 'processing' | 'resolved' | 'rejected';
	reply?: string;
}

export interface GetFeedbackListParams {
	page?: number;
	pageSize?: number;
	type?: 'bug' | 'style' | 'feature';
	status?: 'pending' | 'processing' | 'resolved' | 'rejected';
	user_id?: number;
}

export interface Feedback {
	id: number;
	user_id: number;
	type: 'bug' | 'style' | 'feature';
	description: string;
	images: string[];
	status: 'pending' | 'processing' | 'resolved' | 'rejected';
	reply?: string;
	handler_id?: number;
	create_time: string;
	update_time: string;
	user?: {
		id: number;
		nickname: string;
		avatar: string;
	};
}

/**
 * 创建反馈（小程序端）
 */
export function createFeedback(data: CreateFeedbackDto) {
	return request.post('/app/feedback', data);
}

/**
 * 创建反馈（管理后台）
 */
export function createAdminFeedback(data: CreateFeedbackDto) {
	return request.post('/admin/feedback', data);
}

/**
 * 获取我的反馈列表（小程序端）
 */
export function getMyFeedbackList(params?: { page?: number; pageSize?: number }) {
	return request.get('/app/feedback', { params });
}

/**
 * 获取反馈详情（小程序端）
 */
export function getFeedbackDetail(id: number) {
	return request.get(`/app/feedback/${id}`);
}

/**
 * 获取反馈列表（管理后台）
 */
export function getFeedbackList(params?: GetFeedbackListParams) {
	return request.get('/admin/feedback', { params });
}

/**
 * 获取反馈详情（管理后台）
 */
export function getAdminFeedbackDetail(id: number) {
	return request.get(`/admin/feedback/${id}`);
}

/**
 * 更新反馈（管理后台）
 */
export function updateFeedback(id: number, data: UpdateFeedbackDto) {
	return request.put(`/admin/feedback/${id}`, data);
}

/**
 * 删除反馈（管理后台）
 */
export function deleteFeedback(id: number) {
	return request.delete(`/admin/feedback/${id}`);
}

