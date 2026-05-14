import request from '@/utils/request'

// 课程管理
export function getCourseList(params?: any) {
  return request.get('/admin/courses', { params })
}

export function createCourse(data: any) {
  return request.post('/admin/courses', data)
}

export function updateCourse(id: number, data: any) {
  return request.put(`/admin/courses/${id}`, data)
}

export function updateCourseSort(id: number, sort: number) {
  return updateCourse(id, { sort })
}

export function getCourseDetail(id: number) {
  return request.get(`/admin/courses/${id}`)
}

export function deleteCourse(id: number) {
  return request.delete(`/admin/courses/${id}`)
}

// 相关推荐管理
export function getRecommendations(courseId?: number | null) {
  const params = courseId !== undefined && courseId !== null ? { courseId } : {};
  return request.get('/admin/courses/recommendations', { params })
}

export function updateRecommendations(data: { courseId?: number | null; recommendedCourseIds: number[] }) {
  return request.put('/admin/courses/recommendations', data)
}

// 批量删除课程
export function batchDeleteCourses(ids: number[]) {
  return request.post('/admin/courses/batch-delete', { ids })
}

// 批量更新课程状态
export function batchUpdateCourseStatus(ids: number[], status: number) {
  return request.post('/admin/courses/batch-update-status', { ids, status })
}

// 生成课程 PDF 图片预览缓存
export function generateCoursePreviewCache(id: number, force = true) {
  return request.post(`/admin/courses/${id}/preview-cache`, { force })
}

// 生成所有文件类 PDF 课程缺失的图片预览缓存
export function generateMissingCoursePreviewCaches() {
  return request.post('/admin/courses/preview-cache/missing')
}

// 查询课程 PDF 图片预览缓存生成进度
export function getCoursePreviewCacheProgress() {
  return request.get('/admin/courses/preview-cache/progress')
}
