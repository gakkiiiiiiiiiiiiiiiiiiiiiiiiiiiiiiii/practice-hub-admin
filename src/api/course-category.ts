import request from '@/utils/request'

export function getCourseCategoryTree(params?: { status?: number }) {
  return request.get('/admin/course-categories', { params })
}

export function createCourseCategory(data: any) {
  return request.post('/admin/course-categories', data)
}

export function updateCourseCategory(id: number, data: any) {
  return request.put(`/admin/course-categories/${id}`, data)
}

export function deleteCourseCategory(id: number) {
  return request.delete(`/admin/course-categories/${id}`)
}
