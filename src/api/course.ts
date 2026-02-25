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