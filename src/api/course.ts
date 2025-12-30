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

