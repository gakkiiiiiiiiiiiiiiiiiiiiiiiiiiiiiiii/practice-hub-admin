import request from '@/utils/request';

/**
 * 获取考试配置列表
 */
export function getExamConfigList(courseId?: number) {
	return request.get('/admin/exam/config/list', {
		params: courseId ? { courseId } : {},
	});
}

/**
 * 获取考试配置详情
 */
export function getExamConfig(id: number) {
	return request.get(`/admin/exam/config/${id}`);
}

/**
 * 创建考试配置
 */
export function createExamConfig(data: any) {
	return request.post('/admin/exam/config', data);
}

/**
 * 更新考试配置
 */
export function updateExamConfig(id: number, data: any) {
	return request.put(`/admin/exam/config/${id}`, data);
}

/**
 * 删除考试配置
 */
export function deleteExamConfig(id: number) {
	return request.delete(`/admin/exam/config/${id}`);
}
